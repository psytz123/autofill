import { 
  User, 
  InsertUser, 
  Vehicle, 
  InsertVehicle, 
  Order, 
  InsertOrder, 
  PaymentMethod, 
  InsertPaymentMethod,
  Location,
  InsertLocation
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for CRUD operations
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehiclesByUserId(userId: number): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, data: Partial<InsertVehicle>): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByUserId(userId: number): Promise<Order[]>;
  getRecentOrdersByUserId(userId: number, limit?: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Payment method operations
  getPaymentMethod(id: number): Promise<PaymentMethod | undefined>;
  getPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]>;
  createPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  deletePaymentMethod(id: number): Promise<void>;
  
  // Location operations
  getLocation(id: number): Promise<Location | undefined>;
  getLocationsByUserId(userId: number): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  deleteLocation(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private orders: Map<number, Order>;
  private paymentMethods: Map<number, PaymentMethod>;
  private locations: Map<number, Location>;
  sessionStore: session.Store;
  
  private userIdCounter: number = 1;
  private vehicleIdCounter: number = 1;
  private orderIdCounter: number = 1;
  private paymentMethodIdCounter: number = 1;
  private locationIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.orders = new Map();
    this.paymentMethods = new Map();
    this.locations = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Add some sample data
    this.initializeData();
  }

  private initializeData() {
    // Add some sample saved locations
    this.locations.set(1, {
      id: 1,
      userId: 1,
      name: "Home",
      address: "456 Oak Avenue, Anytown, CA 91234",
      coordinates: { lat: 37.784, lng: -122.401 },
      type: "home",
      createdAt: new Date().toISOString()
    });
    
    this.locations.set(2, {
      id: 2,
      userId: 1,
      name: "Work",
      address: "789 Business Park, Anytown, CA 91234",
      coordinates: { lat: 37.789, lng: -122.403 },
      type: "work",
      createdAt: new Date().toISOString()
    });
    
    this.locationIdCounter = 3;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date().toISOString();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values())
      .filter(vehicle => vehicle.userId === userId)
      .sort((a, b) => b.id - a.id); // Newest first
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleIdCounter++;
    const now = new Date().toISOString();
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, data: Partial<InsertVehicle>): Promise<Vehicle> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) throw new Error("Vehicle not found");
    
    const updatedVehicle: Vehicle = { 
      ...vehicle, 
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    this.vehicles.delete(id);
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.id - a.id); // Newest first
  }

  async getRecentOrdersByUserId(userId: number, limit: number = 2): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.id - a.id) // Newest first
      .slice(0, limit);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date().toISOString();
    
    // Calculate total price based on fuel type and amount
    const fuelPrices = {
      "REGULAR_UNLEADED": 3.99,
      "PREMIUM_UNLEADED": 4.59,
      "DIESEL": 4.29
    };
    
    const fuelPrice = fuelPrices[insertOrder.fuelType] || 3.99;
    const totalPrice = parseFloat((insertOrder.amount * fuelPrice).toFixed(2));
    
    const order: Order = { 
      ...insertOrder, 
      id,
      totalPrice,
      createdAt: now,
      updatedAt: now
    };
    
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    
    const updatedOrder: Order = { 
      ...order, 
      status: status as any,
      updatedAt: new Date().toISOString()
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Payment method methods
  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    return this.paymentMethods.get(id);
  }

  async getPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values())
      .filter(method => method.userId === userId);
  }

  async createPaymentMethod(insertMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = this.paymentMethodIdCounter++;
    const now = new Date().toISOString();
    const method: PaymentMethod = { 
      ...insertMethod, 
      id,
      createdAt: now,
      updatedAt: now
    };
    this.paymentMethods.set(id, method);
    return method;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    this.paymentMethods.delete(id);
  }

  // Location methods
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationsByUserId(userId: number): Promise<Location[]> {
    return Array.from(this.locations.values())
      .filter(location => location.userId === userId);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = this.locationIdCounter++;
    const now = new Date().toISOString();
    const location: Location = { 
      ...insertLocation, 
      id,
      createdAt: now
    };
    this.locations.set(id, location);
    return location;
  }

  async deleteLocation(id: number): Promise<void> {
    this.locations.delete(id);
  }
}

export const storage = new MemStorage();
