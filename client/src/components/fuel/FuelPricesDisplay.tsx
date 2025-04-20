import React from "react";
import { useFuelOptions } from "@/providers/FuelOptionsProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/fuelUtils";

export function FuelPricesDisplay() {
  const { fuelOptions, lastUpdated, refreshPrices, isLoading } =
    useFuelOptions();

  const formatUpdateTime = (date: Date | null) => {
    if (!date) return "Not updated yet";

    // Format as "Today, 10:30 AM" or "Apr 18, 10:30 AM"
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
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
    <Card className="mb-4 sm:mb-6">
      <CardHeader className="pb-1 sm:pb-2 pt-3 sm:pt-4 px-3 sm:px-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base sm:text-lg">
            Current Fuel Prices
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshPrices()}
            disabled={isLoading}
            className="h-7 sm:h-8 text-xs sm:text-sm py-0 px-2"
          >
            <RefreshCw
              className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Updating..." : "Refresh"}
          </Button>
        </div>
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
          Last updated: {formatUpdateTime(lastUpdated)}
        </p>
      </CardHeader>
      <CardContent className="pt-1 pb-3 px-3 sm:px-6">
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {fuelOptions.map((option) => (
            <div
              key={option.value}
              className={`rounded-lg p-2 sm:p-3 ${option.color}`}
            >
              <div className="flex flex-col items-center">
                <div className="mb-0.5 sm:mb-1">
                  {React.cloneElement(option.icon as React.ReactElement, {
                    className: `h-4 w-4 sm:h-5 sm:w-5 ${(option.icon as React.ReactElement).props.className}`,
                  })}
                </div>
                <div className="text-base sm:text-lg font-bold">
                  {formatPrice(option.pricePerGallon)}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-center">
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
