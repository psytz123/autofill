/**
 * OrderTrackingService
 * Handles WebSocket connection to server for real-time order tracking
 * With improved error handling and compatibility with Replit environment
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

/**
 * Simplified WebSocket service for order tracking
 * With special handling for development environments like Replit
 */
class OrderTrackingService {
  private socket: WebSocket | null = null;
  private listeners: Partial<OrderTrackingEvents> = {};
  private isAuthenticated = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private userId: number | null = null;
  private trackingOrderId: number | null = null;
  
  // Special flag for development mode
  private readonly isDevelopment = import.meta.env.MODE === 'development';

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    // Skip if already connected, connecting, or if we're in development mode
    if (this.socket || this.isConnecting || this.isDevelopment) {
      return;
    }
    
    this.isConnecting = true;
    
    try {
      // Simple approach - use protocol and host from current page
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;
      
      console.log('Connecting to WebSocket at:', wsUrl);
      
      this.socket = new WebSocket(wsUrl);
      
      // Set up event handlers
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Authenticate if user ID is already set
        if (this.userId !== null) {
          this.authenticate(this.userId);
        }
        
        // Notify listeners
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
              if (this.trackingOrderId !== null) {
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
              console.error('WebSocket server error:', data.message);
              if (this.listeners.error) {
                this.listeners.error(new Error(data.message));
              }
              break;
              
            default:
              console.warn('Unknown message type:', data.type);
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
        
        // Notify listeners
        if (this.listeners.disconnected) {
          this.listeners.disconnected();
        }
        
        // Attempt to reconnect with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(3000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
          setTimeout(() => this.connect(), delay);
        }
      };
      
      this.socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        
        if (this.listeners.error) {
          this.listeners.error(new Error('WebSocket connection error'));
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.socket = null;
      this.isConnecting = false;
      
      if (this.listeners.error) {
        this.listeners.error(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  
  /**
   * Authenticate with the WebSocket server
   */
  authenticate(userId: number): void {
    this.userId = userId;
    
    // If in development mode, skip actual WebSocket operations
    if (this.isDevelopment) {
      console.log('Development mode: Skipping WebSocket authentication');
      return;
    }
    
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
    
    // If in development mode, skip actual WebSocket operations
    if (this.isDevelopment) {
      console.log('Development mode: Skipping WebSocket order tracking');
      return;
    }
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.isAuthenticated) {
      if (!this.isConnecting && this.userId !== null) {
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
    
    // If in development mode, skip actual WebSocket operations
    if (this.isDevelopment) {
      console.log('Development mode: Skipping WebSocket disconnect');
      return;
    }
    
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