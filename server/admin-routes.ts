import { Express, Request, Response, NextFunction } from "express";
import { adminStorage } from "./admin-storage";
import { OrderStatus } from "../shared/schema";
import { 
  insertDriverSchema, 
  insertOrderAssignmentSchema, 
  insertSupportRequestSchema, 
  insertSupportRequestMessageSchema,
  SupportRequestStatus
} from "../shared/admin-schema";
import { z } from "zod";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Admin middleware - already added in admin-auth.ts
function isAdminAuthenticated(req: Request, res: Response, next: Function) {
  if (req.adminUser) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function registerAdminRoutes(app: Express) {
  // Dashboard statistics
  app.get("/admin/api/stats", isAdminAuthenticated, async (req, res) => {
    try {
      // Get all orders
      const allOrders = await adminStorage.getAllOrders();
      
      // Get available drivers
      const availableDrivers = await adminStorage.getAvailableDrivers();
      
      // Get all drivers
      const allDrivers = await adminStorage.getAllDrivers();
      
      // Calculate total revenue
      const revenue = allOrders.reduce((sum, order) => sum + order.totalPrice, 0);
      
      // Count unique user IDs from orders
      const customerIds = new Set(allOrders.map(order => order.userId));
      
      // Get order status counts
      const ordersByStatus = [
        { name: "In Progress", value: allOrders.filter(o => o.status === OrderStatus.IN_PROGRESS).length },
        { name: "Completed", value: allOrders.filter(o => o.status === OrderStatus.COMPLETED).length },
        { name: "Cancelled", value: allOrders.filter(o => o.status === OrderStatus.CANCELLED).length },
      ];
      
      // Calculate deliveries by day (last 7 days)
      const today = new Date();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const deliveriesByDay = Array(7).fill(0).map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        const dayName = days[date.getDay()];
        
        // Filter orders for this day
        const dayOrders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toDateString() === date.toDateString();
        });
        
        return {
          day: dayName,
          deliveries: dayOrders.length
        };
      });
      
      res.json({
        totalOrders: allOrders.length,
        activeDrivers: availableDrivers.length,
        totalDrivers: allDrivers.length,
        revenue,
        customers: customerIds.size,
        ordersByStatus,
        deliveriesByDay,
      });
    } catch (error) {
      console.error("Error generating dashboard stats:", error);
      res.status(500).json({ message: "Failed to retrieve dashboard statistics" });
    }
  });
  // Orders endpoints
  app.get("/admin/api/orders", isAdminAuthenticated, async (req, res) => {
    try {
      const orders = await adminStorage.getAllOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/admin/api/orders/unassigned", isAdminAuthenticated, async (req, res) => {
    try {
      const orders = await adminStorage.getUnassignedOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching unassigned orders:", error);
      res.status(500).json({ message: "Failed to fetch unassigned orders" });
    }
  });

  app.get("/admin/api/orders/assigned", isAdminAuthenticated, async (req, res) => {
    try {
      const orders = await adminStorage.getAssignedOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching assigned orders:", error);
      res.status(500).json({ message: "Failed to fetch assigned orders" });
    }
  });

  app.patch("/admin/api/orders/:id/status", isAdminAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Drivers endpoints
  app.get("/admin/api/drivers", isAdminAuthenticated, async (req, res) => {
    try {
      const drivers = await adminStorage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  app.get("/admin/api/drivers/available", isAdminAuthenticated, async (req, res) => {
    try {
      const drivers = await adminStorage.getAvailableDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching available drivers:", error);
      res.status(500).json({ message: "Failed to fetch available drivers" });
    }
  });

  app.post("/admin/api/drivers", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertDriverSchema.parse({
        ...req.body,
        adminId: req.adminUser!.id
      });
      
      const driver = await adminStorage.createDriver(data);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  app.patch("/admin/api/drivers/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await adminStorage.getDriver(driverId);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      const data = insertDriverSchema.partial().parse(req.body);
      const updatedDriver = await adminStorage.updateDriver(driverId, data);
      res.json(updatedDriver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  app.delete("/admin/api/drivers/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await adminStorage.getDriver(driverId);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      await adminStorage.deleteDriver(driverId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  // Order assignments endpoints
  app.post("/admin/api/orders/assign", isAdminAuthenticated, async (req, res) => {
    try {
      const { orderId, driverId } = req.body;
      
      if (!orderId || !driverId) {
        return res.status(400).json({ message: "Order ID and Driver ID are required" });
      }
      
      // Check if order and driver exist
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const driver = await adminStorage.getDriver(driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      // Check if driver is available
      if (!driver.isAvailable) {
        return res.status(400).json({ message: "Driver is not available" });
      }
      
      // Check if order is already assigned
      const existingAssignment = await adminStorage.getOrderAssignmentByOrderId(orderId);
      if (existingAssignment) {
        return res.status(400).json({ message: "Order is already assigned" });
      }
      
      // Create assignment
      const now = new Date();
      // Estimate 30 minutes for pickup and 1 hour for delivery from now
      const pickupTime = new Date(now.getTime() + 30 * 60 * 1000);
      const deliveryTime = new Date(now.getTime() + 90 * 60 * 1000);
      
      const assignment = await adminStorage.assignOrder({
        orderId,
        driverId,
        adminId: req.adminUser!.id,
        assignedAt: now,
        status: "ASSIGNED",
        estimatedPickupTime: pickupTime,
        estimatedDeliveryTime: deliveryTime,
        notes: "Assigned by admin"
      });
      
      // Update order status to IN_PROGRESS
      await storage.updateOrderStatus(orderId, OrderStatus.IN_PROGRESS);
      
      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning order:", error);
      res.status(500).json({ message: "Failed to assign order" });
    }
  });
  
  app.post("/admin/api/order-assignments", isAdminAuthenticated, async (req, res) => {
    try {
      const data = insertOrderAssignmentSchema.parse({
        ...req.body,
        adminId: req.adminUser!.id
      });
      
      // Check if order and driver exist
      const order = await storage.getOrder(data.orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const driver = await adminStorage.getDriver(data.driverId);
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      // Check if order is already assigned
      const existingAssignment = await adminStorage.getOrderAssignmentByOrderId(data.orderId);
      if (existingAssignment) {
        return res.status(400).json({ message: "Order is already assigned" });
      }
      
      const assignment = await adminStorage.assignOrder(data);
      
      // Update order status to IN_PROGRESS
      await storage.updateOrderStatus(data.orderId, OrderStatus.IN_PROGRESS);
      
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating order assignment:", error);
      res.status(500).json({ message: "Failed to assign order" });
    }
  });

  app.patch("/admin/api/order-assignments/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      const data = insertOrderAssignmentSchema.partial().parse(req.body);
      
      const updatedAssignment = await adminStorage.updateOrderAssignment(assignmentId, data);
      
      if (!updatedAssignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      res.json(updatedAssignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating order assignment:", error);
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  app.delete("/admin/api/order-assignments/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.id);
      await adminStorage.deleteOrderAssignment(assignmentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting order assignment:", error);
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });
  
  // Admin profile endpoints
  app.post("/admin/change-password", isAdminAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      // Validate that current password is correct
      const admin = await adminStorage.getAdminUserById(req.adminUser!.id);
      if (!admin) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      
      const passwordCorrect = await comparePasswords(currentPassword, admin.password);
      if (!passwordCorrect) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update to new password
      const hashedNewPassword = await hashPassword(newPassword);
      await adminStorage.updateAdminUser(admin.id, { password: hashedNewPassword });
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing admin password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Customer management endpoints
  app.get("/admin/api/customers", isAdminAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const customers = await adminStorage.getAllCustomers(limit, offset);
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/admin/api/customers/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await adminStorage.getCustomerById(customerId);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Get additional customer data
      const vehicles = await adminStorage.getCustomerVehicles(customerId);
      const orders = await adminStorage.getCustomerOrders(customerId);
      const paymentMethods = await adminStorage.getCustomerPaymentMethods(customerId);
      const locations = await adminStorage.getCustomerSavedLocations(customerId);
      
      res.json({
        customer,
        vehicles,
        orders,
        paymentMethods,
        locations
      });
    } catch (error) {
      console.error("Error fetching customer details:", error);
      res.status(500).json({ message: "Failed to fetch customer details" });
    }
  });

  // Support request endpoints
  app.get("/admin/api/support-requests", isAdminAuthenticated, async (req, res) => {
    try {
      const status = req.query.status as SupportRequestStatus | undefined;
      const requests = await adminStorage.getAllSupportRequests(status);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching support requests:", error);
      res.status(500).json({ message: "Failed to fetch support requests" });
    }
  });

  app.get("/admin/api/support-requests/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await adminStorage.getSupportRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Support request not found" });
      }
      
      const messages = await adminStorage.getSupportRequestMessages(requestId);
      
      res.json({
        request,
        messages
      });
    } catch (error) {
      console.error("Error fetching support request details:", error);
      res.status(500).json({ message: "Failed to fetch support request details" });
    }
  });

  app.patch("/admin/api/support-requests/:id", isAdminAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await adminStorage.getSupportRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ message: "Support request not found" });
      }
      
      const data = req.body;
      
      // If status is being updated to resolved, set resolvedAt
      if (data.status === 'RESOLVED' && request.status !== 'RESOLVED') {
        data.resolvedAt = new Date();
      }
      
      // If request is being assigned to admin, set assignedToAdminId 
      if (data.assignedToAdminId === null && request.assignedToAdminId) {
        // Unassigning
        data.assignedToAdminId = null;
      } else if (data.assignedToAdminId === undefined && !request.assignedToAdminId) {
        // Default to current admin if not previously assigned
        data.assignedToAdminId = req.adminUser!.id;
      }
      
      const updatedRequest = await adminStorage.updateSupportRequest(requestId, data);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating support request:", error);
      res.status(500).json({ message: "Failed to update support request" });
    }
  });

  app.post("/admin/api/support-requests/:id/messages", isAdminAuthenticated, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      const request = await adminStorage.getSupportRequest(requestId);
      if (!request) {
        return res.status(404).json({ message: "Support request not found" });
      }
      
      const newMessage = await adminStorage.createSupportRequestMessage({
        supportRequestId: requestId,
        senderId: req.adminUser!.id,
        isFromAdmin: true,
        message
      });
      
      // If request is not already in progress, update it
      if (request.status === 'OPEN') {
        await adminStorage.updateSupportRequest(requestId, {
          status: 'IN_PROGRESS',
          assignedToAdminId: req.adminUser!.id
        });
      }
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error adding support request message:", error);
      res.status(500).json({ message: "Failed to add message" });
    }
  });

  // Analytics endpoints
  app.get("/admin/api/analytics/revenue", isAdminAuthenticated, async (req, res) => {
    try {
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
      const data = await adminStorage.getRevenueAnalytics(period);
      res.json(data);
    } catch (error) {
      console.error("Error fetching revenue analytics:", error);
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  app.get("/admin/api/analytics/popular-locations", isAdminAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const data = await adminStorage.getPopularLocations(limit);
      res.json(data);
    } catch (error) {
      console.error("Error fetching popular locations:", error);
      res.status(500).json({ message: "Failed to fetch popular locations" });
    }
  });

  app.get("/admin/api/analytics/peak-times", isAdminAuthenticated, async (req, res) => {
    try {
      const data = await adminStorage.getPeakOrderingTimes();
      res.json(data);
    } catch (error) {
      console.error("Error fetching peak ordering times:", error);
      res.status(500).json({ message: "Failed to fetch peak ordering times" });
    }
  });

  app.get("/admin/api/analytics/customer-retention", isAdminAuthenticated, async (req, res) => {
    try {
      const data = await adminStorage.getCustomerRetentionMetrics();
      res.json(data);
    } catch (error) {
      console.error("Error fetching customer retention metrics:", error);
      res.status(500).json({ message: "Failed to fetch customer retention metrics" });
    }
  });
}