/**
 * Enhanced Fuel Quantity Selector Component
 * Provides an interactive and visually engaging fuel quantity selection experience
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { FuelType } from "@shared/schema";
import { GaugeCircle, DollarSign, Plus, Minus, Droplet, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { FUEL_PRICES, BASE_DELIVERY_FEE, formatPrice, getFillLevelColor } from "@/lib/fuelUtils";
import { useFuelOptions } from "@/providers/FuelOptionsProvider";

interface EnhancedFuelQuantitySelectorProps {
  amount: number;
  onChange: (value: number) => void;
  fuelType: FuelType;
  vehicleTankCapacity?: number;
}

export function EnhancedFuelQuantitySelector({
  amount,
  onChange,
  fuelType,
  vehicleTankCapacity = 15
}: EnhancedFuelQuantitySelectorProps) {
  const { getFuelOption } = useFuelOptions();
  const [priceEstimate, setPriceEstimate] = useState(0);
  const [fuelCost, setFuelCost] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);
  
  // Suggested fuel amounts in gallons
  const suggestedAmounts = [5, 10, 15, 20];
  
  // Max amount should be the vehicle's tank capacity or 25 gallons (whichever is less)
  const maxAmount = Math.min(vehicleTankCapacity, 25);
  
  // Get fuel option for the selected type
  const fuelOption = getFuelOption(fuelType);
  
  // Calculate the estimated total price
  useEffect(() => {
    if (fuelOption) {
      const fuelPrice = fuelOption.pricePerGallon * amount;
      setFuelCost(fuelPrice);
      const total = fuelPrice + BASE_DELIVERY_FEE;
      setPriceEstimate(total);
      setAnimationKey(prevKey => prevKey + 1);
    }
  }, [amount, fuelOption]);

  // Calculate fill percentage for visualization
  const fillPercentage = Math.min((amount / maxAmount) * 100, 100);
  
  // Get fill color using the utility function
  const fillColor = getFillLevelColor(fillPercentage);

  // Handle increment/decrement
  const incrementAmount = () => onChange(Math.min(amount + 1, maxAmount));
  const decrementAmount = () => onChange(Math.max(amount - 1, 1));
  
  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    onChange(value[0]);
  };

  // Get the fill description based on percentage
  const getFillDescription = (percentage: number) => {
    if (percentage < 30) return "Low";
    if (percentage < 70) return "Medium";
    return "Full";
  };

  return (
    <div className="space-y-6">
      <div className="font-medium text-lg">Select Fuel Amount</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visual fuel gauge with 3D effect */}
        <Card className="overflow-hidden border-2 border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ repeat: 0, duration: 1 }}
                key={`gauge-${animationKey}`}
              >
                <GaugeCircle className="h-14 w-14 mb-4 text-autofill-navy" />
              </motion.div>
              
              <div className="text-lg font-semibold mb-4">Fuel Tank Preview</div>
              
              <div className="w-full max-w-md h-56 rounded-lg border-2 border-gray-300 relative overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 shadow-inner">
                <motion.div 
                  className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${fillColor}`}
                  style={{ height: `${fillPercentage}%` }}
                  initial={{ height: "0%" }}
                  animate={{ height: `${fillPercentage}%` }}
                  key={`fill-${animationKey}`}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                >
                  {/* Fuel "bubbles" animation */}
                  <AnimatePresence>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={`bubble-${i}-${animationKey}`}
                        className="absolute rounded-full bg-white bg-opacity-20"
                        initial={{ 
                          x: `${Math.random() * 90 + 5}%`, 
                          y: 0, 
                          opacity: 0.7, 
                          scale: 0 
                        }}
                        animate={{ 
                          y: [0, -100 - (i * 20)], 
                          opacity: [0.7, 0], 
                          scale: [0, 1]
                        }}
                        transition={{ 
                          duration: 2, 
                          delay: i * 0.5, 
                          repeat: Infinity, 
                          repeatDelay: 1 
                        }}
                        style={{
                          width: `${Math.random() * 20 + 10}px`,
                          height: `${Math.random() * 20 + 10}px`,
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
                
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <motion.span 
                    className="text-4xl font-bold text-gray-800"
                    key={`amount-${amount}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    {amount}
                  </motion.span>
                  <span className="text-sm font-medium text-gray-600">gallons</span>
                  
                  <div className="mt-3 px-3 py-1 rounded-full bg-white bg-opacity-80 backdrop-blur-sm shadow-sm">
                    <span className="text-sm font-medium">{getFillDescription(fillPercentage)}</span>
                  </div>
                </div>
                
                {/* Tank markings */}
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between items-center p-2 pointer-events-none">
                  <span className="text-xs text-gray-500">Max</span>
                  <div className="h-[1px] w-4 bg-gray-400"></div>
                  <div className="h-[1px] w-4 bg-gray-400"></div>
                  <div className="h-[1px] w-4 bg-gray-400"></div>
                  <span className="text-xs text-gray-500">Min</span>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground flex items-center">
                <Droplet className="h-4 w-4 mr-1" />
                <span>Tank Capacity: <span className="font-medium">{vehicleTankCapacity} gallons</span></span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Price calculator and quantity controls */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: 0, duration: 1 }}
                key={`dollar-${animationKey}`}
              >
                <DollarSign className="h-14 w-14 mb-4 text-autofill-navy" />
              </motion.div>
              
              <div className="text-lg font-semibold mb-4">Price Estimate</div>
              
              <motion.div 
                className="flex justify-between items-baseline mb-6"
                key={`price-${priceEstimate.toFixed(2)}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-4xl font-bold text-autofill-navy">
                  {formatPrice(priceEstimate)}
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <span className="mr-1">Fuel cost:</span>
                    <span className="font-medium">{formatPrice(fuelCost)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center">
                    <span className="mr-1">Delivery fee:</span>
                    <span className="font-medium">{formatPrice(BASE_DELIVERY_FEE)}</span>
                  </div>
                </div>
              </motion.div>
              
              {/* Slider for quantity selection */}
              <div className="mb-6">
                <div className="mb-4">
                  <Slider
                    value={[amount]}
                    max={maxAmount}
                    min={1}
                    step={1}
                    onValueChange={handleSliderChange}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1 gal</span>
                    <span>{maxAmount} gal</span>
                  </div>
                </div>
                
                {/* Fine-tuning controls */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={decrementAmount}
                    disabled={amount <= 1}
                    className="shadow-sm"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  
                  <motion.div
                    key={amount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center rounded-full w-16 h-16 bg-gradient-to-b from-autofill-navy to-blue-700 text-white font-bold text-xl shadow-lg"
                  >
                    {amount}
                  </motion.div>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={incrementAmount}
                    disabled={amount >= maxAmount}
                    className="shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              {/* Quick selection buttons */}
              <div>
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Quick Selection</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedAmounts.map((amt) => (
                    <motion.button
                      key={amt}
                      onClick={() => onChange(Math.min(amt, maxAmount))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm
                        ${amount === amt 
                          ? 'bg-autofill-navy text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {amt} gal
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}