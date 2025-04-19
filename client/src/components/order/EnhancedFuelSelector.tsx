/**
 * Enhanced Fuel Selector Component
 * Combines the enhanced fuel type and quantity selectors into a single, cohesive experience
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedFuelTypeSelector } from "./EnhancedFuelTypeSelector";
import { EnhancedFuelQuantitySelector } from "./EnhancedFuelQuantitySelector";
import { FuelType, Vehicle } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Car, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {  
  DEFAULT_TANK_CAPACITY,
  getFuelTypeDisplayName, 
  estimateTankCapacity,
  formatPrice,
  calculateTotalPrice
} from "@/lib/fuelUtils";
import { useFuelOptions } from "@/providers/FuelOptionsProvider";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EnhancedFuelSelectorProps {
  fuelType: FuelType;
  amount: number;
  onFuelTypeChange: (value: FuelType) => void;
  onAmountChange: (value: number) => void;
  vehicle?: Vehicle;
}

export function EnhancedFuelSelector({
  fuelType,
  amount,
  onFuelTypeChange,
  onAmountChange,
  vehicle,
}: EnhancedFuelSelectorProps) {
  const { getFuelOption } = useFuelOptions();
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Detect fuel type mismatch between vehicle and selection
  const fuelTypeMismatch = vehicle && vehicle.fuelType !== fuelType;
  
  // Get the appropriate tank capacity based on the selected fuel type
  const tankCapacity = vehicle 
    ? DEFAULT_TANK_CAPACITY[vehicle.fuelType]
    : estimateTankCapacity(fuelType);
  
  // Update the total price whenever fuel type or amount changes
  useEffect(() => {
    const price = calculateTotalPrice(fuelType, amount);
    setTotalPrice(price);
  }, [fuelType, amount]);

  // Get the fuel option for display
  const selectedFuelOption = getFuelOption(fuelType);

  return (
    <div className="space-y-8">
      {/* Fuel Type Selector Section */}
      <section>
        <EnhancedFuelTypeSelector 
          selectedType={fuelType} 
          onChange={onFuelTypeChange} 
          showPrices={true}
        />
      </section>

      {/* Vehicle Information & Warnings */}
      {vehicle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-2 bg-gradient-to-r from-blue-50 to-gray-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Car className="h-5 w-5 mt-0.5 text-autofill-navy flex-shrink-0" />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">Selected Vehicle</h3>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant={fuelTypeMismatch ? "destructive" : "outline"}
                            className="text-xs ml-2"
                          >
                            Fuel: {getFuelTypeDisplayName(vehicle.fuelType)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Recommended fuel type for this vehicle</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {/* Fuel level indicator */}
                  <div className="mt-2 flex items-center">
                    <div className="text-xs text-muted-foreground mr-2">Current Fuel Level:</div>
                    <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(vehicle.fuelLevel || 0) * 100}%` }}
                      ></div>
                    </div>
                    <div className="ml-2 text-xs font-medium">
                      {Math.round((vehicle.fuelLevel || 0) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Fuel Type Mismatch Warning */}
      <AnimatePresence>
        {fuelTypeMismatch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: The selected fuel type ({getFuelTypeDisplayName(fuelType)}) doesn't match your vehicle's recommended fuel type ({vehicle ? getFuelTypeDisplayName(vehicle.fuelType) : ''}).
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fuel Quantity Selector Section */}
      <section className="mt-8">
        <EnhancedFuelQuantitySelector
          amount={amount}
          onChange={onAmountChange}
          fuelType={fuelType}
          vehicleTankCapacity={tankCapacity}
        />
      </section>

      {/* Order Summary */}
      <motion.section
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-2 bg-gradient-to-r from-gray-50 to-blue-50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Info className="h-5 w-5 mr-2 text-autofill-navy" />
                <h3 className="font-semibold">Order Summary</h3>
              </div>
              <Badge variant="outline">Estimated Total</Badge>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-muted-foreground">Fuel Type</div>
                <div className="font-medium">{getFuelTypeDisplayName(fuelType)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="font-medium">{amount} gallons</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Price Per Gallon</div>
                <div className="font-medium">
                  {selectedFuelOption ? formatPrice(selectedFuelOption.pricePerGallon) : 'Loading...'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Price</div>
                <div className="text-lg font-bold text-autofill-navy">{formatPrice(totalPrice)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}