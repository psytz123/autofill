import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Mock driver location updates for the demo
const mockDriverUpdates = [
  { lat: 37.785834, lng: -122.406417 },
  { lat: 37.785010, lng: -122.405417 },
  { lat: 37.784510, lng: -122.404317 },
  { lat: 37.783910, lng: -122.403217 },
  { lat: 37.783210, lng: -122.402917 },
];

interface OrderTrackingMapProps {
  orderId: string;
  deliveryLocation: { lat: number; lng: number };
  estimatedTime?: string;
}

export default function OrderTrackingMap({ 
  orderId, 
  deliveryLocation,
  estimatedTime 
}: OrderTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [driverLocation, setDriverLocation] = useState(mockDriverUpdates[0]);
  const [updateIndex, setUpdateIndex] = useState(0);
  
  // Simulate driver location updates
  useEffect(() => {
    if (updateIndex >= mockDriverUpdates.length - 1) return;
    
    const timer = setTimeout(() => {
      setDriverLocation(mockDriverUpdates[updateIndex + 1]);
      setUpdateIndex(prev => prev + 1);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [updateIndex]);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Live Tracking</h3>
          {estimatedTime && (
            <span className="text-sm">ETA: {estimatedTime}</span>
          )}
        </div>
        
        <div className="relative overflow-hidden rounded-lg bg-neutral-100 w-full h-48">
          {/* This would be a real map in production with Google Maps or MapBox */}
          <div ref={mapRef} className="w-full h-full bg-neutral-100 flex items-center justify-center relative">
            <div className="text-xs text-neutral-500 text-center absolute top-2 left-2 right-2">
              Map showing driver at position {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
              <br />
              heading to delivery location
            </div>
            
            {/* Simulated map content */}
            <div className="absolute w-4 h-4 bg-primary rounded-full animate-pulse" 
              style={{ 
                left: `${(((driverLocation.lng + 122.41) / 0.02) * 100)}%`, 
                top: `${(((37.79 - driverLocation.lat) / 0.01) * 100)}%` 
              }}>
            </div>
            
            <div className="absolute w-4 h-4 bg-secondary rounded-full"
              style={{ 
                left: `${(((deliveryLocation.lng + 122.41) / 0.02) * 100)}%`, 
                top: `${(((37.79 - deliveryLocation.lat) / 0.01) * 100)}%` 
              }}>
            </div>
            
            <div className="border-2 border-neutral-300 rounded-lg absolute inset-4"></div>
          </div>
        </div>
        
        <div className="mt-3 text-sm">
          <p className="font-medium">Driver is on the way</p>
          <p className="text-neutral-500">
            {updateIndex < mockDriverUpdates.length - 1 
              ? `${mockDriverUpdates.length - 1 - updateIndex} stops away` 
              : "Arriving at your location"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
