import { useAuth } from "@/hooks/use-auth";
import { MapPin, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { QUERY_CATEGORIES } from "@/lib/query-cache-config";
import { Order, Vehicle, FuelType } from "@shared/schema";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";
import { FuelPricesDisplay } from "@/components/fuel/FuelPricesDisplay";

export default function HomePage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/recent'],
    queryFn: getQueryFn({ 
      on401: "throw",
      category: "RECENT_ORDERS",
      retries: 2
    }),
    staleTime: QUERY_CATEGORIES.RECENT_ORDERS.staleTime,
    gcTime: QUERY_CATEGORIES.RECENT_ORDERS.gcTime,
  });
  
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    queryFn: getQueryFn({ 
      on401: "throw",
      category: "VEHICLES",
      retries: 1
    }),
    staleTime: QUERY_CATEGORIES.VEHICLES.staleTime,
    gcTime: QUERY_CATEGORIES.VEHICLES.gcTime,
  });
  
  const toggleVehicleSelection = (id: number) => {
    if (selectedVehicleId === id) {
      setSelectedVehicleId(null);
    } else {
      setSelectedVehicleId(id);
    }
  };
  
  return (
    <div className="h-screen-minus-tab overflow-y-auto bg-slate-50 touch-scroll hide-scrollbar">
      {/* Top Logo Navigation */}
      <header className="bg-white shadow-sm p-3 sm:p-4 safe-top">
        <div className="flex flex-col items-center mb-2">
          <Logo size="md" className="mb-1" />
          <div className="text-xs text-neutral-500 text-center">ON-DEMAND GASOLINE</div>
        </div>
        
        <div className="flex items-center justify-between mt-3 sm:mt-4">
          <div className="flex-1">
            <h1 className="text-lg sm:text-xl font-bold autofill-navy">
              Hi, {user?.name?.split(' ')[0] || user?.username?.split('@')[0] || 'User'}
            </h1>
            <div className="flex items-center text-xs sm:text-sm autofill-orange">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span>Current Location</span>
              <svg className="h-3 w-3 sm:h-4 sm:w-4 ml-1" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div>
            <Button variant="ghost" size="icon" className="rounded-full bg-autofill-navy text-white shadow-sm h-9 w-9 sm:h-10 sm:w-10">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Real-time Fuel Prices Display */}
      <section className="px-3 sm:px-4 pt-3 sm:pt-4 bg-white">
        <FuelPricesDisplay />
      </section>
      
      {/* Vehicle Selection - Main Content */}
      <section className="px-3 sm:px-4 py-2 bg-white flex-1 overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold autofill-navy mb-3 sm:mb-4">Which vehicles would you like to fill?</h2>
        
        {vehiclesLoading ? (
          <div className="text-center py-6 sm:py-8">
            <p className="text-sm sm:text-base">Loading your vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-5 sm:py-6">
            <p className="text-neutral-500 mb-3 sm:mb-4 text-sm sm:text-base">You haven't added any vehicles yet</p>
            <div className="flex justify-center">
              <Link href="/vehicles">
                <Button className="bg-[#FF7433] text-white hover:bg-orange-500 rounded-md py-2.5 sm:py-3 px-4 sm:px-5 text-sm sm:text-base">Add Your Vehicle</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                isSelected={selectedVehicleId === vehicle.id}
                onSelect={() => toggleVehicleSelection(vehicle.id)}
              />
            ))}
            
            <div className="flex flex-col space-y-2 sm:space-y-3 my-2 sm:my-3">
              <Link href="/vehicles" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-[#FF7433] text-[#FF7433] hover:bg-orange-50 font-medium py-2.5 sm:py-3 px-4 sm:px-5 rounded-md text-sm sm:text-base"
                >
                  + Add Vehicle/Boat
                </Button>
              </Link>
              
              {/* Link to Enhanced Fuel Selector Test */}
              <Link href="/enhanced-fuel-selector-test" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-blue-500 text-blue-500 hover:bg-blue-50 font-medium py-2.5 sm:py-3 px-4 sm:px-5 rounded-md text-sm sm:text-base"
                >
                  ✨ Try Enhanced Fuel Selector
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>
      
      {/* Order Button - Fixed at Bottom */}
      <div className="px-3 sm:px-4 py-4 sm:py-5 bg-white border-t border-gray-100 mt-auto">
        <div className="flex justify-center">
          <Link href="/order" className="block w-full">
            <Button 
              className="w-full bg-[#FF7433] text-white hover:bg-orange-500 font-bold py-4 sm:py-6 text-base sm:text-lg shadow-md rounded-md"
              disabled={!selectedVehicleId}
            >
              ORDER FUEL NOW
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
