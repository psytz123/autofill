import {
  FuelType,
  Location,
  LocationType,
  Order,
  OrderStatus,
  Vehicle,
  PaymentMethod,
  PaymentMethodType,
  User,
} from "./types";

// Base URL for API calls
const API_BASE_URL = "https://autofill-app.replit.app/api";
// For local development, use:
// const API_BASE_URL = 'http://localhost:5000/api';

// Global fetch options
const DEFAULT_OPTIONS: RequestInit = {
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  credentials: "include", // Include cookies for session authentication
};

/**
 * Generic API request function
 */
async function apiRequest<T>(
  endpoint: string,
  method: string = "GET",
  data?: any,
  customOptions: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const options: RequestInit = {
    ...DEFAULT_OPTIONS,
    ...customOptions,
    method,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);

    // If the response is not ok, throw an error
    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If parsing the error response fails, use the default error message
      }
      throw new Error(errorMessage);
    }

    // Check if response has content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return null as T;
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Authentication API calls
 */
export const auth = {
  login: async (username: string, password: string): Promise<User> => {
    return apiRequest<User>("/login", "POST", { username, password });
  },

  register: async (userData: {
    username: string;
    password: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<User> => {
    return apiRequest<User>("/register", "POST", userData);
  },

  logout: async (): Promise<void> => {
    return apiRequest<void>("/logout", "POST");
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest<User>("/user");
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    return apiRequest<User>("/user", "PATCH", userData);
  },
};

/**
 * Vehicle API calls
 */
export const vehicles = {
  getAll: async (): Promise<Vehicle[]> => {
    return apiRequest<Vehicle[]>("/vehicles");
  },

  get: async (id: number): Promise<Vehicle> => {
    return apiRequest<Vehicle>(`/vehicles/${id}`);
  },

  create: async (vehicleData: {
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color?: string;
    fuelType: FuelType;
    fuelCapacity?: number;
  }): Promise<Vehicle> => {
    return apiRequest<Vehicle>("/vehicles", "POST", vehicleData);
  },

  update: async (
    id: number,
    vehicleData: Partial<Vehicle>,
  ): Promise<Vehicle> => {
    return apiRequest<Vehicle>(`/vehicles/${id}`, "PATCH", vehicleData);
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/vehicles/${id}`, "DELETE");
  },
};

/**
 * Location API calls
 */
export const locations = {
  getAll: async (): Promise<Location[]> => {
    return apiRequest<Location[]>("/locations");
  },

  get: async (id: number): Promise<Location> => {
    return apiRequest<Location>(`/locations/${id}`);
  },

  create: async (locationData: {
    name: string;
    address: string;
    type: LocationType;
    coordinates: { lat: number; lng: number };
  }): Promise<Location> => {
    return apiRequest<Location>("/locations", "POST", locationData);
  },

  update: async (
    id: number,
    locationData: Partial<Location>,
  ): Promise<Location> => {
    return apiRequest<Location>(`/locations/${id}`, "PATCH", locationData);
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/locations/${id}`, "DELETE");
  },
};

/**
 * Order API calls
 */
export const orders = {
  getAll: async (): Promise<Order[]> => {
    return apiRequest<Order[]>("/orders");
  },

  get: async (id: number): Promise<Order> => {
    return apiRequest<Order>(`/orders/${id}`);
  },

  getRecent: async (limit: number = 5): Promise<Order[]> => {
    return apiRequest<Order[]>(`/orders/recent?limit=${limit}`);
  },

  create: async (orderData: {
    vehicleId: number;
    locationId: number;
    fuelType: FuelType;
    amount: number;
    price: number;
    total: number;
    scheduledFor?: string;
  }): Promise<Order> => {
    return apiRequest<Order>("/orders", "POST", orderData);
  },

  createEmergency: async (orderData: {
    vehicleId: number;
    location: {
      address: string;
      coordinates: { lat: number; lng: number };
    };
    fuelType: FuelType;
    amount: number;
  }): Promise<Order> => {
    return apiRequest<Order>("/orders/emergency", "POST", orderData);
  },

  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    return apiRequest<Order>(`/orders/${id}/status`, "PATCH", { status });
  },

  cancel: async (id: number): Promise<Order> => {
    return apiRequest<Order>(`/orders/${id}/cancel`, "POST");
  },
};

/**
 * Payment method API calls
 */
export const paymentMethods = {
  getAll: async (): Promise<PaymentMethod[]> => {
    return apiRequest<PaymentMethod[]>("/payment-methods");
  },

  get: async (id: number): Promise<PaymentMethod> => {
    return apiRequest<PaymentMethod>(`/payment-methods/${id}`);
  },

  create: async (paymentData: {
    type: PaymentMethodType;
    stripePaymentMethodId: string;
  }): Promise<PaymentMethod> => {
    return apiRequest<PaymentMethod>("/payment-methods", "POST", paymentData);
  },

  setDefault: async (id: number): Promise<PaymentMethod> => {
    return apiRequest<PaymentMethod>(`/payment-methods/${id}/default`, "POST");
  },

  delete: async (id: number): Promise<void> => {
    return apiRequest<void>(`/payment-methods/${id}`, "DELETE");
  },
};

/**
 * Fuel price API calls
 */
export const fuel = {
  getPrices: async (stateCode: string): Promise<Record<FuelType, number>> => {
    return apiRequest<Record<FuelType, number>>(
      `/fuel/prices?state=${stateCode}`,
    );
  },
};

/**
 * Push notification API calls
 */
export const notifications = {
  subscribe: async (subscription: PushSubscriptionJSON): Promise<void> => {
    return apiRequest<void>("/push/subscribe", "POST", { subscription });
  },

  unsubscribe: async (endpoint: string): Promise<void> => {
    return apiRequest<void>("/push/unsubscribe", "POST", { endpoint });
  },
};

// Helper type for Push Notification subscription
interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
