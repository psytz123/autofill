/**
 * Enhanced Fuel Type Selector Component
 * Provides an interactive and visually engaging fuel type selection experience
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FuelType } from "@shared/schema";
import { useFuelOptions } from "@/providers/FuelOptionsProvider";
import { formatPrice } from "@/lib/fuelUtils";
import { Droplet, Droplets, Truck, Check } from "lucide-react";

interface EnhancedFuelTypeSelectorProps {
  selectedType: FuelType;
  onChange: (value: FuelType) => void;
  showPrices?: boolean;
}

export function EnhancedFuelTypeSelector({ 
  selectedType, 
  onChange,
  showPrices = true,
}: EnhancedFuelTypeSelectorProps) {
  const { fuelOptions } = useFuelOptions();
  const [hoveredType, setHoveredType] = useState<FuelType | null>(null);
  
  // Get the fuel icon based on type
  const getFuelIcon = (type: FuelType) => {
    switch (type) {
      case FuelType.REGULAR_UNLEADED:
        return <Droplet className="h-8 w-8" />;
      case FuelType.PREMIUM_UNLEADED:
        return <Droplets className="h-8 w-8" />;
      case FuelType.DIESEL:
        return <Truck className="h-8 w-8" />;
    }
  };
  
  // Get the background color for the fuel type
  const getFuelColor = (type: FuelType, isSelected: boolean) => {
    switch (type) {
      case FuelType.REGULAR_UNLEADED:
        return isSelected ? "bg-blue-100" : "bg-blue-50";
      case FuelType.PREMIUM_UNLEADED:
        return isSelected ? "bg-purple-100" : "bg-purple-50";
      case FuelType.DIESEL:
        return isSelected ? "bg-yellow-100" : "bg-yellow-50";
    }
  };
  
  // Get the border color for the fuel type
  const getBorderColor = (type: FuelType, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) {
      switch (type) {
        case FuelType.REGULAR_UNLEADED:
          return "border-blue-500";
        case FuelType.PREMIUM_UNLEADED:
          return "border-purple-500";
        case FuelType.DIESEL:
          return "border-yellow-500";
      }
    }
    return isHovered ? "border-gray-400" : "border-gray-200";
  };

  return (
    <div className="space-y-4">
      <div className="font-medium text-lg">Select Fuel Type</div>
      <RadioGroup
        value={selectedType}
        onValueChange={(value) => onChange(value as FuelType)}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {fuelOptions.map((option) => {
          const isSelected = selectedType === option.value;
          const isHovered = hoveredType === option.value;
          
          return (
            <motion.div
              key={option.value}
              className="relative"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <RadioGroupItem
                value={option.value}
                id={option.value}
                className="peer sr-only"
              />
              <Label
                htmlFor={option.value}
                className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer 
                  transition-all duration-300 h-full
                  ${getBorderColor(option.value, isSelected, isHovered)} 
                  ${getFuelColor(option.value, isSelected)}`}
                onMouseEnter={() => setHoveredType(option.value)}
                onMouseLeave={() => setHoveredType(null)}
              >
                <div className="relative">
                  <div className={`rounded-full p-3 ${getFuelColor(option.value, true)}`}>
                    {getFuelIcon(option.value)}
                  </div>
                  {isSelected && (
                    <motion.div 
                      className="absolute -right-1 -top-1 bg-green-500 rounded-full p-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                      <Check className="h-3 w-3 text-white" />
                    </motion.div>
                  )}
                </div>
                
                <div className="font-semibold mt-3">{option.label}</div>
                <div className="text-sm text-muted-foreground text-center mt-1">{option.description}</div>
                
                {showPrices && (
                  <div className="mt-3 font-medium text-lg">
                    {formatPrice(option.pricePerGallon)}/gal
                  </div>
                )}
                
                {isSelected && (
                  <motion.div 
                    className="w-full h-1 bg-primary absolute bottom-0 left-0 right-0"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </Label>
            </motion.div>
          );
        })}
      </RadioGroup>
    </div>
  );
}