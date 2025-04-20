// User model
export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
}

// Vehicle model
export interface Vehicle {
  id: number;
  userId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  fuelType: FuelType;
  fuelCapacity?: number;
  createdAt: string;
}

// Location model
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
  createdAt?: string;
}

// Order model
export interface Order {
  id: number;
  userId: number;
  vehicleId: number;
  locationId: number;
  driverId?: number;
  status: OrderStatus;
  fuelType: FuelType;
  amount: number;
  price: number;
  total: number;
  scheduledFor?: string;
  completedAt?: string;
  createdAt: string;
  isEmergency?: boolean;
  vehicle?: Vehicle;
  location?: Location;
}

// Payment method model
export interface PaymentMethod {
  id: number;
  userId: number;
  type: PaymentMethodType;
  lastFour: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId: string;
  createdAt: string;
}

// Subscription plan model
export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: BillingInterval;
  features: string[];
  isActive: boolean;
  stripePriceId?: string;
  createdAt: string;
}

// Support request model
export interface SupportRequest {
  id: number;
  userId: number;
  type: SupportRequestType;
  subject: string;
  status: SupportRequestStatus;
  createdAt: string;
  messages?: SupportRequestMessage[];
}

// Support request message model
export interface SupportRequestMessage {
  id: number;
  requestId: number;
  fromUser: boolean;
  message: string;
  createdAt: string;
}

// Driver model
export interface Driver {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  isAvailable: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  rating?: number;
  createdAt: string;
}

// Order assignment model
export interface OrderAssignment {
  id: number;
  orderId: number;
  driverId: number;
  status: OrderAssignmentStatus;
  assignedAt: string;
  acceptedAt?: string;
  rejectedReason?: string;
  completedAt?: string;
  order?: Order;
  driver?: Driver;
}

// Push notification subscription model
export interface PushSubscription {
  id: number;
  userId: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: string;
}

// Enums
export enum FuelType {
  REGULAR_UNLEADED = "REGULAR_UNLEADED",
  PREMIUM_UNLEADED = "PREMIUM_UNLEADED",
  DIESEL = "DIESEL",
}

export enum LocationType {
  HOME = "HOME",
  WORK = "WORK",
  OTHER = "OTHER",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  ASSIGNED = "ASSIGNED",
  EN_ROUTE = "EN_ROUTE",
  ARRIVED = "ARRIVED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentMethodType {
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  PAYPAL = "PAYPAL",
}

export enum BillingInterval {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  ANNUAL = "ANNUAL",
}

export enum SupportRequestType {
  BILLING = "BILLING",
  DELIVERY = "DELIVERY",
  TECHNICAL = "TECHNICAL",
  ACCOUNT = "ACCOUNT",
  OTHER = "OTHER",
}

export enum SupportRequestStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum OrderAssignmentStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
