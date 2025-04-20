import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { AlertCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FuelType, Location, Vehicle, LocationType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmergencyFuelRequestProps {
  className?: string;
}

export function EmergencyFuelRequest({ className = "" }: EmergencyFuelRequestProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fetch user's saved locations
  const { data: savedLocations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    queryFn: getQueryFn({
      on401: "throw",
      retries: 1,
    }),
  });

  // Fetch user's vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
    queryFn: getQueryFn({
      on401: "throw",
      retries: 1,
    }),
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-orders"] });
      toast({
        title: "Emergency fuel request sent!",
        description: "Your fuel is on the way to your current location.",
      });
      navigate(`/orders/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to request fuel",
        description: error.message,
        variant: "destructive",
      });
      setIsRequesting(false);
    },
  });

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        setLocationError(null);
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Unable to get your location";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Please allow location access to use this feature";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out";
            break;
        }
        
        setLocationError(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Reverse geocode to get address from coordinates
  const getAddressFromCoordinates = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === "OK" && data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return "Current Location";
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return "Current Location";
    }
  }, []);

  // Handle emergency request
  const handleEmergencyRequest = useCallback(async () => {
    setIsRequesting(true);
    
    try {
      // Get current location if not already available
      if (!currentLocation) {
        getCurrentLocation();
        return;
      }
      
      // Validate we have at least one vehicle
      if (vehicles.length === 0) {
        toast({
          title: "No vehicles found",
          description: "Please add a vehicle before requesting fuel",
          variant: "destructive",
        });
        setIsRequesting(false);
        return;
      }
      
      const coords = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      };
      
      // Get address from coordinates
      const address = await getAddressFromCoordinates(coords.lat, coords.lng);
      
      // Create a location object from current coordinates
      const emergencyLocation: Location = {
        id: -1, // Temporary ID, will be replaced by server
        userId: -1, // Temporary ID, will be replaced by server
        name: "Emergency Location",
        address,
        type: LocationType.OTHER,
        coordinates: coords,
        createdAt: new Date(),
      };
      
      // Use the first vehicle by default
      const defaultVehicle = vehicles[0];
      
      // Create an emergency order
      const emergencyOrder = {
        location: emergencyLocation,
        vehicle: defaultVehicle,
        fuelType: FuelType.REGULAR_UNLEADED,
        amount: 10, // Default amount
        paymentMethod: null, // Will be collected on delivery
        deliveryDate: new Date(),
        deliveryTimeSlot: "ASAP",
        repeatWeekly: false,
        instructions: "EMERGENCY FUEL REQUEST - Please deliver as soon as possible",
        leaveGasDoorOpen: false,
        isEmergency: true,
      };
      
      // Submit the order
      createOrderMutation.mutate(emergencyOrder);
      
    } catch (error) {
      console.error("Error processing emergency request:", error);
      toast({
        title: "Error processing request",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      setIsRequesting(false);
    }
  }, [currentLocation, vehicles, createOrderMutation, toast, getCurrentLocation, getAddressFromCoordinates]);
  
  // Check if we have location and vehicles when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      // Get current location immediately when dialog opens
      getCurrentLocation();
    }
  }, [isDialogOpen, getCurrentLocation]);

  return (
    <>
      <Button 
        variant="destructive"
        className={`w-full font-bold py-3 text-base shadow-md rounded-md flex items-center justify-center ${className}`}
        onClick={() => setIsDialogOpen(true)}
      >
        <AlertCircle className="h-5 w-5 mr-2" />
        EMERGENCY FUEL
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Emergency Fuel Request
            </DialogTitle>
            <DialogDescription>
              This will send a fuel request to your current location immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {locationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{locationError}</AlertDescription>
              </Alert>
            )}
            
            {!currentLocation && !locationError && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">Getting your current location...</p>
              </div>
            )}
            
            {currentLocation && (
              <div className="text-center py-2">
                <p className="text-sm font-medium">Location ready</p>
                <p className="text-xs text-gray-500">
                  Coordinates: {currentLocation.coords.latitude.toFixed(6)}, {currentLocation.coords.longitude.toFixed(6)}
                </p>
              </div>
            )}
            
            {vehiclesLoading ? (
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">Loading your vehicles...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to add a vehicle first. Please add a vehicle from the home page.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm font-medium">Vehicle: {vehicles[0]?.make} {vehicles[0]?.model}</p>
                <p className="text-xs text-gray-500">
                  Regular unleaded fuel will be delivered
                </p>
              </div>
            )}
            
            <div className="flex flex-col space-y-2 pt-2">
              <Button
                variant="destructive"
                className="w-full font-bold"
                disabled={isRequesting || !!locationError || !currentLocation || vehicles.length === 0}
                onClick={handleEmergencyRequest}
              >
                {isRequesting ? "Processing..." : "SEND EMERGENCY REQUEST"}
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsDialogOpen(false)}
                disabled={isRequesting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}