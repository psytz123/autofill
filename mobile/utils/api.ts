/**
 * API utility for connecting the mobile app to the backend server
 */

// Base URL for development - this would change in production
const API_BASE_URL = "http://localhost:5000/api";

// Types for API requests
type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method: RequestMethod;
  headers: Record<string, string>;
  body?: string;
}

// Generic API request function
export async function apiRequest<T>(
  endpoint: string,
  method: RequestMethod = "GET",
  data?: any,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const options: RequestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest", // For CSRF protection
    },
  };

  // Add body for non-GET requests
  if (method !== "GET" && data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`API Request: ${method} ${url}`);
    const response = await fetch(url, options);

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    // Parse JSON response
    const result = await response.json();
    return result as T;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Authentication related functions
export const auth = {
  login: async (username: string, password: string) => {
    return apiRequest<{ id: number; username: string }>("/login", "POST", {
      username,
      password,
    });
  },

  logout: async () => {
    return apiRequest<void>("/logout", "POST");
  },

  getCurrentUser: async () => {
    return apiRequest<{ id: number; username: string } | null>("/user").catch(
      () => null,
    ); // Return null if not authenticated
  },
};

// Vehicles related functions
export const vehicles = {
  getAll: async () => {
    return apiRequest<any[]>("/vehicles");
  },

  getById: async (id: number) => {
    return apiRequest<any>(`/vehicles/${id}`);
  },
};

// Locations related functions
export const locations = {
  getAll: async () => {
    return apiRequest<any[]>("/locations");
  },

  getById: async (id: number) => {
    return apiRequest<any>(`/locations/${id}`);
  },

  create: async (data: any) => {
    return apiRequest<any>("/locations", "POST", data);
  },
};

// Fuel prices related functions
export const fuel = {
  getPrices: async (state: string = "FL") => {
    return apiRequest<{
      REGULAR_UNLEADED: number;
      PREMIUM_UNLEADED: number;
      DIESEL: number;
    }>(`/fuel-prices?state=${state}`);
  },
};

// Orders related functions
export const orders = {
  getAll: async () => {
    return apiRequest<any[]>("/orders");
  },

  getRecent: async () => {
    return apiRequest<any[]>("/orders/recent");
  },

  create: async (orderData: any) => {
    return apiRequest<any>("/orders", "POST", orderData);
  },
};
