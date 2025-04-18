import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FuelLevelSelectorProps {
  vehicleName: string;
  initialLevel?: number;
  onSave: (level: number) => void;
  onClose: () => void;
}

export default function FuelLevelSelector({
  vehicleName,
  initialLevel = 50,
  onSave,
  onClose,
}: FuelLevelSelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<number>(initialLevel);

  const fuelLevels = [
    { value: 75, label: "75%", color: "bg-green-400" },
    { value: 50, label: "50%", color: "bg-yellow-400" },
    { value: 25, label: "25%", color: "bg-red-400" },
    { value: 0, label: "EMPTY", color: "bg-neutral-200" },
    { value: -1, label: "UNKNOWN", color: "bg-neutral-400" },
  ];

  const renderFuelIndicator = (level: number, color: string) => {
    return (
      <div className="flex space-x-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-6 rounded-full ${
              i < Math.ceil((level / 100) * 4) ? color : "bg-neutral-200/50"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg font-semibold uppercase">
          Current Fuel Level
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mb-2 text-neutral-700">{vehicleName}</div>
        <div className="space-y-4">
          {fuelLevels.map((level) => (
            <div
              key={level.value}
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-neutral-50 ${
                selectedLevel === level.value ? "bg-neutral-50" : ""
              }`}
              onClick={() => setSelectedLevel(level.value)}
            >
              <div className="font-medium text-neutral-700 w-24">{level.label}</div>
              {renderFuelIndicator(level.value === -1 ? 0 : level.value, level.color)}
              {selectedLevel === level.value && (
                <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button
          className="w-full mt-6"
          size="lg"
          onClick={() => onSave(selectedLevel)}
        >
          SAVE
        </Button>
      </CardContent>
    </Card>
  );
}