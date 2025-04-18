import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertVehicleSchema, 
  insertPaymentMethodSchema, 
  insertOrderSchema,
  insertLocationSchema
} from "@shared/schema";

// Middleware to ensure user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Vehicles API
  app.get("/api/vehicles", isAuthenticated, async (req, res) => {
    const vehicles = await storage.getVehiclesByUserId(req.user!.id);
    res.json(vehicles);
  });

  app.post("/api/vehicles", isAuthenticated, async (req, res) => {
    try {
      const data = insertVehicleSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const vehicle = await storage.createVehicle(data);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.patch("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle || vehicle.userId !== req.user!.id) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      const data = insertVehicleSchema.partial().parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const updatedVehicle = await storage.updateVehicle(vehicleId, data);
      res.json(updatedVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", isAuthenticated, async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(vehicleId);
      
      if (!vehicle || vehicle.userId !== req.user!.id) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      await storage.deleteVehicle(vehicleId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Orders API
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    const orders = await storage.getOrdersByUserId(req.user!.id);
    res.json(orders);
  });

  app.get("/api/orders/recent", isAuthenticated, async (req, res) => {
    const orders = await storage.getRecentOrdersByUserId(req.user!.id);
    res.json(orders);
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const data = insertOrderSchema.parse({
        ...req.body,
        userId: req.user!.id,
        status: "IN_PROGRESS"
      });
      const order = await storage.createOrder(data);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Payment Methods API
  app.get("/api/payment-methods", isAuthenticated, async (req, res) => {
    const methods = await storage.getPaymentMethodsByUserId(req.user!.id);
    res.json(methods);
  });

  app.post("/api/payment-methods", isAuthenticated, async (req, res) => {
    try {
      // Simplified payment method creation - in production use a payment processor
      const cardNumber = req.body.cardNumber;
      const last4 = cardNumber.slice(-4);
      let cardType = "unknown";
      
      if (cardNumber.startsWith("4")) {
        cardType = "visa";
      } else if (cardNumber.startsWith("5")) {
        cardType = "mastercard";
      } else if (cardNumber.startsWith("3")) {
        cardType = "amex";
      }
      
      const data = insertPaymentMethodSchema.parse({
        userId: req.user!.id,
        type: cardType,
        last4,
        expiry: req.body.expiryDate
      });
      
      const paymentMethod = await storage.createPaymentMethod(data);
      res.status(201).json(paymentMethod);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment method" });
    }
  });

  app.delete("/api/payment-methods/:id", isAuthenticated, async (req, res) => {
    try {
      const methodId = parseInt(req.params.id);
      const method = await storage.getPaymentMethod(methodId);
      
      if (!method || method.userId !== req.user!.id) {
        return res.status(404).json({ message: "Payment method not found" });
      }
      
      await storage.deletePaymentMethod(methodId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payment method" });
    }
  });

  // Locations API
  app.get("/api/locations", isAuthenticated, async (req, res) => {
    const locations = await storage.getLocationsByUserId(req.user!.id);
    res.json(locations);
  });

  app.post("/api/locations", isAuthenticated, async (req, res) => {
    try {
      const data = insertLocationSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const location = await storage.createLocation(data);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
