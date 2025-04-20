import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Car, Check } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FuelType, Location, Vehicle, LocationType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [step, setStep] = useState<'location' | 'vehicle' | 'confirmation'>('location');

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
        description: "Your request is now in progress. View it in your orders.",
      });
      setIsDialogOpen(false);
      navigate("/orders"); // Navigate directly to orders page
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
    setCurrentAddress(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position);
        setLocationError(null);
        
        // Get address immediately after getting coordinates
        getAddressFromCoordinates(
          position.coords.latitude, 
          position.coords.longitude
        ).then(address => {
          setCurrentAddress(address);
        });
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

  // Proceed to next step
  const nextStep = useCallback(() => {
    if (step === 'location') {
      if (!currentAddress) {
        toast({
          title: "Location required",
          description: "Please wait for your location to be detected",
          variant: "destructive",
        });
        return;
      }
      setStep('vehicle');
    } else if (step === 'vehicle') {
      if (!selectedVehicleId) {
        toast({
          title: "Vehicle required",
          description: "Please select a vehicle for fuel delivery",
          variant: "destructive",
        });
        return;
      }
      setStep('confirmation');
    }
  }, [step, currentAddress, selectedVehicleId, toast]);

  // Handle emergency request submission
  const handleEmergencyRequest = useCallback(async () => {
    setIsRequesting(true);
    
    try {
      // Validate location
      if (!currentLocation || !currentAddress) {
        setIsRequesting(false);
        toast({
          title: "Location required",
          description: "Please wait for your location to be detected",
          variant: "destructive",
        });
        return;
      }
      
      // Validate vehicle selection
      if (!selectedVehicleId) {
        setIsRequesting(false);
        toast({
          title: "Vehicle required",
          description: "Please select a vehicle for fuel delivery",
          variant: "destructive",
        });
        return;
      }
      
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (!selectedVehicle) {
        setIsRequesting(false);
        toast({
          title: "Invalid vehicle",
          description: "Please select a valid vehicle",
          variant: "destructive",
        });
        return;
      }
      
      const coords = {
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude
      };
      
      // Create a location object from current coordinates
      const emergencyLocation: Location = {
        id: -1, // Temporary ID, will be replaced by server
        userId: -1, // Temporary ID, will be replaced by server
        name: "Emergency Location",
        address: currentAddress,
        type: LocationType.OTHER,
        coordinates: coords,
        createdAt: new Date(),
      };
      
      // Create an emergency order
      const emergencyOrder = {
        location: emergencyLocation,
        vehicle: selectedVehicle,
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
  }, [
    currentLocation, 
    currentAddress, 
    selectedVehicleId, 
    vehicles,
    createOrderMutation, 
    toast
  ]);
  
  // Check if we have location and vehicles when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      // Reset to first step when opening the dialog
      setStep('location');
      setCurrentLocation(null);
      setCurrentAddress(null);
      setSelectedVehicleId(null);
      setIsRequesting(false);
      
      // Get current location immediately when dialog opens
      getCurrentLocation();
    }
  }, [isDialogOpen, getCurrentLocation]);

  // When vehicles are loaded, set the first one as default if none selected
  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0 && step === 'vehicle') {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId, step]);

  const renderLocationStep = () => (
    <>
      <Alert variant={locationError ? "destructive" : "default"}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {locationError || "We need your location to deliver fuel in an emergency"}
        </AlertDescription>
      </Alert>
      
      {!currentLocation && !locationError && (
        <div className="flex items-center justify-center py-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="ml-2 text-sm text-gray-500">Getting your location...</p>
        </div>
      )}
      
      {currentAddress && (
        <div className="bg-slate-50 p-3 rounded-md border">
          <p className="text-sm font-medium">Delivery Address:</p>
          <p className="text-sm mt-1">{currentAddress}</p>
        </div>
      )}
      
      <div className="flex flex-col space-y-2 pt-4">
        <Button
          onClick={nextStep}
          disabled={!currentAddress || !!locationError}
          className="w-full"
        >
          Next: Select Vehicle
        </Button>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => getCurrentLocation()}
          disabled={isRequesting}
        >
          Refresh Location
        </Button>
      </div>
    </>
  );

  const renderVehicleStep = () => (
    <>
      <p className="text-sm font-medium mb-2">Select Vehicle for Fuel Delivery:</p>
      
      {vehiclesLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
          <p className="ml-2 text-sm text-gray-500">Loading your vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to add a vehicle first. Please add a vehicle from the home page.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          <RadioGroup value={selectedVehicleId?.toString()} onValueChange={(value) => setSelectedVehicleId(Number(value))}>
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value={vehicle.id.toString()} id={`vehicle-${vehicle.id}`} />
                <Label htmlFor={`vehicle-${vehicle.id}`} className="flex-1 flex items-center">
                  <Car className="h-5 w-5 mr-2 text-neutral-600" />
                  <div>
                    <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                    <div className="text-xs text-neutral-500">{vehicle.year} • {vehicle.licensePlate}</div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}
      
      <div className="flex flex-col space-y-2 pt-4">
        <Button
          onClick={nextStep}
          disabled={!selectedVehicleId || vehicles.length === 0}
          className="w-full"
        >
          Next: Confirm Request
        </Button>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setStep('location')}
        >
          Back to Location
        </Button>
      </div>
    </>
  );

  const renderConfirmationStep = () => {
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
    
    return (
      <>
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-md border">
            <p className="text-sm font-medium">Delivery Address:</p>
            <p className="text-sm mt-1">{currentAddress}</p>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-md border">
            <p className="text-sm font-medium">Vehicle:</p>
            <p className="text-sm mt-1">
              {selectedVehicle?.make} {selectedVehicle?.model} ({selectedVehicle?.year})
            </p>
            <p className="text-xs text-neutral-500">License: {selectedVehicle?.licensePlate}</p>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-md border">
            <p className="text-sm font-medium">Fuel Type:</p>
            <p className="text-sm mt-1">Regular Unleaded</p>
            <p className="text-xs text-neutral-500">Default quantity: 10 gallons</p>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment will be collected upon delivery. Please have a valid payment method ready.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="flex flex-col space-y-2 pt-4">
          <Button
            variant="destructive"
            className="w-full font-bold"
            disabled={isRequesting}
            onClick={handleEmergencyRequest}
          >
            {isRequesting ? "Processing..." : "CONFIRM EMERGENCY FUEL REQUEST"}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setStep('vehicle')}
            disabled={isRequesting}
          >
            Back to Vehicle Selection
          </Button>
        </div>
      </>
    );
  };

  // Status step no longer needed as we redirect to orders page instead

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
              {step === 'location' && "Share your location for emergency fuel delivery"}
              {step === 'vehicle' && "Select a vehicle for emergency fuel delivery"}
              {step === 'confirmation' && "Confirm your emergency fuel request details"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {step === 'location' && renderLocationStep()}
            {step === 'vehicle' && renderVehicleStep()}
            {step === 'confirmation' && renderConfirmationStep()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}