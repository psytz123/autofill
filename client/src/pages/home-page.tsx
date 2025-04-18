import { useAuth } from "@/hooks/use-auth";
import { MapPin, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";
import { Order, Vehicle, FuelType } from "@shared/schema";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Logo } from "@/components/ui/logo";

export default function HomePage() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/recent'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const toggleVehicleSelection = (id: number) => {
    if (selectedVehicleId === id) {
      setSelectedVehicleId(null);
    } else {
      setSelectedVehicleId(id);
    }
  };
  
  return (
    <div className="h-screen-minus-tab overflow-y-auto bg-slate-50">
      {/* Top Logo Navigation */}
      <header className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center mr-2">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-orange-400 to-orange-500"></div>
              </div>
            </div>
            <div className="ml-1">
              <div className="text-xs text-neutral-500">NASDAQ: NXXT</div>
            </div>
          </div>
          <div className="flex-1 mx-6">
            <h1 className="text-2xl font-extrabold text-neutral-800 text-center">
              HI, {user?.name?.toUpperCase() || user?.username?.toUpperCase() || 'USER'}
            </h1>
            <div className="flex items-center justify-center text-sm text-orange-500">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Main Highway</span>
              <svg className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div>
            <Button variant="ghost" size="icon" className="rounded-full bg-neutral-100 shadow-sm">
              <DollarSign className="h-5 w-5 text-neutral-800" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Vehicle Selection */}
      <section className="px-4 py-4 bg-white">
        <h2 className="text-xl font-bold text-neutral-800 mb-4">Which vehicles would you like to fill?</h2>
        
        {vehiclesLoading ? (
          <div className="text-center py-8">
            <p>Loading your vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-neutral-500 mb-4">You haven't added any vehicles yet</p>
            <Link href="/vehicles">
              <Button>Add Your Vehicle</Button>
            </Link>
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
            
            <Link href="/vehicles">
              <Button
                variant="outline"
                className="w-full my-3 border-orange-500 text-orange-500 hover:bg-orange-50 font-medium py-6"
              >
                + Add Vehicle/Boat
              </Button>
            </Link>
          </div>
        )}
      </section>
      
      {/* Order Button */}
      <div className="px-4 py-6">
        <Link href="/order">
          <Button 
            className="w-full bg-neutral-200 text-neutral-700 hover:bg-neutral-300 font-bold py-6 text-lg"
            disabled={!selectedVehicleId}
          >
            GET YOUR EZFILL
          </Button>
        </Link>
      </div>
    </div>
  );
}
