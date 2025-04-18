import React, { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { FuelType } from "@shared/schema";
import { GaugeCircle, DollarSign } from "lucide-react";

interface FuelQuantitySelectorProps {
  amount: number;
  onChange: (value: number) => void;
  fuelType: FuelType;
  vehicleTankCapacity?: number;
}

// Pricing per gallon in cents
const FUEL_PRICES = {
  [FuelType.REGULAR_UNLEADED]: 349, // $3.49/gallon
  [FuelType.PREMIUM_UNLEADED]: 419, // $4.19/gallon
  [FuelType.DIESEL]: 389, // $3.89/gallon
};

// Delivery fee in cents
const BASE_DELIVERY_FEE = 599; // $5.99

export function FuelQuantitySelector({ 
  amount, 
  onChange, 
  fuelType,
  vehicleTankCapacity = 15 // Default to 15 gallons if not provided
}: FuelQuantitySelectorProps) {
  const [priceEstimate, setPriceEstimate] = useState(0);
  
  // Suggested fuel amounts in gallons
  const suggestedAmounts = [5, 10, 15, 20];
  
  // Max amount should be the vehicle's tank capacity or 25 gallons (whichever is less)
  const maxAmount = Math.min(vehicleTankCapacity, 25);
  
  // Calculate the estimated total price
  useEffect(() => {
    const fuelPrice = FUEL_PRICES[fuelType] * amount;
    const total = fuelPrice + BASE_DELIVERY_FEE;
    setPriceEstimate(total);
  }, [amount, fuelType]);

  // Calculate fill percentage for visualization
  const fillPercentage = Math.min((amount / maxAmount) * 100, 100);
  
  // Determine color based on fill level
  const getFillColor = () => {
    if (fillPercentage < 30) return "bg-red-500";
    if (fillPercentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="font-medium text-lg">Select Fuel Amount</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual fuel gauge */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <GaugeCircle className="h-12 w-12 mb-4 text-autofill-navy" />
              <div className="text-lg font-semibold mb-2">Tank Preview</div>
              
              <div className="w-full max-w-md h-48 rounded-lg border-2 border-gray-300 relative overflow-hidden bg-gray-100">
                <div 
                  className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${getFillColor()}`}
                  style={{ height: `${fillPercentage}%` }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-gray-800">{amount}</span>
                  <span className="text-sm font-medium text-gray-600">gallons</span>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                Tank Capacity: {vehicleTankCapacity} gallons
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Price calculator and slider */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col">
              <DollarSign className="h-12 w-12 mb-4 text-autofill-navy" />
              <div className="text-lg font-semibold mb-2">Price Estimate</div>
              
              <div className="flex justify-between items-baseline mb-6">
                <div className="text-3xl font-bold text-autofill-navy">
                  ${(priceEstimate / 100).toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  ${(FUEL_PRICES[fuelType] / 100).toFixed(2)}/gal + ${(BASE_DELIVERY_FEE / 100).toFixed(2)} delivery
                </div>
              </div>
              
              <div className="mb-8">
                <Slider
                  value={[amount]}
                  min={1}
                  max={maxAmount}
                  step={1}
                  onValueChange={(values) => onChange(values[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1 gal</span>
                  <span>{maxAmount} gal</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => onChange(Math.min(amt, maxAmount))}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${amount === amt 
                        ? 'bg-autofill-navy text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                  >
                    {amt} gal
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}