import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Check, Info } from "lucide-react";
import { DEFAULT_TANK_CAPACITY } from "@/lib/fuelUtils";
import { FuelType } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FuelLevelSelectorProps {
  vehicleName: string;
  vehicleFuelType?: FuelType;
  vehicleTankSize?: number;
  initialLevel?: number;
  onSave: (level: number, calculatedAmount?: number) => void;
  onClose: () => void;
}

export default function FuelLevelSelector({
  vehicleName,
  vehicleFuelType = FuelType.REGULAR_UNLEADED,
  vehicleTankSize,
  initialLevel = 50,
  onSave,
  onClose,
}: FuelLevelSelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<number>(initialLevel);
  const [calculatedAmount, setCalculatedAmount] = useState<number | undefined>(undefined);

  // Use the vehicle's tank size if available, otherwise use default
  const tankSize = vehicleTankSize || DEFAULT_TANK_CAPACITY[vehicleFuelType];

  // Calculate the amount of fuel needed when the selected level changes
  useEffect(() => {
    if (selectedLevel >= 0) { // Only calculate for valid levels (not "UNKNOWN")
      // Formula: (1 - currentFillPercentage) * tankSize
      const currentFillPercentage = selectedLevel / 100;
      const amountNeeded = Math.round((1 - currentFillPercentage) * tankSize * 10) / 10; // Round to 1 decimal
      setCalculatedAmount(amountNeeded);
    } else {
      setCalculatedAmount(undefined);
    }
  }, [selectedLevel, tankSize]);

  const fuelLevels = [
    { value: 75, label: "75%", color: "bg-green-400" },
    { value: 50, label: "50%", color: "bg-amber-400" },
    { value: 25, label: "25%", color: "bg-red-500" },
    { value: 0, label: "EMPTY", color: "bg-neutral-200" },
    { value: -1, label: "UNKNOWN", color: "bg-slate-400" },
  ];

  const renderFuelIndicator = (level: number, color: string) => {
    if (level === -1) {
      // For UNKNOWN, render a single gray bar
      return (
        <div className="flex">
          <div className="h-3 w-32 rounded-full bg-slate-400" />
        </div>
      );
    }

    return (
      <div className="flex space-x-1">
        {Array.from({ length: 4 }).map((_, i) => {
          // For positive levels, fill the appropriate number of bars
          if (level > 0) {
            return (
              <div
                key={i}
                className={`h-3 w-8 rounded-full ${
                  i < level / 25 ? color : "bg-neutral-200/50"
                }`}
              />
            );
          } else {
            // For EMPTY, render all bars as empty
            return (
              <div key={i} className="h-3 w-8 rounded-full bg-neutral-200/50" />
            );
          }
        })}
      </div>
    );
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
        <CardTitle className="text-xl font-bold text-neutral-800">
          CURRENT FUEL LEVEL
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-neutral-500 hover:text-red-500"
        >
          <X className="h-6 w-6" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <div className="mb-2 text-neutral-700">{vehicleName}</div>
        
        {/* Tank Size Information */}
        <div className="mb-4 text-sm text-neutral-500 flex items-center">
          <span>Tank Size: {tankSize} gallons</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 ml-1 text-neutral-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Tank size is used to calculate the suggested fuel amount</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="space-y-3">
          {fuelLevels.map((level) => (
            <div
              key={level.value}
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${
                selectedLevel === level.value ? "bg-neutral-100" : ""
              }`}
              onClick={() => setSelectedLevel(level.value)}
            >
              <div className="flex items-center gap-4">
                <div className="font-medium text-neutral-700 w-20">
                  {level.label}
                </div>
                {renderFuelIndicator(level.value, level.color)}
              </div>
              {selectedLevel === level.value && (
                <Check className="h-5 w-5 text-blue-600" />
              )}
            </div>
          ))}
        </div>
        
        {/* Calculated Amount Information */}
        {calculatedAmount !== undefined && (
          <div className="mt-5 p-3 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-700">Suggested Fuel Amount</h3>
            <div className="flex justify-between items-center mt-1">
              <span className="text-blue-900">{calculatedAmount} gallons</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Calculated as: (1 - {selectedLevel/100}) × {tankSize} gallons</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
        
        <Button
          className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-white font-medium py-6"
          onClick={() => onSave(selectedLevel, calculatedAmount)}
        >
          SAVE
        </Button>
      </CardContent>
    </Card>
  );
}
