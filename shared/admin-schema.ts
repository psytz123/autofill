import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define admin users table
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Define drivers table
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  licensePlate: text("license_plate").notNull(),
  vehicleModel: text("vehicle_model").notNull(),
  isAvailable: boolean("is_available").notNull().default(true),
  currentLocation: jsonb("current_location"),
  adminId: integer("admin_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDriverSchema = createInsertSchema(drivers).extend({
  currentLocation: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
});

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Define order assignments
export const orderAssignments = pgTable("order_assignments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().unique(),
  driverId: integer("driver_id").notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  estimatedPickupTime: timestamp("estimated_pickup_time"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  status: text("status").notNull().default("assigned"),
  notes: text("notes"),
  adminId: integer("admin_id").notNull(),
});

export const insertOrderAssignmentSchema = createInsertSchema(orderAssignments);

export type InsertOrderAssignment = z.infer<typeof insertOrderAssignmentSchema>;
export type OrderAssignment = typeof orderAssignments.$inferSelect;