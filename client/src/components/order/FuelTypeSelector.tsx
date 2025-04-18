import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FuelType } from "@shared/schema";
import { Droplet, Droplets, Truck } from "lucide-react";

interface FuelTypeSelectorProps {
  selectedType: FuelType;
  onChange: (value: FuelType) => void;
}

interface FuelOption {
  value: FuelType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function FuelTypeSelector({ selectedType, onChange }: FuelTypeSelectorProps) {
  const fuelOptions: FuelOption[] = [
    {
      value: FuelType.REGULAR_UNLEADED,
      label: "Regular Unleaded",
      description: "Standard 87 octane gasoline",
      icon: <Droplet className="h-8 w-8" />,
      color: "bg-green-100 text-green-700 border-green-300"
    },
    {
      value: FuelType.PREMIUM_UNLEADED,
      label: "Premium Unleaded",
      description: "High-performance 91+ octane gasoline",
      icon: <Droplets className="h-8 w-8" />,
      color: "bg-blue-100 text-blue-700 border-blue-300"
    },
    {
      value: FuelType.DIESEL,
      label: "Diesel",
      description: "For diesel engines only",
      icon: <Truck className="h-8 w-8" />,
      color: "bg-yellow-100 text-yellow-700 border-yellow-300"
    }
  ];

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