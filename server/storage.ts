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
  SubscriptionPlan,
  InsertSubscriptionPlan,
  users,
  vehicles,
  orders,
  paymentMethods,
  locations,
  subscriptionPlans,
  FuelType,
  OrderStatus,
  LocationType,
  pushSubscriptions,
  InsertPushSubscription,
  PushSubscription,
  pointsTransactions,
  pointsRewards,
  InsertPointsTransaction,
  PointsTransaction,
  InsertPointsReward,
  PointsReward,
  PointsTransactionType
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, desc, and, sql } from "drizzle-orm";
import { pool, db } from "./db";
import pkg from "pg";
const { Pool } = pkg;

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for CRUD operations
export interface IStorage {
  // Session store
  sessionStore: session.Store;

  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(
    userId: number,
    stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string },
  ): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<User>;

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

  // Subscription operations
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  createSubscriptionPlan(
    plan: InsertSubscriptionPlan,
  ): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(
    id: number,
    data: Partial<InsertSubscriptionPlan>,
  ): Promise<SubscriptionPlan>;
  getUserSubscriptionPlan(
    userId: number,
  ): Promise<SubscriptionPlan | undefined>;
  
  // Points and rewards operations
  getUserPoints(userId: number): Promise<number>;
  addPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction>;
  getUserPointsTransactions(userId: number): Promise<PointsTransaction[]>;
  getAvailableRewards(): Promise<PointsReward[]>;
  getReward(id: number): Promise<PointsReward | undefined>;
  redeemReward(userId: number, rewardId: number): Promise<PointsTransaction>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  // Helper method to safely fetch vehicle by ID
  private async safeGetVehicleById(vehicleId: number): Promise<Vehicle | undefined> {
    try {
      // Always include tank_size column in the query
      const [vehicle] = await db
        .select({
          id: vehicles.id,
          userId: vehicles.userId,
          make: vehicles.make,
          model: vehicles.model,
          year: vehicles.year,
          licensePlate: vehicles.licensePlate,
          fuelType: vehicles.fuelType,
          tankSize: vehicles.tankSize,
          createdAt: vehicles.createdAt,
          updatedAt: vehicles.updatedAt,
        })
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId));
      
      if (!vehicle) return undefined;
      
      return { 
        ...vehicle, 
        fuelType: vehicle.fuelType as FuelType 
      } as Vehicle;
    } catch (error) {
      console.error("[DB] Error fetching vehicle:", error);
      
      try {
        // Fallback to a raw SQL query that explicitly includes tank_size
        const results = await db
          .execute(sql`
            SELECT id, user_id, make, model, year, license_plate, fuel_type, tank_size, created_at, updated_at
            FROM vehicles
            WHERE id = ${vehicleId}
          `);
        
        if (results.rows.length === 0) return undefined;
        
        const row = results.rows[0];
        return {
          id: row.id,
          userId: row.user_id,
          make: row.make,
          model: row.model, 
          year: row.year,
          licensePlate: row.license_plate,
          fuelType: row.fuel_type as FuelType,
          tankSize: row.tank_size,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        } as Vehicle;
      } catch (secondError) {
        console.error("[DB] Fallback error fetching vehicle:", secondError);
        return undefined;
      }
    }
  }

  constructor() {
    // We need to create a separate pool for session store using the node-postgres package
    // since connect-pg-simple is not compatible with @neondatabase/serverless
    // But we'll apply similar resilience settings as our main pool
    const pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5, // Fewer connections for session store
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      allowExitOnIdle: false,
      maxUses: 7500,
      maxLifetimeSeconds: 3600
    });
    
    // Add error handler specifically for session pool
    pgPool.on('error', (err) => {
      console.error('[Session DB] Pool error:', err);
      
      // For specific Neon database admin command errors, attempt to recover
      if (err.code === '57P01' || (err.message && err.message.includes('terminating connection due to administrator command'))) {
        console.info('[Session DB] Detected admin termination - this is expected with Neon and will auto-recover');
      }
    });

    this.sessionStore = new PostgresSessionStore({
      pool: pgPool,
      createTableIfMissing: true,
      tableName: 'session', // Explicitly name the table
      schemaName: 'public', // Ensure we're using the right schema
      disableTouch: false, // Update expiration time on access
      pruneSessionInterval: 60 * 15 // Cleanup every 15 minutes
    });
    
    console.log('[Session DB] Session store initialized');
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserStripeInfo(
    userId: number,
    stripeInfo: { stripeCustomerId?: string; stripeSubscriptionId?: string },
  ): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...stripeInfo,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.safeGetVehicleById(id);
  }

  async getVehiclesByUserId(userId: number): Promise<Vehicle[]> {
    try {
      // Always include tank_size column in the query
      const results = await db
        .select({
          id: vehicles.id,
          userId: vehicles.userId,
          make: vehicles.make,
          model: vehicles.model,
          year: vehicles.year,
          licensePlate: vehicles.licensePlate,
          fuelType: vehicles.fuelType,
          tankSize: vehicles.tankSize,
          createdAt: vehicles.createdAt,
          updatedAt: vehicles.updatedAt,
        })
        .from(vehicles)
        .where(eq(vehicles.userId, userId))
        .orderBy(desc(vehicles.id));
      
      return results.map(vehicle => ({
        ...vehicle,
        fuelType: vehicle.fuelType as FuelType
      })) as Vehicle[];
    } catch (error) {
      console.error("[DB] Error fetching vehicles:", error);
      try {
        // Fallback to a raw SQL query that explicitly includes tank_size
        const results = await db
          .execute(sql`
            SELECT id, user_id, make, model, year, license_plate, fuel_type, tank_size, created_at, updated_at
            FROM vehicles
            WHERE user_id = ${userId}
            ORDER BY id DESC
          `);
        
        // Transform the raw results to match Vehicle type
        return results.rows.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          make: row.make,
          model: row.model, 
          year: row.year,
          licensePlate: row.license_plate,
          fuelType: row.fuel_type as FuelType,
          tankSize: row.tank_size,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        })) as Vehicle[];
      } catch (secondError) {
        console.error("[DB] Fallback error fetching vehicles:", secondError);
        return [];
      }
    }
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db
      .insert(vehicles)
      .values(insertVehicle)
      .returning();
    return vehicle as Vehicle;
  }

  async updateVehicle(
    id: number,
    data: Partial<InsertVehicle>,
  ): Promise<Vehicle> {
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
      const result: Partial<Order> = { 
        ...order,
        fuelType: order.fuelType as FuelType,
        status: order.status as OrderStatus
      };

      // Load related entities if needed
      if (order.vehicleId) {
        const vehicle = await this.safeGetVehicleById(order.vehicleId);
        if (vehicle) {
          result.vehicle = vehicle;
        }
      }

      if (order.locationId) {
        const [location] = await db
          .select()
          .from(locations)
          .where(eq(locations.id, order.locationId));
        if (location) {
          result.location = {
            ...location,
            coordinates: location.coordinates as { lat: number; lng: number },
            type: location.type as LocationType
          };
        }
      }

      if (order.paymentMethodId) {
        const [paymentMethod] = await db
          .select()
          .from(paymentMethods)
          .where(eq(paymentMethods.id, order.paymentMethodId));
        if (paymentMethod) {
          result.paymentMethod = paymentMethod;
        }
      }

      return result as Order;
    }

    return undefined;
  }

  async getOrdersByUserId(userId: number): Promise<Order[]> {
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.id));

    // Load vehicles for each order
    const results = await Promise.all(
      orderList.map(async (order) => {
        const result: Partial<Order> = { 
          ...order,
          fuelType: order.fuelType as FuelType,
          status: order.status as OrderStatus
        };

        if (order.vehicleId) {
          const vehicle = await this.safeGetVehicleById(order.vehicleId);
          if (vehicle) {
            result.vehicle = vehicle;
          }
        }

        return result as Order;
      }),
    );

    return results;
  }

  async getRecentOrdersByUserId(
    userId: number,
    limit: number = 2,
  ): Promise<Order[]> {
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.id))
      .limit(limit);

    // Load vehicles for each order
    const results = await Promise.all(
      orderList.map(async (order) => {
        const result: Partial<Order> = { 
          ...order,
          fuelType: order.fuelType as FuelType,
          status: order.status as OrderStatus
        };

        if (order.vehicleId) {
          const vehicle = await this.safeGetVehicleById(order.vehicleId);
          if (vehicle) {
            result.vehicle = vehicle;
          }
        }

        return result as Order;
      }),
    );

    return results;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    try {
      console.log("CreateOrder received:", JSON.stringify(insertOrder, null, 2));
      
      // Calculate total price based on fuel type and amount
      const fuelPrices: Record<FuelType, number> = {
        [FuelType.REGULAR_UNLEADED]: 3.99,
        [FuelType.PREMIUM_UNLEADED]: 4.59,
        [FuelType.DIESEL]: 4.29,
      };

      const fuelPrice = fuelPrices[insertOrder.fuelType] || 3.99;
      
      // Convert to integer cents (multiply by 100) to match DB schema
      const totalPrice = Math.round(insertOrder.amount * fuelPrice * 100);
      
      console.log("Creating order with totalPrice:", totalPrice, "from amount:", insertOrder.amount, "and price:", fuelPrice);
      
      // Handle payment method correctly (null for emergency orders)
      // Create the order data with proper typing
      const orderData: any = {
        userId: insertOrder.userId,
        vehicleId: insertOrder.vehicleId,
        locationId: insertOrder.locationId,
        status: insertOrder.status,
        fuelType: insertOrder.fuelType,
        amount: insertOrder.amount,
        totalPrice
      };
      
      // Only include paymentMethodId if it exists
      if (insertOrder.paymentMethodId) {
        orderData.paymentMethodId = insertOrder.paymentMethodId;
      }
      
      console.log("Payment method ID in order:", insertOrder.paymentMethodId);
      
      console.log("Final order data for database:", orderData);
      
      // Insert into database
      const [order] = await db
        .insert(orders)
        .values(orderData)
        .returning();

      return {
        ...order,
        fuelType: order.fuelType as FuelType,
        status: order.status as OrderStatus
      } as Order;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      ...order,
      fuelType: order.fuelType as FuelType,
      status: order.status as OrderStatus
    } as Order;
  }

  // Payment method methods
  async getPaymentMethod(id: number): Promise<PaymentMethod | undefined> {
    const [method] = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id));
    return method;
  }

  async getPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]> {
    return await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.userId, userId));
  }

  async createPaymentMethod(
    insertMethod: InsertPaymentMethod,
  ): Promise<PaymentMethod> {
    const [method] = await db
      .insert(paymentMethods)
      .values(insertMethod)
      .returning();
    return method;
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  // Location methods
  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id));
    
    if (!location) return undefined;
    
    return {
      ...location,
      coordinates: location.coordinates as { lat: number; lng: number },
      type: location.type as LocationType
    };
  }

  async getLocationsByUserId(userId: number): Promise<Location[]> {
    const results = await db
      .select()
      .from(locations)
      .where(eq(locations.userId, userId));
    
    return results.map(location => ({
      ...location,
      coordinates: location.coordinates as { lat: number; lng: number },
      type: location.type as LocationType
    }));
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db
      .insert(locations)
      .values(insertLocation)
      .returning();
    
    return {
      ...location,
      coordinates: location.coordinates as { lat: number; lng: number },
      type: location.type as LocationType
    };
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Subscription plan methods
  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
    return plan as SubscriptionPlan;
  }

  async getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const plans = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.active, true));
    return plans as SubscriptionPlan[];
  }

  async createSubscriptionPlan(
    plan: InsertSubscriptionPlan,
  ): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
    return newPlan as SubscriptionPlan;
  }

  async updateSubscriptionPlan(
    id: number,
    data: Partial<InsertSubscriptionPlan>,
  ): Promise<SubscriptionPlan> {
    const [plan] = await db
      .update(subscriptionPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.id, id))
      .returning();

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    return plan as SubscriptionPlan;
  }

  async getUserSubscriptionPlan(
    userId: number,
  ): Promise<SubscriptionPlan | undefined> {
    // Get the user to check if they have a subscription
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user || !user.stripeSubscriptionId) {
      return undefined;
    }

    // Find all plans
    const plans = await this.getActiveSubscriptionPlans();

    // This is a simplified approach. In production, you would query Stripe
    // to get the exact product/price ID associated with the subscription
    // and match it with the plans in the database.

    // For now, we'll return the first active plan as a placeholder
    // since we don't have the actual Stripe integration yet
    return plans.length > 0 ? plans[0] : undefined;
  }

  // Points management methods
  async updateUserPoints(userId: number, points: number): Promise<User> {
    // Update user's points balance
    const [user] = await db
      .update(users)
      .set({
        points,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getUserPoints(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    return user.points || 0;
  }

  async addPointsTransaction(transaction: InsertPointsTransaction): Promise<PointsTransaction> {
    // First, get the current user points
    const user = await this.getUser(transaction.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate the new balance
    const newBalance = user.points + transaction.amount;

    // Start a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Update the user's points
      await tx
        .update(users)
        .set({
          points: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(users.id, transaction.userId));

      // Add the transaction record with the balance
      const [pointsTx] = await tx
        .insert(pointsTransactions)
        .values({
          ...transaction,
          balance: newBalance,
        })
        .returning();

      return {
        ...pointsTx,
        type: pointsTx.type as PointsTransactionType
      } as PointsTransaction;
    });
  }

  async getUserPointsTransactions(userId: number): Promise<PointsTransaction[]> {
    const transactions = await db
      .select()
      .from(pointsTransactions)
      .where(eq(pointsTransactions.userId, userId))
      .orderBy(desc(pointsTransactions.createdAt));

    return transactions.map(tx => ({
      ...tx,
      type: tx.type as PointsTransactionType
    })) as PointsTransaction[];
  }

  async getAvailableRewards(): Promise<PointsReward[]> {
    const rewards = await db
      .select()
      .from(pointsRewards)
      .where(eq(pointsRewards.active, true));

    return rewards.map(reward => ({
      ...reward,
      type: reward.type as PointsTransactionType
    })) as PointsReward[];
  }

  async getReward(id: number): Promise<PointsReward | undefined> {
    const [reward] = await db
      .select()
      .from(pointsRewards)
      .where(eq(pointsRewards.id, id));

    if (!reward) {
      return undefined;
    }

    return {
      ...reward,
      type: reward.type as PointsTransactionType
    } as PointsReward;
  }

  async redeemReward(userId: number, rewardId: number): Promise<PointsTransaction> {
    // First, get the user and the reward
    const user = await this.getUser(userId);
    const reward = await this.getReward(rewardId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!reward) {
      throw new Error("Reward not found");
    }

    if (!reward.active) {
      throw new Error("This reward is not currently available");
    }

    if (user.points < reward.pointsCost) {
      throw new Error("Insufficient points to redeem this reward");
    }

    // Calculate the new points balance
    const newBalance = user.points - reward.pointsCost;

    // Create a redemption transaction
    const transaction: InsertPointsTransaction = {
      userId,
      type: reward.type,
      amount: -reward.pointsCost, // Negative value because points are being spent
      description: `Redeemed reward: ${reward.name}`,
    };

    // Use the transaction method to ensure atomicity
    return await this.addPointsTransaction(transaction);
  }
}

export const storage = new DatabaseStorage();