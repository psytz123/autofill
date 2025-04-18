import { db } from "./db";
import { 
  adminUsers, drivers, orderAssignments, supportRequests, supportRequestMessages,
  InsertDriver, InsertOrderAssignment, AdminUser, InsertSupportRequest,
  InsertSupportRequestMessage, SupportRequestStatus
} from "../shared/admin-schema";
import { orders, Order, FuelType, OrderStatus, users, vehicles, paymentMethods, locations } from "../shared/schema";
import { eq, desc, and, sql, asc, count, sum, isNull, not } from "drizzle-orm";

export class AdminStorage {
  // Admin users management
  async getAdminUserById(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }
  
  async updateAdminUser(id: number, data: Partial<AdminUser>): Promise<AdminUser> {
    const [updatedUser] = await db
      .update(adminUsers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(adminUsers.id, id))
      .returning();
    return updatedUser;
  }
  // Order operations for admin
  async getAllOrders(): Promise<any[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return allOrders.map(order => ({
      ...order,
      fuelType: order.fuelType as FuelType,
      status: order.status as OrderStatus
    }));
  }
  
  async getUnassignedOrders(): Promise<any[]> {
    // Get all orders that don't have an assignment
    const result = await db.execute(sql`
      SELECT o.* FROM orders o
      LEFT JOIN order_assignments oa ON o.id = oa.order_id
      WHERE oa.id IS NULL
      ORDER BY o.created_at DESC
    `);
    
    return (result.rows as any[]).map(order => ({
      ...order,
      fuelType: order.fuelType as FuelType,
      status: order.status as OrderStatus
    }));
  }

  async getAssignedOrders(): Promise<any[]> {
    // Get all orders with their assignments and driver information
    const result = await db.execute(sql`
      SELECT o.*, oa.id as assignment_id, oa.assigned_at, oa.status as assignment_status, 
             oa.estimated_pickup_time, oa.estimated_delivery_time, oa.notes,
             d.id as driver_id, d.name as driver_name, d.phone as driver_phone,
             d.vehicle_model as driver_vehicle
      FROM orders o
      JOIN order_assignments oa ON o.id = oa.order_id
      JOIN drivers d ON oa.driver_id = d.id
      ORDER BY oa.assigned_at DESC
    `);
    
    return result.rows;
  }

  // Driver operations
  async getAllDrivers() {
    return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  }
  
  async getAvailableDrivers() {
    return await db.select().from(drivers).where(eq(drivers.isAvailable, true));
  }
  
  async getDriver(id: number) {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }
  
  async createDriver(driver: InsertDriver) {
    const [newDriver] = await db.insert(drivers).values(driver).returning();
    return newDriver;
  }
  
  async updateDriver(id: number, data: Partial<InsertDriver>) {
    const [updatedDriver] = await db
      .update(drivers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return updatedDriver;
  }
  
  async deleteDriver(id: number) {
    await db.delete(drivers).where(eq(drivers.id, id));
  }
  
  // Order assignment operations
  async assignOrder(assignment: InsertOrderAssignment) {
    const [newAssignment] = await db.insert(orderAssignments).values(assignment).returning();
    return newAssignment;
  }
  
  async updateOrderAssignment(id: number, data: Partial<InsertOrderAssignment>) {
    const [updatedAssignment] = await db
      .update(orderAssignments)
      .set(data)
      .where(eq(orderAssignments.id, id))
      .returning();
    return updatedAssignment;
  }
  
  async getOrderAssignmentByOrderId(orderId: number) {
    const [assignment] = await db
      .select()
      .from(orderAssignments)
      .where(eq(orderAssignments.orderId, orderId));
    return assignment;
  }
  
  async deleteOrderAssignment(id: number) {
    await db.delete(orderAssignments).where(eq(orderAssignments.id, id));
  }

  // Customer management operations
  async getAllCustomers(limit = 50, offset = 0) {
    const result = await db.execute(sql`
      SELECT 
        u.id, 
        u.username, 
        u.name,
        COUNT(o.id) as order_count,
        SUM(o.total_price) as total_spent,
        u.created_at
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    
    return result.rows;
  }
  
  async getCustomerById(id: number) {
    const [customer] = await db.select().from(users).where(eq(users.id, id));
    return customer;
  }
  
  async getCustomerVehicles(userId: number) {
    return await db.select().from(vehicles).where(eq(vehicles.userId, userId));
  }
  
  async getCustomerOrders(userId: number) {
    return await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
  }
  
  async getCustomerPaymentMethods(userId: number) {
    return await db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
  }
  
  async getCustomerSavedLocations(userId: number) {
    return await db.select().from(locations).where(eq(locations.userId, userId));
  }
  
  // Support request operations
  async createSupportRequest(request: InsertSupportRequest) {
    const [newRequest] = await db.insert(supportRequests).values(request).returning();
    return newRequest;
  }
  
  async getSupportRequestsByUserId(userId: number) {
    return await db.select().from(supportRequests).where(eq(supportRequests.userId, userId))
      .orderBy(desc(supportRequests.createdAt));
  }
  
  async getAllSupportRequests(status?: SupportRequestStatus) {
    if (status) {
      return await db.select().from(supportRequests)
        .where(eq(supportRequests.status, status))
        .orderBy(desc(supportRequests.createdAt));
    }
    return await db.select().from(supportRequests).orderBy(desc(supportRequests.createdAt));
  }
  
  async getSupportRequest(id: number) {
    const [request] = await db
      .select()
      .from(supportRequests)
      .where(eq(supportRequests.id, id));
    return request;
  }
  
  async updateSupportRequest(id: number, data: Partial<InsertSupportRequest>) {
    const [updatedRequest] = await db
      .update(supportRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(supportRequests.id, id))
      .returning();
    return updatedRequest;
  }
  
  async createSupportRequestMessage(message: InsertSupportRequestMessage) {
    const [newMessage] = await db.insert(supportRequestMessages).values(message).returning();
    return newMessage;
  }
  
  async getSupportRequestMessages(requestId: number) {
    return await db.select()
      .from(supportRequestMessages)
      .where(eq(supportRequestMessages.supportRequestId, requestId))
      .orderBy(asc(supportRequestMessages.createdAt));
  }
  
  // Analytics operations
  async getRevenueAnalytics(period: 'daily' | 'weekly' | 'monthly') {
    let timeFormat = '';
    let groupField = '';
    
    if (period === 'daily') {
      timeFormat = 'YYYY-MM-DD';
      groupField = 'day';
    } else if (period === 'weekly') {
      timeFormat = 'YYYY-WW';  // ISO week number
      groupField = 'week';
    } else {
      timeFormat = 'YYYY-MM';
      groupField = 'month';
    }
    
    const result = await db.execute(sql`
      SELECT 
        TO_CHAR(created_at, ${timeFormat}) as time_period,
        COUNT(*) as order_count,
        SUM(total_price) as revenue
      FROM orders
      WHERE created_at > NOW() - INTERVAL '90 days'
      GROUP BY time_period
      ORDER BY time_period ASC
    `);
    
    return result.rows;
  }
  
  async getPopularLocations(limit = 10) {
    const result = await db.execute(sql`
      SELECT 
        l.coordinates->>'lat' as lat,
        l.coordinates->>'lng' as lng,
        COUNT(*) as delivery_count
      FROM orders o
      JOIN locations l ON o.location_id = l.id
      GROUP BY l.coordinates->>'lat', l.coordinates->>'lng'
      ORDER BY delivery_count DESC
      LIMIT ${limit}
    `);
    
    return result.rows;
  }
  
  async getPeakOrderingTimes() {
    const result = await db.execute(sql`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY hour
      ORDER BY hour ASC
    `);
    
    return result.rows;
  }
  
  async getCustomerRetentionMetrics() {
    // First, get all customers who ordered in the last 90 days
    const result = await db.execute(sql`
      WITH first_orders AS (
        SELECT 
          user_id,
          MIN(created_at) as first_order_date
        FROM orders
        GROUP BY user_id
      ),
      repeat_customers AS (
        SELECT 
          o.user_id,
          COUNT(*) as order_count,
          MAX(o.created_at) as last_order_date,
          fo.first_order_date
        FROM orders o
        JOIN first_orders fo ON o.user_id = fo.user_id
        WHERE o.created_at > NOW() - INTERVAL '90 days'
        GROUP BY o.user_id, fo.first_order_date
      )
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN order_count > 1 THEN 1 END) as repeat_customers,
        AVG(order_count) as avg_orders_per_customer,
        AVG(EXTRACT(EPOCH FROM (last_order_date - first_order_date))/86400) as avg_customer_lifespan_days
      FROM repeat_customers
    `);
    
    // Get retention cohorts - % of customers who ordered again after X days
    const cohortResult = await db.execute(sql`
      WITH cohorts AS (
        SELECT 
          DATE_TRUNC('month', first_order_date) as cohort_month,
          user_id
        FROM (
          SELECT 
            user_id,
            MIN(created_at) as first_order_date
          FROM orders
          GROUP BY user_id
        ) as first_orders
      ),
      retention AS (
        SELECT 
          c.cohort_month,
          c.user_id,
          CASE 
            WHEN MAX(o.created_at) > c.cohort_month + INTERVAL '30 days' THEN 1
            ELSE 0
          END as retained_30d,
          CASE 
            WHEN MAX(o.created_at) > c.cohort_month + INTERVAL '60 days' THEN 1
            ELSE 0
          END as retained_60d,
          CASE 
            WHEN MAX(o.created_at) > c.cohort_month + INTERVAL '90 days' THEN 1
            ELSE 0
          END as retained_90d
        FROM cohorts c
        JOIN orders o ON c.user_id = o.user_id AND o.created_at > c.cohort_month
        WHERE c.cohort_month >= NOW() - INTERVAL '6 months'
        GROUP BY c.cohort_month, c.user_id
      )
      SELECT 
        to_char(cohort_month, 'YYYY-MM') as cohort,
        COUNT(*) as total_users,
        ROUND(100.0 * SUM(retained_30d) / COUNT(*), 1) as retention_30d_pct,
        ROUND(100.0 * SUM(retained_60d) / COUNT(*), 1) as retention_60d_pct,
        ROUND(100.0 * SUM(retained_90d) / COUNT(*), 1) as retention_90d_pct
      FROM retention
      GROUP BY cohort_month
      ORDER BY cohort_month DESC
      LIMIT 6
    `);
    
    return {
      summary: result.rows[0],
      cohorts: cohortResult.rows
    };
  }
}

export const adminStorage = new AdminStorage();