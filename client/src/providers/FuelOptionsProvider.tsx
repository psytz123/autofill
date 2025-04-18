import React, { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { FuelType } from "@shared/schema";
import { Droplet, Droplets, Truck } from "lucide-react";
import { FUEL_PRICES, fetchCurrentFuelPrices } from "@/lib/fuelUtils";
import { useQuery } from "@tanstack/react-query";

// Types
export interface FuelOption {
  value: FuelType;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
  pricePerGallon: number;
}

interface FuelOptionsContextType {
  fuelOptions: FuelOption[];
  getFuelOption: (fuelType: FuelType) => FuelOption | undefined;
  isLoading: boolean;
  refreshPrices: () => Promise<void>;
  lastUpdated: Date | null;
}

// Icon components
export const RegularFuelIcon = () => <Droplet className="h-8 w-8" />;
export const PremiumFuelIcon = () => <Droplets className="h-8 w-8" />;
export const DieselFuelIcon = () => <Truck className="h-8 w-8" />;

// Create empty context
const FuelOptionsContext = createContext<FuelOptionsContextType | null>(null);

// Create fuel options with current prices
function createFuelOptions(prices = FUEL_PRICES): FuelOption[] {
  return [
    {
      value: FuelType.REGULAR_UNLEADED,
      label: "Regular Unleaded",
      description: "Standard 87 octane gasoline",
      icon: <RegularFuelIcon />,
      color: "bg-green-100 text-green-700 border-green-300",
      pricePerGallon: prices[FuelType.REGULAR_UNLEADED]
    },
    {
      value: FuelType.PREMIUM_UNLEADED,
      label: "Premium Unleaded",
      description: "High-performance 91+ octane gasoline",
      icon: <PremiumFuelIcon />,
      color: "bg-blue-100 text-blue-700 border-blue-300",
      pricePerGallon: prices[FuelType.PREMIUM_UNLEADED]
    },
    {
      value: FuelType.DIESEL,
      label: "Diesel",
      description: "For diesel engines only",
      icon: <DieselFuelIcon />,
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      pricePerGallon: prices[FuelType.DIESEL]
    }
  ];
}

// Provider component
export function FuelOptionsProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fuelOptions, setFuelOptions] = useState<FuelOption[]>(createFuelOptions());
  
  // Use TanStack Query for price fetching
  const { isLoading, refetch } = useQuery({
    queryKey: ['fuelPrices'],
    queryFn: async () => {
      const prices = await fetchCurrentFuelPrices();
      setFuelOptions(createFuelOptions(prices));
      setLastUpdated(new Date());
      return prices;
    },
    // Refetch every 30 minutes and on window focus
    refetchInterval: 30 * 60 * 1000,
    refetchOnWindowFocus: true
  });

  // Function to manually refresh prices
  const refreshPrices = async () => {
    await refetch();
  };

  // Get a specific fuel option by type
  const getFuelOption = (fuelType: FuelType): FuelOption | undefined => {
    return fuelOptions.find(option => option.value === fuelType);
  };

  // Context value
  const value = {
    fuelOptions,
    getFuelOption,
    isLoading,
    refreshPrices,
    lastUpdated
  };

  return (
    <FuelOptionsContext.Provider value={value}>
      {children}
    </FuelOptionsContext.Provider>
  );
}

// Custom hook
export function useFuelOptions() {
  const context = useContext(FuelOptionsContext);
  if (!context) {
    throw new Error("useFuelOptions must be used within a FuelOptionsProvider");
  }
  return context;
}