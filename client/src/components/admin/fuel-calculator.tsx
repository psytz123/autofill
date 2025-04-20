import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Droplet, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { AdminOrder } from "@/types/admin";

interface Vehicle {
  id: number;
  userId: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  fuelType: string;
  tankSize: number;
}

export default function FuelCalculator() {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [currentFuelPercentage, setCurrentFuelPercentage] = useState<number>(20);
  const [targetFuelPercentage, setTargetFuelPercentage] = useState<number>(100);
  const [estimatedGallons, setEstimatedGallons] = useState<number>(0);
  
  // Fetch all vehicles
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/admin/api/vehicles"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch recent orders for vehicle selection hint
  const { data: recentOrders = [] } = useQuery<AdminOrder[]>({
    queryKey: ["/admin/api/recent-orders"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // When vehicle ID changes, find the corresponding vehicle
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.id.toString() === selectedVehicleId);
      setSelectedVehicle(vehicle || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [selectedVehicleId, vehicles]);

  // Calculate estimated gallons when parameters change
  useEffect(() => {
    if (selectedVehicle?.tankSize) {
      const gallonsNeeded = calculateFuelNeeded(
        selectedVehicle.tankSize,
        currentFuelPercentage,
        targetFuelPercentage
      );
      setEstimatedGallons(gallonsNeeded);
    } else {
      setEstimatedGallons(0);
    }
  }, [selectedVehicle, currentFuelPercentage, targetFuelPercentage]);

  // Calculate fuel needed based on tank size and percentages
  function calculateFuelNeeded(
    tankSize: number,
    currentPercentage: number,
    targetPercentage: number
  ): number {
    const currentAmount = (currentPercentage / 100) * tankSize;
    const targetAmount = (targetPercentage / 100) * tankSize;
    const gallonsNeeded = targetAmount - currentAmount;
    return gallonsNeeded > 0 ? parseFloat(gallonsNeeded.toFixed(2)) : 0;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Fuel Calculator</CardTitle>
        <Calculator className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          <Select
            value={selectedVehicleId}
            onValueChange={setSelectedVehicleId}
          >
            <SelectTrigger id="vehicle">
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                  {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.licensePlate}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {recentOrders.length > 0 && !selectedVehicleId && (
            <div className="text-xs text-muted-foreground mt-2">
              Recent orders: {recentOrders.slice(0, 3).map(order => 
                order.vehicleId ? `Vehicle #${order.vehicleId}` : null
              ).filter(Boolean).join(", ")}
            </div>
          )}
        </div>

        {selectedVehicle && (
          <>
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tank Size</Label>
                  <div className="font-medium">{selectedVehicle.tankSize} gallons</div>
                </div>
                <div>
                  <Label>Fuel Type</Label>
                  <div className="font-medium">{selectedVehicle.fuelType}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="current-fuel">Current Fuel Level (%)</Label>
                <span className="text-sm font-medium">{currentFuelPercentage}%</span>
              </div>
              <Slider
                id="current-fuel"
                min={0}
                max={100}
                step={1}
                value={[currentFuelPercentage]}
                onValueChange={(values) => setCurrentFuelPercentage(values[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="target-fuel">Target Fuel Level (%)</Label>
                <span className="text-sm font-medium">{targetFuelPercentage}%</span>
              </div>
              <Slider
                id="target-fuel"
                min={0}
                max={100}
                step={1}
                value={[targetFuelPercentage]}
                onValueChange={(values) => setTargetFuelPercentage(values[0])}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-medium">Estimated Fuel Needed:</span>
                <div className="flex items-center">
                  <Droplet className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="text-lg font-bold">
                    {estimatedGallons} gallons
                  </span>
                </div>
              </div>
              
              {currentFuelPercentage >= targetFuelPercentage && (
                <div className="text-sm text-yellow-600 mt-2">
                  Current fuel level is already at or above target level.
                </div>
              )}
            </div>
          </>
        )}
        
        {!selectedVehicle && (
          <div className="py-8 text-center text-muted-foreground">
            Select a vehicle to calculate fuel requirements
          </div>
        )}
      </CardContent>
    </Card>
  );
}