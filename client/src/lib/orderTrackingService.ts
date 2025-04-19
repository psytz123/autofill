/**
 * OrderTrackingService
 * Handles WebSocket connection to server for real-time order tracking
 */

export interface OrderLocation {
  orderId: number;
  location: {
    lat: number;
    lng: number;
  };
  estimatedArrival: string;
}

export interface OrderStatusUpdate {
  orderId: number;
  status: string;
}

interface OrderTrackingEvents {
  driverLocation: (data: OrderLocation) => void;
  statusUpdate: (data: OrderStatusUpdate) => void;
  connected: () => void;
  disconnected: () => void;
  error: (error: Error) => void;
}

class OrderTrackingService {
  private socket: WebSocket | null = null;
  private listeners: Partial<OrderTrackingEvents> = {};
  private isAuthenticated = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private userId: number | null = null;
  private trackingOrderId: number | null = null;
  
  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket || this.isConnecting) return;
    
    this.isConnecting = true;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Get CSRF token if available
    let csrfToken = '';
    try {
      // Import dynamically to avoid circular dependencies
      const csrfTokenModule = require('../lib/csrfToken');
      if (csrfTokenModule && csrfTokenModule.getCsrfToken) {
        csrfToken = csrfTokenModule.getCsrfToken();
      }
    } catch (e) {
      console.warn('Could not load CSRF token for WebSocket', e);
    }
    
    // Add CSRF token as query parameter
    const wsUrl = `${protocol}//${window.location.host}/ws${csrfToken ? `?csrf=${csrfToken}` : ''}`;
    console.log('Connecting to WebSocket at', wsUrl);
    
    try {
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Authenticate if user ID is set
        if (this.userId) {
          this.authenticate(this.userId);
        }
        
        if (this.listeners.connected) {
          this.listeners.connected();
        }
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'auth_success':
              this.isAuthenticated = true;
              // Resume tracking if there was an order being tracked
              if (this.trackingOrderId) {
                this.trackOrder(this.trackingOrderId);
              }
              break;
              
            case 'driver_location':
              if (this.listeners.driverLocation) {
                this.listeners.driverLocation(data);
              }
              break;
              
            case 'order_status_update':
              if (this.listeners.statusUpdate) {
                this.listeners.statusUpdate(data);
              }
              break;
              
            case 'error':
              console.error('WebSocket error:', data.message);
              if (this.listeners.error) {
                this.listeners.error(new Error(data.message));
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.socket = null;
        this.isAuthenticated = false;
        this.isConnecting = false;
        
        if (this.listeners.disconnected) {
          this.listeners.disconnected();
        }
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), 3000);
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.listeners.error) {
          this.listeners.error(new Error('WebSocket connection error'));
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
      if (this.listeners.error) {
        this.listeners.error(error as Error);
      }
    }
  }
  
  /**
   * Authenticate with the WebSocket server
   */
  authenticate(userId: number): void {
    this.userId = userId;
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect();
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'auth',
      userId
    }));
  }
  
  /**
   * Start tracking an order
   */
  trackOrder(orderId: number): void {
    this.trackingOrderId = orderId;
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
      if (!this.isConnecting && this.userId) {
        this.connect();
      }
      return;
    }
    
    this.socket.send(JSON.stringify({
      type: 'track_order',
      orderId
    }));
  }
  
  /**
   * Stop tracking all orders and disconnect
   */
  disconnect(): void {
    this.trackingOrderId = null;
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isAuthenticated = false;
  }
  
  /**
   * Register event listeners
   */
  on<K extends keyof OrderTrackingEvents>(
    event: K, 
    callback: OrderTrackingEvents[K]
  ): void {
    this.listeners[event] = callback;
  }
  
  /**
   * Remove event listener
   */
  off<K extends keyof OrderTrackingEvents>(event: K): void {
    delete this.listeners[event];
  }
}

// Export as singleton
export const orderTrackingService = new OrderTrackingService();