import { db } from "./db";
import { adminUsers, drivers, orderAssignments, InsertDriver, InsertOrderAssignment, AdminUser } from "../shared/admin-schema";
import { orders, Order, FuelType, OrderStatus } from "../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

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
}

export const adminStorage = new AdminStorage();