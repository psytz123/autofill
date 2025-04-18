
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FuelType } from "@shared/schema";
import { useFuelOptions } from "@/providers/FuelOptionsProvider";

interface FuelTypeSelectorProps {
  selectedType: FuelType;
  onChange: (value: FuelType) => void;
}

export function FuelTypeSelector({ selectedType, onChange }: FuelTypeSelectorProps) {
  const { fuelOptions } = useFuelOptions();
  
  return (
    <div className="space-y-4">
      <div className="font-medium text-lg">Select Fuel Type</div>
      <RadioGroup
        value={selectedType}
        onValueChange={(value) => onChange(value as FuelType)}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {fuelOptions.map((option) => (
          <div key={option.value} className="relative">
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={option.value}
              className={`flex flex-col items-center justify-between rounded-md border-2 p-4 cursor-pointer hover:bg-opacity-80 transition-all
                ${selectedType === option.value 
                  ? `border-autofill-navy ring-2 ring-autofill-navy ring-offset-2 ${option.color}` 
                  : "border-muted bg-popover"}`}
            >
              <div className={`rounded-full p-3 ${selectedType === option.value ? option.color : "bg-muted"}`}>
                {option.icon}
              </div>
              <div className="font-semibold mt-3">{option.label}</div>
              <div className="text-sm text-muted-foreground text-center mt-1">{option.description}</div>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
