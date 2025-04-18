import { Express, Request, Response } from "express";
import { adminStorage } from "./admin-storage";
import { OrderStatus } from "../shared/schema";
import { insertDriverSchema, insertOrderAssignmentSchema } from "../shared/admin-schema";
import { z } from "zod";
import { storage } from "./storage";

// Admin middleware - already added in admin-auth.ts
function isAdminAuthenticated(req: Request, res: Response, next: Function) {
  if (req.adminUser) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export function registerAdminRoutes(app: Express) {
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
}