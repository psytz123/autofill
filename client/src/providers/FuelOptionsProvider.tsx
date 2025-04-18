
import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { FuelType } from "@shared/schema";
import { Droplet, Droplets, Truck } from "lucide-react";
import { DEFAULT_FUEL_PRICES, fetchCurrentFuelPrices, type FuelOption } from "@/lib/fuelUtils";
import { useQuery } from "@tanstack/react-query";
import { QUERY_CATEGORIES } from "@/lib/queryClient";

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

// Create context
const FuelOptionsContext = createContext<FuelOptionsContextType | null>(null);

// Create fuel options with current prices
function createFuelOptions(prices: Record<FuelType, number>): FuelOption[] {
  return [
    {
      value: FuelType.REGULAR_UNLEADED,
      label: "Regular",
      description: "87 Octane",
      icon: <RegularFuelIcon />,
      color: "bg-blue-100",
      pricePerGallon: prices[FuelType.REGULAR_UNLEADED]
    },
    {
      value: FuelType.PREMIUM_UNLEADED,
      label: "Premium",
      description: "93 Octane", 
      icon: <PremiumFuelIcon />,
      color: "bg-purple-100",
      pricePerGallon: prices[FuelType.PREMIUM_UNLEADED]
    },
    {
      value: FuelType.DIESEL,
      label: "Diesel",
      description: "Ultra Low Sulfur",
      icon: <DieselFuelIcon />,
      color: "bg-yellow-100",
      pricePerGallon: prices[FuelType.DIESEL]
    }
  ];
}

export function FuelOptionsProvider({ children }: { children: ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fuelOptions, setFuelOptions] = useState<FuelOption[]>(() => 
    createFuelOptions({ ...DEFAULT_FUEL_PRICES })
  );

  const { isLoading, refetch } = useQuery({
    queryKey: ['fuelPrices'],
    queryFn: async () => {
      try {
        const prices = await fetchCurrentFuelPrices();
        setFuelOptions(createFuelOptions(prices));
        setLastUpdated(new Date());
        
        // Save to localStorage with timestamp for faster initial loads on subsequent visits
        localStorage.setItem('fuelPrices', JSON.stringify({
          prices,
          timestamp: Date.now()
        }));
        
        return prices;
      } catch (error) {
        console.error("Failed to fetch fuel prices:", error);
        return { ...DEFAULT_FUEL_PRICES };
      }
    },
    refetchInterval: 30 * 60 * 1000,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true,
    retry: 2,
    retryDelay: 1000,
    staleTime: QUERY_CATEGORIES.FUEL_PRICES.staleTime,
    gcTime: QUERY_CATEGORIES.FUEL_PRICES.gcTime,
  });

  useEffect(() => {
    if (!lastUpdated) {
      refetch();
    }
  }, [lastUpdated, refetch]);

  const refreshPrices = async () => {
    await refetch();
  };

  const getFuelOption = (fuelType: FuelType): FuelOption | undefined => {
    return fuelOptions.find(option => option.value === fuelType);
  };

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

export default FuelOptionsProvider;
