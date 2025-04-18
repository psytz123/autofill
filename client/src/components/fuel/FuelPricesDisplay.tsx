import React from "react";
import { useFuelOptions } from "@/providers/FuelOptionsProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/fuelUtils";

export function FuelPricesDisplay() {
  const { fuelOptions, lastUpdated, refreshPrices, isLoading } = useFuelOptions();

  const formatUpdateTime = (date: Date | null) => {
    if (!date) return "Not updated yet";
    
    // Format as "Today, 10:30 AM" or "Apr 18, 10:30 AM"
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    
    const dateOptions: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    };
    
    const timeString = date.toLocaleTimeString(undefined, timeOptions);
    
    if (isToday) {
      return `Today, ${timeString}`;
    } else {
      const dateString = date.toLocaleDateString(undefined, dateOptions);
      return `${dateString}, ${timeString}`;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Current Fuel Prices</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshPrices()}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Last updated: {formatUpdateTime(lastUpdated)}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {fuelOptions.map(option => (
            <div key={option.value} className={`rounded-lg p-3 ${option.color}`}>
              <div className="flex flex-col items-center">
                <div className="mb-1">
                  {option.icon}
                </div>
                <div className="text-lg font-bold">
                  {formatPrice(option.pricePerGallon)}
                </div>
                <div className="text-xs font-medium text-center">
                  {option.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}