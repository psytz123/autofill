import { FuelType } from "@shared/schema";
import { ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Fuel option types used across components
export interface FuelOption {
  value: FuelType;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
  pricePerGallon: number; // in dollars
}

// Default pricing in case API fails
const DEFAULT_FUEL_PRICES = {
  [FuelType.REGULAR_UNLEADED]: 3.49, 
  [FuelType.PREMIUM_UNLEADED]: 3.99,
  [FuelType.DIESEL]: 3.79,
};

// Exported current prices - this will be updated via API
export const FUEL_PRICES = { ...DEFAULT_FUEL_PRICES };

// Function to fetch current fuel prices from the API
export async function fetchCurrentFuelPrices(stateCode = "FL"): Promise<Record<FuelType, number>> {
  try {
    const response = await apiRequest("GET", `/api/fuel-prices?state=${stateCode}`);
    const prices = await response.json();
    
    // Update the exported FUEL_PRICES object with current values
    Object.assign(FUEL_PRICES, prices);
    
    // Invalidate queries that depend on fuel prices
    queryClient.invalidateQueries({ queryKey: ["fuelPrices"] });
    
    return prices;
  } catch (error) {
    console.error("Error fetching fuel prices:", error);
    return DEFAULT_FUEL_PRICES;
  }
}

// Initialize fuel prices on module load
fetchCurrentFuelPrices().catch(console.error);

// Delivery fee in dollars
export const BASE_DELIVERY_FEE = 5.99;

// Default tank capacities by fuel type (in gallons)
export const DEFAULT_TANK_CAPACITY = {
  [FuelType.REGULAR_UNLEADED]: 15,
  [FuelType.PREMIUM_UNLEADED]: 15,
  [FuelType.DIESEL]: 20,
};

// We'll create the fuel options dynamically in components that use this file
// to avoid JSX syntax issues in .ts files

// Get the display name with spaces instead of underscores
export function getFuelTypeDisplayName(fuelType: FuelType): string {
  return fuelType.replace("_", " ");
}

// Get price for a given fuel type
export function getFuelPrice(fuelType: FuelType): number {
  return FUEL_PRICES[fuelType];
}

// Calculate total price for a given amount of fuel
export function calculateTotalPrice(fuelType: FuelType, amount: number, includeDeliveryFee = true): number {
  const fuelCost = FUEL_PRICES[fuelType] * amount;
  return includeDeliveryFee ? fuelCost + BASE_DELIVERY_FEE : fuelCost;
}

// Format price to display with dollar sign and 2 decimal places
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

// Estimate tank capacity based on vehicle information
export function estimateTankCapacity(fuelType: FuelType): number {
  return DEFAULT_TANK_CAPACITY[fuelType];
}

// Get fill level color based on percentage
export function getFillLevelColor(fillPercentage: number): string {
  if (fillPercentage < 30) return "bg-red-500";
  if (fillPercentage < 70) return "bg-yellow-500";
  return "bg-green-500";
}