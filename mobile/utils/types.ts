/**
 * Shared types between web and mobile applications
 * These match the types defined in shared/schema.ts
 */

// Location types
export enum LocationType {
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}

export interface Location {
  id: number;
  userId: number;
  name: string;
  address: string;
  type: LocationType;
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
}

// Vehicle types
export interface Vehicle {
  id: number;
  userId: number;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  fuelType: FuelType;
  tankSize: number;
  createdAt: Date;
}

// Fuel types
export enum FuelType {
  REGULAR_UNLEADED = "REGULAR_UNLEADED",
  PREMIUM_UNLEADED = "PREMIUM_UNLEADED",
  DIESEL = "DIESEL",
}

// Payment method types
export interface PaymentMethod {
  id: number;
  userId: number;
  type: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
  createdAt: Date;
}

// Order types
export interface Order {
  id: number;
  userId: number;
  vehicleId: number;
  locationId: number;
  paymentMethodId: number;
  fuelType: FuelType;
  amount: number;
  price: number;
  total: number;
  status: string;
  scheduledFor: Date;
  createdAt: Date;
}

// Subscription types
export enum SubscriptionType {
  BASIC = "BASIC",
  PREMIUM = "PREMIUM",
  FAMILY = "FAMILY",
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  type: SubscriptionType;
  price: number;
  description: string;
  features: string[];
  active: boolean;
}

// User types
export interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
