import React, { useState } from "react";
import { FuelTypeSelector } from "./FuelTypeSelector";
import { FuelQuantitySelector } from "./FuelQuantitySelector";
import { FuelType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Vehicle } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DEFAULT_TANK_CAPACITY, getFuelTypeDisplayName, estimateTankCapacity } from "@/lib/fuelUtils";

interface FuelSelectorProps {
  fuelType: FuelType;
  amount: number;
  onFuelTypeChange: (value: FuelType) => void;
  onAmountChange: (value: number) => void;
  vehicle?: Vehicle;
}

export function FuelSelector({
  fuelType,
  amount,
  onFuelTypeChange,
  onAmountChange,
  vehicle,
}: FuelSelectorProps) {
  // Detect fuel type mismatch between vehicle and selection
  const fuelTypeMismatch = vehicle && vehicle.fuelType !== fuelType;
  
  // Get the appropriate tank capacity based on the selected fuel type
  const tankCapacity = vehicle?.fuelType 
    ? DEFAULT_TANK_CAPACITY[vehicle.fuelType]
    : estimateTankCapacity(fuelType);

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
              {getFuelTypeDisplayName(vehicle.fuelType)}
            </Badge>
          </div>
        )}

        {fuelTypeMismatch && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Warning: The selected fuel type doesn't match your vehicle's recommended fuel type ({vehicle ? getFuelTypeDisplayName(vehicle.fuelType) : ''}).
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