import { FuelType } from "@shared/schema";
import { Droplet, Droplets, Truck } from "lucide-react";
import { ReactNode } from "react";

// Fuel option types used across components
export interface FuelOption {
  value: FuelType;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
  pricePerGallon: number; // in cents
}

// Pricing per gallon in cents
export const FUEL_PRICES = {
  [FuelType.REGULAR_UNLEADED]: 399, // $3.99/gallon
  [FuelType.PREMIUM_UNLEADED]: 459, // $4.59/gallon
  [FuelType.DIESEL]: 429, // $4.29/gallon
};

// Delivery fee in cents
export const BASE_DELIVERY_FEE = 599; // $5.99

// Default tank capacities by fuel type (in gallons)
export const DEFAULT_TANK_CAPACITY = {
  [FuelType.REGULAR_UNLEADED]: 15,
  [FuelType.PREMIUM_UNLEADED]: 15,
  [FuelType.DIESEL]: 20,
};

// Standardized fuel options used across the application
export const FUEL_OPTIONS: FuelOption[] = [
  {
    value: FuelType.REGULAR_UNLEADED,
    label: "Regular Unleaded",
    description: "Standard 87 octane gasoline",
    icon: <Droplet className="h-8 w-8" />,
    color: "bg-green-100 text-green-700 border-green-300",
    pricePerGallon: FUEL_PRICES[FuelType.REGULAR_UNLEADED]
  },
  {
    value: FuelType.PREMIUM_UNLEADED,
    label: "Premium Unleaded",
    description: "High-performance 91+ octane gasoline",
    icon: <Droplets className="h-8 w-8" />,
    color: "bg-blue-100 text-blue-700 border-blue-300",
    pricePerGallon: FUEL_PRICES[FuelType.PREMIUM_UNLEADED]
  },
  {
    value: FuelType.DIESEL,
    label: "Diesel",
    description: "For diesel engines only",
    icon: <Truck className="h-8 w-8" />,
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    pricePerGallon: FUEL_PRICES[FuelType.DIESEL]
  }
];

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

// Format price in cents to dollars with 2 decimal places
export function formatPrice(priceInCents: number): string {
  return (priceInCents / 100).toFixed(2);
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