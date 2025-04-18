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
  InsertLocation,
  users,
  vehicles,
  orders,
  paymentMethods,
  locations
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

import connectPg from "connect-pg-simple";
import { eq, desc, and } from "drizzle-orm";
import { pool, db } from "./db";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle as Vehicle;
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    const results = await db.select()
      .from(vehicles)
      .where(eq(vehicles.userId, userId))
      .orderBy(desc(vehicles.id));
    return results as Vehicle[];
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(insertVehicle).returning();
    return vehicle as Vehicle;
  }

  async updateVehicle(id: number, data: Partial<InsertVehicle>): Promise<Vehicle> {
    const [vehicle] = await db
      .update(vehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    
    return vehicle as Vehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  // Order methods
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (order) {
      const result = { ...order } as any;
      
      // Load related entities if needed
      if (order.vehicleId) {
        const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, order.vehicleId));
        if (vehicle) {
          result.vehicle = vehicle as Vehicle;
        }
      }
      
      if (order.locationId) {
        const [location] = await db.select().from(locations).where(eq(locations.id, order.locationId));
        if (location) {
          result.location = location as Location;
        }
      }
      
      if (order.paymentMethodId) {
        const [paymentMethod] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, order.paymentMethodId));
        if (paymentMethod) {
          result.paymentMethod = paymentMethod;
        }
      }
      
      return result as Order;
    }
    
    return undefined;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    const orderList = await db.select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.id));
    
    // Load vehicles for each order
    const results = await Promise.all(orderList.map(async (order: any) => {
      const result = { ...order } as any;
      
      if (order.vehicleId) {
        const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, order.vehicleId));
        if (vehicle) {
          result.vehicle = vehicle as Vehicle;
        }
      }
      
      return result as Order;
    }));
    
    return results;
  }

  async getRecentOrdersByUserId(userId: number, limit: number = 2): Promise<Order[]> {
    const orderList = await db.select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.id))
      .limit(limit);
    
    // Load vehicles for each order
    const results = await Promise.all(orderList.map(async (order: any) => {
      const result = { ...order } as any;
      
      if (order.vehicleId) {
        const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, order.vehicleId));
        if (vehicle) {
          result.vehicle = vehicle as Vehicle;
        }
      }
      
      return result as Order;
    }));
    
    return results;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    // Calculate total price based on fuel type and amount
    const fuelPrices = {
      "REGULAR_UNLEADED": 3.99,
      "PREMIUM_UNLEADED": 4.59,
      "DIESEL": 4.29
    };
    
    const fuelPrice = fuelPrices[insertOrder.fuelType] || 3.99;
    const totalPrice = parseFloat((insertOrder.amount * fuelPrice).toFixed(2));
    
    const [order] = await db.insert(orders)
      .values({
        ...insertOrder,
        totalPrice,
      })
      .returning();
    
    return order as Order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ 
        status: status as any,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    
    if (!order) {
      throw new Error("Order not found");
    }
    
    return order as Order;
  }

  // Payment method methods
  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [method] = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id));
    return method;
  }

  async getPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]> {
    return await db.select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId));
  }

  async createPaymentMethod(insertMethod: InsertPaymentMethod): Promise<PaymentMethod> {
    const [method] = await db.insert(paymentMethods).values(insertMethod).returning();
    return method;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  // Location methods
  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location as Location;
  }

  async getLocationsByUserId(userId: number): Promise<Location[]> {
    const results = await db.select()
      .from(locations)
      .where(eq(locations.userId, userId));
    return results as Location[];
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).returning();
    return location as Location;
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }
}

export const storage = new DatabaseStorage();
