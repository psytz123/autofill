import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, MapPin, Home, Briefcase, Map } from "lucide-react";
import { LocationType } from "@shared/schema";

interface SavedLocationListProps {
  locations: any[];
  selectedLocationId: string | null;
  onLocationSelect: (location: any) => void;
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

  const getLocationIcon = (type: LocationType) => {
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
  };

  // Find the selected location for display
  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);

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
        className="w-full mb-2 cursor-pointer border-2" 
        onClick={() => setExpanded(!expanded)}
      >
        <CardContent className="p-4">
          {selectedLocation ? (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {getLocationIcon(selectedLocation.type)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-neutral-800">{selectedLocation.name}</p>
                <p className="text-sm text-neutral-500 truncate">{selectedLocation.address}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span className="text-neutral-500">Select delivery location</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded Location List */}
      {expanded && (
        <Card className="w-full overflow-hidden mb-2 bg-neutral-50">
          <CardContent className="p-0 divide-y divide-neutral-100">
            {locations.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">
                <p>No saved locations found</p>
                <Button variant="link" className="mt-1 text-primary">
                  Add a new location
                </Button>
              </div>
            ) : (
              locations.map((location) => (
                <div
                  key={location.id}
                  className={`flex items-center p-3 hover:bg-neutral-100 cursor-pointer ${
                    selectedLocationId === location.id ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    onLocationSelect(location);
                    setExpanded(false);
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    {getLocationIcon(location.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-neutral-800">{location.name}</p>
                    <p className="text-sm text-neutral-500 truncate">{location.address}</p>
                  </div>
                  {selectedLocationId === location.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))
            )}
            
            <Button 
              variant="ghost" 
              className="w-full py-3 flex items-center justify-center text-primary"
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