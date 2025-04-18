import React, { useState } from "react";
import { FuelTypeSelector } from "./FuelTypeSelector";
import { FuelQuantitySelector } from "./FuelQuantitySelector";
import { FuelType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Vehicle } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FuelSelectorProps {
  fuelType: FuelType;
  amount: number;
  onFuelTypeChange: (value: FuelType) => void;
  onAmountChange: (value: number) => void;
  vehicle?: Vehicle;
}

const DEFAULT_TANK_CAPACITY = {
  [FuelType.REGULAR_UNLEADED]: 15,
  [FuelType.PREMIUM_UNLEADED]: 15,
  [FuelType.DIESEL]: 20,
};

export function FuelSelector({
  fuelType,
  amount,
  onFuelTypeChange,
  onAmountChange,
  vehicle,
}: FuelSelectorProps) {
  // Detect fuel type mismatch between vehicle and selection
  const fuelTypeMismatch = vehicle && vehicle.fuelType !== fuelType;
  
  // Estimate tank capacity based on vehicle info or use defaults
  const estimateTankCapacity = () => {
    if (!vehicle) return DEFAULT_TANK_CAPACITY[fuelType];
    
    // Typical capacities based on vehicle type/size (simplified for demo)
    // In a real app, this might come from a database of vehicle specifications
    switch (vehicle.fuelType) {
      case FuelType.DIESEL:
        return 20; // Diesel vehicles typically have larger tanks
      default:
        return 15; // Standard gas tank size
    }
  };

  const tankCapacity = estimateTankCapacity();

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        {vehicle && (
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">Selected Vehicle</h3>
              <Badge variant="outline" className="text-xs">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Badge>
            </div>
            <Badge 
              variant={vehicle.fuelType === fuelType ? "default" : "destructive"}
              className="text-xs"
            >
              {vehicle.fuelType.replace("_", " ")}
            </Badge>
          </div>
        )}

        {fuelTypeMismatch && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: The selected fuel type doesn't match your vehicle's recommended fuel type ({vehicle?.fuelType.replace("_", " ")}).
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          <FuelTypeSelector 
            selectedType={fuelType} 
            onChange={onFuelTypeChange} 
          />
          
          <FuelQuantitySelector 
            amount={amount} 
            onChange={onAmountChange} 
            fuelType={fuelType}
            vehicleTankCapacity={tankCapacity}
          />
        </div>
      </CardContent>
    </Card>
  );
}