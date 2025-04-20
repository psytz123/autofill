import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export enum FuelType {
  REGULAR_UNLEADED = "REGULAR_UNLEADED",
  PREMIUM_UNLEADED = "PREMIUM_UNLEADED",
  DIESEL = "DIESEL",
}

export enum OrderStatus {
  IN_PROGRESS = "IN_PROGRESS",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum LocationType {
  HOME = "home",
  WORK = "work",
  OTHER = "other",
}

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  // Reward points
  points: integer("points").notNull().default(0),
  // Stripe related fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Vehicles
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: text("year").notNull(),
  licensePlate: text("license_plate").notNull(),
  fuelType: text("fuel_type").notNull(),
  tankSize: integer("tank_size"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).extend({
  fuelType: z.nativeEnum(FuelType),
  tankSize: z.number().min(1).optional(),
});

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect & {
  fuelType: FuelType;
  fuelLevel?: number;
  tankSize?: number;
};

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  locationId: integer("location_id").notNull(),
  paymentMethodId: integer("payment_method_id"), // Allow NULL for emergency orders
  status: text("status").notNull(),
  fuelType: text("fuel_type").notNull(),
  amount: integer("amount").notNull(),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders)
  .extend({
    fuelType: z.nativeEnum(FuelType),
    status: z.nativeEnum(OrderStatus),
    totalPrice: z.number().optional(),
    vehicle: z.any(), // For the frontend form
    location: z.any(), // For the frontend form
    paymentMethod: z.any(), // For the frontend form
  })
  .omit({
    totalPrice: true,
    vehicleId: true,
    locationId: true,
    paymentMethodId: true,
  })
  .transform((data) => {
    return {
      userId: data.userId,
      vehicleId: data.vehicle.id,
      locationId: data.location.id,
      paymentMethodId: data.paymentMethod.id,
      status: data.status,
      fuelType: data.fuelType,
      amount: data.amount,
    };
  });

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect & {
  fuelType: FuelType;
  status: OrderStatus;
  vehicle?: Vehicle;
  location?: Location;
  paymentMethod?: PaymentMethod;
};

// Payment Methods
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  last4: text("last4").notNull(),
  expiry: text("expiry").notNull(),
  cardHolder: text("card_holder"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods);

export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;

// Locations
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  coordinates: jsonb("coordinates").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLocationSchema = createInsertSchema(locations).extend({
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  type: z.nativeEnum(LocationType),
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect & {
  coordinates: { lat: number; lng: number };
  type: LocationType;
};

// Subscription Plans
export enum SubscriptionPlanType {
  BASIC = "BASIC", // Regular one-time orders
  PREMIUM = "PREMIUM", // Monthly subscription with discounted delivery
  UNLIMITED = "UNLIMITED", // Monthly subscription with unlimited deliveries
}

export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  price: integer("price").notNull(), // Price in cents
  deliveryDiscount: integer("delivery_discount").notNull(), // Percentage discount on delivery fee
  description: text("description").notNull(),
  features: jsonb("features").notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSubscriptionPlanSchema = createInsertSchema(
  subscriptionPlans,
).extend({
  type: z.nativeEnum(SubscriptionPlanType),
  features: z.array(z.string()),
});

export type InsertSubscriptionPlan = z.infer<
  typeof insertSubscriptionPlanSchema
>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect & {
  type: SubscriptionPlanType;
  features: string[];
};

// Push Notification Subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPushSubscriptionSchema =
  createInsertSchema(pushSubscriptions);

export type InsertPushSubscription = z.infer<
  typeof insertPushSubscriptionSchema
>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Set up table relations
export const usersRelations = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  orders: many(orders),
  paymentMethods: many(paymentMethods),
  locations: many(locations),
  pushSubscriptions: many(pushSubscriptions),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  user: one(users, {
    fields: [vehicles.userId],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  vehicle: one(vehicles, {
    fields: [orders.vehicleId],
    references: [vehicles.id],
  }),
  location: one(locations, {
    fields: [orders.locationId],
    references: [locations.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
}));

export const pushSubscriptionsRelations = relations(
  pushSubscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [pushSubscriptions.userId],
      references: [users.id],
    }),
  }),
);

// Points Transaction Types
export enum PointsTransactionType {
  EARN_PURCHASE = "EARN_PURCHASE",
  EARN_REFERRAL = "EARN_REFERRAL",
  EARN_SIGNUP = "EARN_SIGNUP",
  EARN_MILESTONE = "EARN_MILESTONE",
  REDEEM_DISCOUNT = "REDEEM_DISCOUNT",
  REDEEM_FREE_DELIVERY = "REDEEM_FREE_DELIVERY",
  REDEEM_FUEL_DISCOUNT = "REDEEM_FUEL_DISCOUNT",
}

// Points Transactions
export const pointsTransactions = pgTable("points_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  orderId: integer("order_id")
    .references(() => orders.id),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  balance: integer("balance").notNull(), // Running balance after this transaction
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPointsTransactionSchema = createInsertSchema(pointsTransactions)
  .extend({
    type: z.nativeEnum(PointsTransactionType),
  })
  .omit({
    balance: true, // Balance is calculated server-side
  });

export type InsertPointsTransaction = z.infer<typeof insertPointsTransactionSchema>;
export type PointsTransaction = typeof pointsTransactions.$inferSelect & {
  type: PointsTransactionType;
};

// Points Rewards Configuration
export const pointsRewards = pgTable("points_rewards", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  pointsCost: integer("points_cost").notNull(),
  discountAmount: integer("discount_amount"), // Percentage or fixed amount based on type
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPointsRewardSchema = createInsertSchema(pointsRewards)
  .extend({
    type: z.nativeEnum(PointsTransactionType),
  });

export type InsertPointsReward = z.infer<typeof insertPointsRewardSchema>;
export type PointsReward = typeof pointsRewards.$inferSelect & {
  type: PointsTransactionType;
};

// Additional Relations
export const usersRelationsUpdate = relations(users, ({ many }) => ({
  vehicles: many(vehicles),
  orders: many(orders),
  paymentMethods: many(paymentMethods),
  locations: many(locations),
  pushSubscriptions: many(pushSubscriptions),
  pointsTransactions: many(pointsTransactions),
}));

export const pointsTransactionsRelations = relations(pointsTransactions, ({ one }) => ({
  user: one(users, {
    fields: [pointsTransactions.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [pointsTransactions.orderId],
    references: [orders.id],
  }),
}));
