import { FuelType } from "@shared/schema";
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