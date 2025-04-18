import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FuelType } from "@shared/schema";
import { GaugeCircle, DollarSign, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FUEL_PRICES, 
  BASE_DELIVERY_FEE, 
  formatPrice,
  getFillLevelColor
} from "@/lib/fuelUtils";

interface FuelQuantitySelectorProps {
  amount: number;
  onChange: (value: number) => void;
  fuelType: FuelType;
  vehicleTankCapacity?: number;
}

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
  
  // Get fill color using the utility function
  const getFillColor = () => getFillLevelColor(fillPercentage);

  // Handle increment/decrement
  const incrementAmount = () => onChange(Math.min(amount + 1, maxAmount));
  const decrementAmount = () => onChange(Math.max(amount - 1, 1));
  
  // Handle direct input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      onChange(Math.max(1, Math.min(value, maxAmount)));
    }
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
        
        {/* Price calculator and quantity controls */}
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
              
              {/* Quantity selector with increment/decrement buttons */}
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={decrementAmount}
                    disabled={amount <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <Input 
                    type="number" 
                    min={1} 
                    max={maxAmount}
                    value={amount}
                    onChange={handleInputChange}
                    className="text-center"
                  />
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={incrementAmount}
                    disabled={amount >= maxAmount}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Range indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className={`h-2.5 rounded-full ${getFillColor()}`}
                    style={{ width: `${fillPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1 gal</span>
                  <span>{maxAmount} gal</span>
                </div>
              </div>
              
              {/* Quick selection buttons */}
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