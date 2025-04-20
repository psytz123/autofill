import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, MapPin, Home, Briefcase, Map, ChevronDown } from "lucide-react";
import { LocationType, Location } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface SavedLocationListProps {
  locations: Location[];
  selectedLocationId: number | null;
  onLocationSelect: (location: Location) => void;
  isLoading?: boolean;
  className?: string;
}

export default function SavedLocationList({
  locations = [],
  selectedLocationId,
  onLocationSelect,
  isLoading = false,
  className = "",
}: SavedLocationListProps) {
  const [expanded, setExpanded] = useState(false);
  const [sanitizedLocations, setSanitizedLocations] = useState<Location[]>([]);
  const { toast } = useToast();

  // Process and sanitize locations to ensure they match expected type format
  useEffect(() => {
    if (locations && locations.length > 0) {
      try {
        // Make sure all locations have valid coordinates and other required properties
        const processed = locations.map((location) => ({
          ...location,
          id: location.id || -1,
          coordinates: location.coordinates || { lat: 0, lng: 0 },
          type: location.type || LocationType.OTHER,
        }));

        setSanitizedLocations(processed);
        console.log("Processed locations for dropdown:", processed);
      } catch (error) {
        console.error("Error processing locations:", error);
        toast({
          title: "Error loading locations",
          description: "There was a problem processing your saved locations.",
          variant: "destructive",
        });
      }
    } else {
      setSanitizedLocations([]);
    }
  }, [locations, toast]);

  // Memoize this function to prevent recreating it on each render
  const getLocationIcon = useCallback((type: LocationType) => {
    switch (type) {
      case LocationType.HOME:
        return <Home className="h-5 w-5 text-primary" />;
      case LocationType.WORK:
        return <Briefcase className="h-5 w-5 text-primary" />;
      case LocationType.OTHER:
        return <MapPin className="h-5 w-5 text-primary" />;
      default:
        return <MapPin className="h-5 w-5 text-primary" />;
    }
  }, []);

  // Toggle expanded state with useCallback to prevent recreation on each render
  const toggleExpanded = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setExpanded(prev => !prev);
  }, []);

  // Trigger add location dialog
  const handleAddLocation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("add-location-requested"));
    }
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback((location: Location) => {
    console.log("Location selected from dropdown:", location);
    // Create a safe copy to ensure all properties exist
    const safeLocation = {
      ...location,
      id: location.id || -1,
      coordinates: location.coordinates || { lat: 0, lng: 0 },
      type: location.type,
    };
    onLocationSelect(safeLocation);
    setExpanded(false);
  }, [onLocationSelect]);

  // Find the selected location for display
  const selectedLocation = sanitizedLocations.find(
    (loc) => loc.id === selectedLocationId,
  );

  if (isLoading) {
    return (
      <Card className={`w-full overflow-hidden ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-neutral-100 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-neutral-100 rounded w-3/4 animate-pulse mb-2" />
              <div className="h-3 bg-neutral-100 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Selected Location or Collapsed View */}
      <Card
        className="w-full mb-2 cursor-pointer shadow-sm"
        onClick={toggleExpanded}
      >
        <CardContent className="p-4">
          {selectedLocation ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {getLocationIcon(selectedLocation.type)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium text-neutral-800">
                    {selectedLocation.name}
                  </p>
                  <p className="text-sm text-neutral-500 truncate max-w-[200px]">
                    {selectedLocation.address}
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-neutral-500 transition-transform ${expanded ? "rotate-180" : ""}`} 
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="text-neutral-500">
                  Select delivery location
                </span>
              </div>
              <ChevronDown 
                className={`h-5 w-5 text-neutral-500 transition-transform ${expanded ? "rotate-180" : ""}`} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded Location List */}
      {expanded && (
        <Card className="w-full overflow-hidden mb-2 bg-white shadow-md border-t-0 saved-location-list">
          <CardContent className="p-0 divide-y divide-neutral-100 max-h-[300px] overflow-y-auto">
            {sanitizedLocations.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">
                <p>No saved locations found</p>
                <Button
                  variant="link"
                  className="mt-1 text-primary"
                  onClick={handleAddLocation}
                >
                  Add a new location
                </Button>
              </div>
            ) : (
              sanitizedLocations.map((location) => (
                <div
                  key={location.id}
                  className={`flex items-center p-3 hover:bg-neutral-100 cursor-pointer ${
                    selectedLocationId === location.id ? "bg-primary/5" : ""
                  }`}
                  onClick={() => handleLocationSelect(location)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    {getLocationIcon(location.type)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium text-neutral-800">
                      {location.name}
                    </p>
                    <p className="text-sm text-neutral-500 truncate max-w-[200px]">
                      {location.address}
                    </p>
                  </div>
                  {selectedLocationId === location.id && (
                    <Check className="h-5 w-5 text-primary ml-2 flex-shrink-0" />
                  )}
                </div>
              ))
            )}

            <Button
              variant="ghost"
              className="w-full py-3 flex items-center justify-center text-primary"
              onClick={handleAddLocation}
            >
              <MapPin className="h-5 w-5 mr-2" />
              <span>Add New Location</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
