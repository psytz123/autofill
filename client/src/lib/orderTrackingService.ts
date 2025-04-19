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
   * Connect to WebSocket server with improved error handling and retry logic
   */
  async connect(): Promise<void> {
    // Skip if already connected or connecting
    if (this.socket || this.isConnecting) return;
    
    this.isConnecting = true;
    
    try {
      // Determine protocol based on current page
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      // Get CSRF token using dynamic import to avoid circular dependencies
      let csrfToken = '';
      try {
        const csrfModule = await import('@/lib/csrfToken');
        csrfToken = csrfModule.getCsrfToken();
      } catch (e) {
        console.warn('Could not load CSRF token for WebSocket', e);
      }
      
      // Create WebSocket URL with CSRF token if available
      // Handle both Replit and local development environments
      let wsUrl;
      
      if (window.location.href.includes('replit.dev')) {
        // For Replit, use the exact same host as the current page
        const replitUrl = new URL(window.location.href);
        wsUrl = `${protocol}//${replitUrl.host}/ws${csrfToken ? `?csrf=${csrfToken}` : ''}`;
      } else {
        // For local development
        wsUrl = `${protocol}//localhost:5000/ws${csrfToken ? `?csrf=${csrfToken}` : ''}`;
      }
      
      console.log('Connecting to WebSocket at:', wsUrl);
      
      // Create new WebSocket connection with error handling
      try {
        this.socket = new WebSocket(wsUrl);
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        this.socket = null;
        throw error;
      }
      
      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
      
      if (this.listeners.error) {
        this.listeners.error(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
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
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
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
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(): void {
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
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    
    if (this.listeners.error) {
      this.listeners.error(new Error('WebSocket connection error'));
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