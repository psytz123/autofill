import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import Stripe from "stripe";
import { 
  insertUserSchema, 
  insertVehicleSchema, 
  insertPaymentMethodSchema, 
  insertOrderSchema,
  insertLocationSchema,
  OrderStatus
} from "@shared/schema";

// Initialize Stripe with placeholder key - replace with environment variable later
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(stripeSecretKey);

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
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections by user ID
  const activeConnections = new Map<number, WebSocket[]>();
  
  // Driver locations (simulated)
  const driverLocations = new Map<number, { lat: number, lng: number }>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    let userId: number | null = null;
    let orderId: number | null = null;
    
    // Handle messages from clients
    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth') {
          userId = parseInt(data.userId);
          if (userId) {
            if (!activeConnections.has(userId)) {
              activeConnections.set(userId, []);
            }
            activeConnections.get(userId)?.push(ws);
            ws.send(JSON.stringify({ type: 'auth_success' }));
          }
        }
        
        // Handle order tracking subscription
        if (data.type === 'track_order' && userId) {
          orderId = parseInt(data.orderId);
          const order = await storage.getOrder(orderId);
          
          if (!order || order.userId !== userId) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Order not found or unauthorized' 
            }));
            return;
          }
          
          // Initial location - simulate near the delivery address
          if (order.location) {
            const coords = order.location.coordinates as { lat: number, lng: number };
            
            // Create a simulated driver location slightly away from destination
            const driverLocation = { 
              lat: coords.lat + (Math.random() * 0.01 - 0.005), 
              lng: coords.lng + (Math.random() * 0.01 - 0.005)
            };
            
            driverLocations.set(orderId, driverLocation);
            
            // Send initial location
            ws.send(JSON.stringify({
              type: 'driver_location',
              orderId: orderId,
              location: driverLocation,
              estimatedArrival: '10 minutes'
            }));
            
            // Start simulated driver movement for this order
            startDriverSimulation(orderId, coords);
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      if (userId) {
        const connections = activeConnections.get(userId) || [];
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        if (connections.length === 0) {
          activeConnections.delete(userId);
        }
      }
    });
  });
  
  // Simulate driver movement toward destination
  function startDriverSimulation(orderId: number, destination: { lat: number, lng: number }) {
    const interval = setInterval(() => {
      const driverLocation = driverLocations.get(orderId);
      if (!driverLocation) {
        clearInterval(interval);
        return;
      }
      
      // Move driver closer to destination
      const moveToward = (current: number, target: number): number => {
        const step = 0.0005; // Small movement step
        if (Math.abs(current - target) < step) return target;
        return current + (target > current ? step : -step);
      };
      
      driverLocation.lat = moveToward(driverLocation.lat, destination.lat);
      driverLocation.lng = moveToward(driverLocation.lng, destination.lng);
      
      // Calculate distance and estimate arrival time
      const distance = Math.sqrt(
        Math.pow(destination.lat - driverLocation.lat, 2) + 
        Math.pow(destination.lng - driverLocation.lng, 2)
      );
      
      // Convert to minutes (simplified)
      const minutesRemaining = Math.ceil(distance * 2000);
      let estimatedArrival: string;
      
      if (minutesRemaining <= 0) {
        estimatedArrival = 'Arrived';
        // Mark order as completed when driver arrives
        storage.updateOrderStatus(orderId, OrderStatus.COMPLETED);
        clearInterval(interval);
      } else {
        estimatedArrival = `${minutesRemaining} minutes`;
      }
      
      // Broadcast to all connected clients for this order
      const orderUserId = Array.from(activeConnections.keys()).find(userId => {
        const connections = activeConnections.get(userId) || [];
        return connections.length > 0;
      });
      
      if (orderUserId) {
        const connections = activeConnections.get(orderUserId) || [];
        connections.forEach(connection => {
          if (connection.readyState === WebSocket.OPEN) {
            connection.send(JSON.stringify({
              type: 'driver_location',
              orderId: orderId,
              location: driverLocation,
              estimatedArrival
            }));
          }
        });
      }
    }, 3000); // Update every 3 seconds
  }
  
  // Add endpoint to update order status (for admin/drivers)
  app.post("/api/orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // In production, add additional checks for authorization
      const status = req.body.status;
      if (!Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(orderId, status);
      
      // Notify connected client
      const userId = order.userId;
      const connections = activeConnections.get(userId) || [];
      connections.forEach(connection => {
        if (connection.readyState === WebSocket.OPEN) {
          connection.send(JSON.stringify({
            type: 'order_status_update',
            orderId,
            status: updatedOrder.status
          }));
        }
      });
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  
  // Stripe Payment Integration
  
  // Create a payment intent for a new order
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount, orderId } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      
      // Create a PaymentIntent with the order amount and currency
      try {
        // If we're using a placeholder key, return a mock payment intent
        if (stripeSecretKey === 'sk_test_placeholder') {
          return res.json({
            clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 15),
            amount: amount,
            id: 'pi_mock_' + Math.random().toString(36).substring(2, 10),
          });
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // convert to cents
          currency: 'usd',
          payment_method_types: ['card'],
          metadata: {
            orderId: orderId,
            userId: req.user!.id.toString()
          }
        });
        
        // Send the client secret to the client
        res.json({
          clientSecret: paymentIntent.client_secret,
          amount: amount,
          id: paymentIntent.id
        });
      } catch (stripeError) {
        console.error('Stripe error:', stripeError);
        res.status(400).json({ message: 'Payment service unavailable. Please try again later.' });
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: 'Failed to process payment' });
    }
  });
  
  // Webhook to handle Stripe events
  app.post('/api/webhook', async (req, res) => {
    // This should be properly set up with Stripe webhook signature verification
    // For testing purposes, we're keeping it simple
    try {
      const event = req.body;
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const orderId = paymentIntent.metadata?.orderId;
          
          // Update order status if order ID is provided
          if (orderId) {
            const orderIdNum = parseInt(orderId);
            await storage.updateOrderStatus(orderIdNum, OrderStatus.IN_PROGRESS);
            
            // Notify the client via WebSocket if connected
            const order = await storage.getOrder(orderIdNum);
            if (order) {
              const userId = order.userId;
              const connections = activeConnections.get(userId) || [];
              connections.forEach(connection => {
                if (connection.readyState === WebSocket.OPEN) {
                  connection.send(JSON.stringify({
                    type: 'payment_succeeded',
                    orderId: orderIdNum
                  }));
                }
              });
            }
          }
          break;
          
        case 'payment_intent.payment_failed':
          // Handle failed payment
          break;
          
        default:
          // Unexpected event type
          console.log(`Unhandled event type ${event.type}`);
      }
      
      // Return a 200 response to acknowledge receipt of the event
      res.json({ received: true });
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      res.status(500).send('Webhook Error');
    }
  });

  return httpServer;
}
