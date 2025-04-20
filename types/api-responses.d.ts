import { 
  User, 
  Vehicle, 
  Order, 
  Location, 
  PaymentMethod, 
  SubscriptionPlan,
  FuelType, 
  OrderStatus, 
  LocationType,
  PaymentMethodType,
  BillingInterval
} from '../shared/schema';

declare global {
  // API Responses
  namespace API {
    // Auth responses
    interface AuthResponse {
      user: User;
      token?: string;
    }

    // Error responses
    interface ErrorResponse {
      message: string;
      code?: string;
      errors?: Record<string, string[]>;
    }

    // Order responses
    interface OrderResponse {
      order: Order;
      nextSteps?: string[];
    }

    // Orders list response
    interface OrdersListResponse {
      orders: Order[];
      count: number;
      totalPages: number;
      currentPage: number;
    }

    // Vehicle responses
    interface VehicleResponse {
      vehicle: Vehicle;
    }

    interface VehiclesListResponse {
      vehicles: Vehicle[];
    }

    // Location responses
    interface LocationResponse {
      location: Location;
    }

    interface LocationsListResponse {
      locations: Location[];
    }

    // Payment method responses
    interface PaymentMethodResponse {
      paymentMethod: PaymentMethod;
    }

    interface PaymentMethodsListResponse {
      paymentMethods: PaymentMethod[];
    }

    // Fuel price response
    interface FuelPricesResponse {
      [key in FuelType]: number;
    }

    // StripeIntent response
    interface StripeIntentResponse {
      clientSecret: string;
      amount: number;
      currency: string;
    }

    // Subscription responses
    interface SubscriptionPlansResponse {
      plans: SubscriptionPlan[];
    }

    interface SubscriptionResponse {
      subscription: {
        id: string;
        status: string;
        currentPeriodEnd: string;
        plan: SubscriptionPlan;
      };
    }

    // Driver info for order tracking
    interface DriverLocationUpdate {
      orderId: number;
      location: {
        lat: number;
        lng: number;
      };
      estimatedArrival: string;
    }

    // WebSocket message type
    interface WebSocketMessage {
      type: 'auth' | 'auth_success' | 'track_order' | 'driver_location' | 'order_status_update' | 'error';
      [key: string]: any;
    }
  }
}

// Make this a module
export {};