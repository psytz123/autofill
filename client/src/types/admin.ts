// Admin API response types

// Admin Dashboard Stats
export interface AdminDashboardStats {
  totalOrders: number;
  activeDrivers: number;
  totalDrivers: number;
  revenue: number;
  customers: number;
  recentOrders?: AdminOrder[];
  ordersByStatus: Array<{
    name: string;
    value: number;
  }>;
  deliveriesByDay: Array<{
    day: string;
    deliveries: number;
  }>;
}

// Order types
export interface AdminOrder {
  id: number;
  userId: number;
  locationId: number | null;
  vehicleId: number | null;
  paymentMethodId: number | null;
  fuelType: string;
  amount: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Order assignment types
export interface OrderAssignment {
  id: number;
  orderId: number;
  driverId: number;
  assignedAt: string;
  status: string;
  updatedAt: string;
}

// Driver types
export interface AdminDriver {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  currentLocationLat: number | null;
  currentLocationLng: number | null;
  vehicleModel: string;
  vehicleLicense: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// Combined order with assignment and driver
export interface AssignedOrder extends AdminOrder {
  assignment_id: number;
  assigned_at: string;
  assignment_status: string;
  driver_id: number;
  driver_name: string;
  driver_phone: string;
  driver_email: string;
  estimated_delivery_time?: string;
}