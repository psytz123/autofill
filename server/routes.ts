import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { setupAdminAuth } from "./admin-auth";
import { registerAdminRoutes } from "./admin-routes";
import { storage } from "./storage";
import { z } from "zod";
import Stripe from "stripe";
import { getFuelPrices } from "./fuel-api";
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
  
  // Setup admin authentication
  setupAdminAuth(app);
  
  // Register admin routes
  registerAdminRoutes(app);
  
  // Fuel Prices API
  app.get("/api/fuel-prices", async (req, res) => {
    try {
      const stateCode = req.query.state as string || "FL";
      const prices = await getFuelPrices(stateCode);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching fuel prices:", error);
      res.status(500).json({ message: "Failed to fetch fuel prices" });
    }
  });

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
      console.log("Payment method creation request:", req.body);
      
      // Use the payment method data sent from the client
      const data = insertPaymentMethodSchema.parse({
        userId: req.user!.id,
        type: req.body.type,
        last4: req.body.last4,
        expiry: req.body.expiry,
        cardHolder: req.body.cardHolder
      });
      
      console.log("Parsed payment method data:", data);
      
      const paymentMethod = await storage.createPaymentMethod(data);
      res.status(201).json(paymentMethod);
    } catch (error) {
      console.error("Payment method creation error:", error);
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
      console.log("POST /api/locations request body:", req.body);
      
      const data = insertLocationSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      console.log("Parsed location data:", data);
      
      const location = await storage.createLocation(data);
      res.status(201).json(location);
    } catch (error) {
      console.error("Location creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server with verification of CSRF tokens
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Add custom verification to check CSRF token in URL
    verifyClient: (info: { origin: string; secure: boolean; req: any }) => {
      console.log('Verifying WebSocket connection');
      // Accept all connections for now - we'll improve this to verify CSRF tokens
      // This is a temporary fix to allow WebSocket connections
      return true;
    }
  });
  
  // Store active connections by user ID
  const activeConnections = new Map<number, WebSocket[]>();
  
  // Driver locations (simulated)
  const driverLocations = new Map<number, { lat: number, lng: number }>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket client connected', req.url);
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
  
  // Subscription related endpoints
  
  // Get active subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).json({ message: 'Failed to fetch subscription plans' });
    }
  });
  
  // Get user's current subscription plan
  app.get("/api/user/subscription", isAuthenticated, async (req, res) => {
    try {
      const plan = await storage.getUserSubscriptionPlan(req.user!.id);
      res.json(plan || null);
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      res.status(500).json({ message: 'Failed to fetch subscription information' });
    }
  });
  
  // Create or retrieve a subscription
  app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      const plan = await storage.getSubscriptionPlan(parseInt(planId));
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user already has a Stripe customer ID
      let customerId = user.stripeCustomerId;
      
      if (!customerId) {
        // Create a new customer in Stripe
        try {
          const customer = await stripe.customers.create({
            email: req.body.email || 'customer@example.com', // In production, always use real email
            name: user.name,
            metadata: {
              userId: user.id.toString()
            }
          });
          
          customerId = customer.id;
          
          // Update user with Stripe customer ID
          await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customerId });
        } catch (stripeError) {
          console.error('Stripe customer creation error:', stripeError);
          if (stripeSecretKey === 'sk_test_placeholder') {
            // Generate mock customer ID for testing
            customerId = 'cus_mock_' + Math.random().toString(36).substring(2, 10);
            await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customerId });
          } else {
            return res.status(400).json({ message: 'Failed to create customer. Please try again.' });
          }
        }
      }
      
      // Check if user already has a subscription
      if (user.stripeSubscriptionId) {
        try {
          // If using a real Stripe key, get the subscription
          if (stripeSecretKey !== 'sk_test_placeholder') {
            const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
            
            // Get the latest invoice and its payment intent
            let clientSecret = null;
            
            // Handle the case where latest_invoice is a string (ID)
            if (typeof subscription.latest_invoice === 'string') {
              const invoice = await stripe.invoices.retrieve(subscription.latest_invoice, { 
                expand: ['payment_intent'] 
              });
              
              // Now safely access the payment_intent if it exists
              // Use type assertion since Stripe types might not be fully accurate
              const paymentIntent = (invoice as any).payment_intent;
              if (paymentIntent && typeof paymentIntent === 'object') {
                clientSecret = paymentIntent.client_secret;
              }
            } 
            // Handle the case where latest_invoice is an object (expanded)
            else if (subscription.latest_invoice && typeof subscription.latest_invoice === 'object') {
              const invoice = subscription.latest_invoice;
              
              // Use type assertion since we know this comes from Stripe API
              const paymentIntent = (invoice as any).payment_intent;
              if (paymentIntent && typeof paymentIntent === 'object') {
                clientSecret = paymentIntent.client_secret;
              }
            }
            
            return res.json({
              subscriptionId: subscription.id,
              clientSecret: clientSecret,
              status: subscription.status
            });
          } else {
            // Mock response for testing
            return res.json({
              subscriptionId: user.stripeSubscriptionId,
              clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 15),
              status: 'active'
            });
          }
        } catch (stripeError) {
          console.error('Error retrieving subscription:', stripeError);
        }
      }
      
      // Create a new subscription
      try {
        // Always provide a mock response for now while in development
        // In production, we would only use the real Stripe API with valid price IDs
        const mockSubscriptionId = 'sub_mock_' + Math.random().toString(36).substring(2, 10);
        
        // Update user with mock subscription ID
        await storage.updateUserStripeInfo(user.id, { 
          stripeSubscriptionId: mockSubscriptionId 
        });
        
        return res.json({
          subscriptionId: mockSubscriptionId,
          clientSecret: 'pi_mock_secret_' + Math.random().toString(36).substring(2, 15),
          status: 'active'
        });
      } catch (stripeError) {
        console.error('Stripe subscription creation error:', stripeError);
        return res.status(400).json({ message: 'Failed to create subscription. Please try again.' });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to process subscription' });
    }
  });
  
  // Cancel a subscription
  app.post("/api/cancel-subscription", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(404).json({ message: "No active subscription found" });
      }
      
      if (stripeSecretKey !== 'sk_test_placeholder') {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
      }
      
      res.json({ message: "Subscription will be canceled at the end of the billing period" });
    } catch (error) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  });

  return httpServer;
}
