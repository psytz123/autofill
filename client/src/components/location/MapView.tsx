import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

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
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Simulated map loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapLoaded(true);
      
      // Simulate getting current location if no location is selected
      if (!selectedLocation) {
        onLocationSelect({
          id: "current",
          name: "Current Location",
          address: "123 Main Street, Anytown, CA 91234",
          coordinates: { lat: 37.785834, lng: -122.406417 },
          type: "other"
        });
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1569336415962-a4bd9f69c07a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80')",
        backgroundPosition: 'center',
        backgroundSize: 'cover'
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>
      
      {!mapLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <p>Loading map...</p>
          </div>
        </div>
      ) : (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <MapPin className="h-8 w-8 text-red-500" />
        </div>
      )}
    </div>
  );
}
