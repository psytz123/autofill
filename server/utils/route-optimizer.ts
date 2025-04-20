import OpenAI from "openai";
import { drivers } from "../../shared/admin-schema";
import { orders, OrderStatus } from "../../shared/schema";

type Driver = typeof drivers.$inferSelect;
type Order = typeof orders.$inferSelect;

interface RouteOptimizationInput {
  drivers: {
    id: number;
    name: string;
    location: {
      lat: number;
      lng: number;
    };
    status: string;
  }[];
  orders: {
    id: number;
    location: {
      lat: number;
      lng: number;
      address: string;
    };
    fuelType: string;
    quantity: number;
  }[];
}

interface DriverAssignment {
  driverId: number;
  driverName: string;
  orderId: number;
  orderAddress: string;
  distanceKm: number;
  estimatedTimeMinutes: number;
  reason: string;
}

interface RouteOptimizationResult {
  assignments: DriverAssignment[];
  unassignedOrders: number[];
  explanation: string;
}

class RouteOptimizer {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OpenAI API key. Please set OPENAI_API_KEY in environment variables.');
    }
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async optimizeRoutes(availableDrivers: any[], unassignedOrders: any[]): Promise<RouteOptimizationResult> {
    if (unassignedOrders.length === 0) {
      return {
        assignments: [],
        unassignedOrders: [],
        explanation: "No unassigned orders to process."
      };
    }

    if (availableDrivers.length === 0) {
      return {
        assignments: [],
        unassignedOrders: unassignedOrders.map(order => order.id),
        explanation: "No available drivers to assign."
      };
    }

    // Prepare the input data for the model
    const optimizationInput: RouteOptimizationInput = {
      drivers: availableDrivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        location: driver.location,
        status: driver.status
      })),
      orders: unassignedOrders.map(order => ({
        id: order.id,
        location: order.location || { 
          lat: 0, 
          lng: 0, 
          address: "Unknown address" 
        },
        fuelType: order.fuelType || "REGULAR_UNLEADED",
        quantity: order.quantity || 0
      }))
    };

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a delivery route optimization expert. You will receive a JSON object containing available drivers with their current locations (latitude and longitude) and unassigned orders with their delivery locations. Your task is to assign each order to the most appropriate driver based on:
              1. Proximity (closest driver to the order location)
              2. Current driver workload (try to balance assignments)
              3. Efficient routing (minimize total distance traveled)
              
              Respond with a JSON object containing:
              1. 'assignments': Array of assignments, each with driverId, orderId, estimated distance in km, estimated time in minutes, and reason for assignment
              2. 'unassignedOrders': Array of order IDs that couldn't be assigned
              3. 'explanation': Brief explanation of your assignment strategy
              
              Use the Haversine formula to calculate distances between coordinates. Assume an average travel speed of 30 km/h in urban areas.`
          },
          {
            role: "user",
            content: JSON.stringify(optimizationInput)
          }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (content) {
        const result = JSON.parse(content);
        return result;
      } else {
        // If no content is returned, use fallback
        return this.fallbackAssignment(availableDrivers, unassignedOrders);
      }
    } catch (error) {
      console.error("Error in route optimization:", error);
      // Fallback to a simple assignment strategy if AI route optimization fails
      return this.fallbackAssignment(availableDrivers, unassignedOrders);
    }
  }

  private fallbackAssignment(availableDrivers: any[], unassignedOrders: any[]): RouteOptimizationResult {
    const assignments: DriverAssignment[] = [];
    const unassignedOrderIds: number[] = [];
    
    // Simple nearest driver assignment
    for (const order of unassignedOrders) {
      if (!order.location || !order.location.lat || !order.location.lng) {
        unassignedOrderIds.push(order.id);
        continue;
      }
      
      let closestDriver = null;
      let shortestDistance = Infinity;
      
      for (const driver of availableDrivers) {
        if (!driver.location || !driver.location.lat || !driver.location.lng) {
          continue;
        }
        
        const distance = this.calculateHaversineDistance(
          driver.location.lat, 
          driver.location.lng,
          order.location.lat,
          order.location.lng
        );
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestDriver = driver;
        }
      }
      
      if (closestDriver) {
        assignments.push({
          driverId: closestDriver.id,
          driverName: closestDriver.name,
          orderId: order.id,
          orderAddress: order.location.address ? order.location.address : "Unknown address",
          distanceKm: parseFloat(shortestDistance.toFixed(2)),
          estimatedTimeMinutes: Math.round(shortestDistance / 30 * 60), // Assuming 30 km/h
          reason: "Closest available driver"
        });
      } else {
        unassignedOrderIds.push(order.id);
      }
    }
    
    return {
      assignments,
      unassignedOrders: unassignedOrderIds,
      explanation: "Simple nearest-driver assignment strategy (fallback method)"
    };
  }
  
  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // Convert latitude and longitude from degrees to radians
    const toRadians = (degrees: number) => degrees * Math.PI / 180;
    
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    lat1 = toRadians(lat1);
    lat2 = toRadians(lat2);
    
    // Haversine formula
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    // Earth radius in kilometers
    const radius = 6371;
    
    // Distance in kilometers
    return radius * c;
  }
}

export const routeOptimizer = new RouteOptimizer();