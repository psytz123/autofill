import { pgTable, serial, text, timestamp, boolean, integer, jsonb, varchar } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Support request status enum - using strings for simplicity instead of pgEnum
export type SupportRequestStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

// Support request types enum - using strings for simplicity instead of pgEnum
export type SupportRequestType = 'BILLING' | 'DELIVERY' | 'TECHNICAL' | 'ACCOUNT' | 'OTHER';

// Define support requests table
export const supportRequests = pgTable("support_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),  // Will contain one of SupportRequestType values
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default('OPEN'),  // Will contain one of SupportRequestStatus values
  priority: integer("priority").notNull().default(1), // 1=low, 2=medium, 3=high
  assignedToAdminId: integer("assigned_to_admin_id"),
  orderId: integer("order_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const insertSupportRequestSchema = createInsertSchema(supportRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true
});

export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;
export type SupportRequest = typeof supportRequests.$inferSelect;

// Define support request messages
export const supportRequestMessages = pgTable("support_request_messages", {
  id: serial("id").primaryKey(),
  supportRequestId: integer("support_request_id").notNull(),
  senderId: integer("sender_id").notNull(), // User or Admin ID
  isFromAdmin: boolean("is_from_admin").notNull().default(false),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSupportRequestMessageSchema = createInsertSchema(supportRequestMessages).omit({
  id: true,
  createdAt: true
});

export type InsertSupportRequestMessage = z.infer<typeof insertSupportRequestMessageSchema>;
export type SupportRequestMessage = typeof supportRequestMessages.$inferSelect;

// Define relations
export const supportRequestsRelations = relations(supportRequests, ({ many }) => ({
  messages: many(supportRequestMessages)
}));

export const supportRequestMessagesRelations = relations(supportRequestMessages, ({ one }) => ({
  supportRequest: one(supportRequests, {
    fields: [supportRequestMessages.supportRequestId],
    references: [supportRequests.id]
  })
}));