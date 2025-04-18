import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";

interface MapViewProps {
  selectedLocation: any;
  onLocationSelect: (location: any) => void;
  className?: string;
}

export default function MapView({ 
  selectedLocation, 
  onLocationSelect,
  className = "" 
}: MapViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  // Simulate fetching user's current location
  useEffect(() => {
    setIsLoading(true);
    // In a real app, we would use the Geolocation API
    setTimeout(() => {
      // Using San Francisco as a default location
      setCurrentLocation({ lat: 37.7749, lng: -122.4194 });
      setIsLoading(false);
    }, 1000);
  }, []);
  
  const handleMapClick = () => {
    if (currentLocation) {
      // In a real implementation, this would be the selected point on the map
      const newLocation = {
        id: 'current-location',
        name: 'Current Location',
        address: '123 Market St, San Francisco, CA 94105',
        type: 'other',
        coordinates: currentLocation
      };
      onLocationSelect(newLocation);
    }
  };
  
  return (
    <Card 
      className={`relative overflow-hidden ${className}`}
      onClick={handleMapClick}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Map Placeholder - Would be replaced with actual map in production */}
          <div className="absolute inset-0 bg-neutral-100">
            <div className="p-2 text-xs bg-white absolute bottom-2 left-2 rounded shadow-sm">
              Map view (simulated)
            </div>
            
            {/* Location pin */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <MapPin className="h-8 w-8 text-primary" />
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white" />
              </div>
            </div>
            
            {selectedLocation && (
              <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-md">
                <p className="text-sm font-medium">{selectedLocation.name}</p>
                <p className="text-xs text-neutral-500 truncate max-w-[150px]">{selectedLocation.address}</p>
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}