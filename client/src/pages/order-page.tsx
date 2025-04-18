import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import MapView from "@/components/location/MapView";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import VehicleCard from "@/components/vehicles/VehicleCard";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { FuelType, Vehicle, Location, PaymentMethod } from "@shared/schema";
import StripePayment from "@/components/payment/StripePayment";
import SavedLocationList from "@/components/location/SavedLocationList";
import AddLocationForm from "@/components/location/AddLocationForm";
import FuelLevelSelector from "@/components/vehicles/FuelLevelSelector";
import LocationOption from "@/components/location/LocationOption";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const STEPS = [
  { id: "location", title: "Delivery Location" },
  { id: "vehicle", title: "Select Vehicle" },
  { id: "fuel", title: "Fuel Type & Amount" },
  { id: "payment", title: "Payment & Confirm" }
];

export default function OrderPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState({
    location: null as any,
    vehicle: null as any,
    fuelType: "" as FuelType,
    amount: 10,
    paymentMethod: null as any
  });
  
  // Fetch user's vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch user's saved locations
  const { data: savedLocations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ['/api/locations'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch user's payment methods
  const { data: paymentMethods = [], isLoading: paymentsLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/recent'] });
      toast({
        title: "Order placed successfully",
        description: "Your fuel delivery is on the way!",
      });
      navigate("/orders");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to place order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const nextStep = () => {
    // Validate current step
    if (currentStep === 0 && !orderData.location) {
      return toast({
        title: "Please select a location",
        description: "You need to select a delivery location to continue",
        variant: "destructive",
      });
    }
    
    if (currentStep === 1 && !orderData.vehicle) {
      return toast({
        title: "Please select a vehicle",
        description: "You need to select a vehicle to continue",
        variant: "destructive",
      });
    }
    
    if (currentStep === 2 && !orderData.fuelType) {
      return toast({
        title: "Please select a fuel type",
        description: "You need to select a fuel type to continue",
        variant: "destructive",
      });
    }
    
    if (currentStep === 3) {
      if (!orderData.paymentMethod) {
        return toast({
          title: "Please select a payment method",
          description: "You need to select a payment method to continue",
          variant: "destructive",
        });
      }
      
      // Submit order
      createOrderMutation.mutate(orderData);
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    if (currentStep === 0) {
      navigate("/");
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const selectLocation = (location: any) => {
    setOrderData(prev => ({ ...prev, location }));
  };
  
  const selectVehicle = (vehicle: any) => {
    setOrderData(prev => ({ ...prev, vehicle }));
  };
  
  const selectFuelType = (fuelType: FuelType) => {
    setOrderData(prev => ({ ...prev, fuelType }));
  };
  
  const updateAmount = (amount: number) => {
    setOrderData(prev => ({ ...prev, amount }));
  };
  
  const selectPaymentMethod = (paymentMethod: any) => {
    setOrderData(prev => ({ ...prev, paymentMethod }));
  };
  
  // State for dialogs
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showFuelLevel, setShowFuelLevel] = useState(false);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div id="step-location" className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Delivery Location</h2>
            
            <MapView 
              selectedLocation={orderData.location}
              onLocationSelect={selectLocation}
              className="w-full h-48 rounded-lg mb-4"
            />
            
            <SavedLocationList
              locations={savedLocations}
              selectedLocationId={orderData.location?.id}
              onLocationSelect={selectLocation}
              isLoading={locationsLoading}
              className="mb-4"
            />
            
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center"
              onClick={() => setShowAddLocation(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Location
            </Button>
            
            <Dialog open={showAddLocation} onOpenChange={setShowAddLocation}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Location</DialogTitle>
                  <DialogDescription>
                    Enter the details of your new delivery location.
                  </DialogDescription>
                </DialogHeader>
                <AddLocationForm 
                  onSuccess={() => {
                    setShowAddLocation(false);
                    toast({
                      title: "Location added",
                      description: "Your new location has been saved."
                    });
                  }} 
                />
              </DialogContent>
            </Dialog>
          </div>
        );
      
      case 1:
        return (
          <div id="step-vehicle" className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Select Vehicle</h2>
            
            {vehiclesLoading ? (
              <div className="text-center py-4">
                <p>Loading your vehicles...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-4">
                <p className="mb-3 text-neutral-500">You don't have any vehicles yet</p>
                <Button variant="outline" onClick={() => navigate("/vehicles")}>
                  Add a Vehicle
                </Button>
              </div>
            ) : (
              <div>
                {vehicles.map(vehicle => (
                  <div key={vehicle.id} className="mb-3">
                    <VehicleCard
                      vehicle={vehicle}
                      onSelect={() => selectVehicle(vehicle)}
                      isSelected={orderData.vehicle?.id === vehicle.id}
                      showActions={true}
                      actionButtons={
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOrderData(prev => ({ ...prev, vehicle }));
                            setShowFuelLevel(true);
                          }}
                        >
                          Set Fuel Level
                        </Button>
                      }
                    />
                  </div>
                ))}
              </div>
            )}
            
            <Dialog open={showFuelLevel} onOpenChange={setShowFuelLevel}>
              <DialogContent className="sm:max-w-[425px]">
                <FuelLevelSelector
                  vehicleName={`${orderData.vehicle?.make || ''} ${orderData.vehicle?.model || ''}`}
                  initialLevel={orderData.vehicle?.fuelLevel || 50}
                  onSave={(level) => {
                    // Update vehicle with new fuel level
                    if (orderData.vehicle) {
                      setOrderData(prev => ({
                        ...prev,
                        vehicle: {
                          ...prev.vehicle,
                          fuelLevel: level
                        }
                      }));
                    }
                    setShowFuelLevel(false);
                    toast({
                      title: "Fuel level updated",
                      description: "Your vehicle's fuel level has been updated."
                    });
                  }}
                  onClose={() => setShowFuelLevel(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        );
      
      case 2:
        return (
          <div id="step-fuel" className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Fuel Type & Amount</h2>
            
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-medium text-neutral-700 mb-3">Select Fuel Type</h3>
                
                <RadioGroup 
                  value={orderData.fuelType} 
                  onValueChange={(value) => selectFuelType(value as FuelType)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="REGULAR_UNLEADED" id="fuel-regular" />
                    <Label htmlFor="fuel-regular" className="flex justify-between w-full">
                      <span>Regular Unleaded</span>
                      <span className="font-medium">$3.99/gal</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PREMIUM_UNLEADED" id="fuel-premium" />
                    <Label htmlFor="fuel-premium" className="flex justify-between w-full">
                      <span>Premium Unleaded</span>
                      <span className="font-medium">$4.59/gal</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="DIESEL" id="fuel-diesel" />
                    <Label htmlFor="fuel-diesel" className="flex justify-between w-full">
                      <span>Diesel</span>
                      <span className="font-medium">$4.29/gal</span>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardContent className="p-4">
                <h3 className="font-medium text-neutral-700 mb-3">Fuel Amount</h3>
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => updateAmount(Math.max(1, orderData.amount - 1))}
                  >
                    -
                  </Button>
                  
                  <Input 
                    type="number" 
                    min={1} 
                    max={50}
                    value={orderData.amount}
                    onChange={(e) => updateAmount(parseInt(e.target.value) || 0)}
                    className="text-center"
                  />
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => updateAmount(Math.min(50, orderData.amount + 1))}
                  >
                    +
                  </Button>
                </div>
                
                <p className="mt-4 text-right font-medium">
                  Total: ${(orderData.amount * (orderData.fuelType === "PREMIUM_UNLEADED" ? 4.59 : orderData.fuelType === "DIESEL" ? 4.29 : 3.99)).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>
        );
      
      case 3:
        return (
          <div id="step-payment" className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Review & Payment</h2>
            
            <Card className="mb-4">
              <CardContent className="p-4 divide-y">
                <div className="pb-3">
                  <h3 className="font-medium text-neutral-700 mb-1">Delivery To</h3>
                  <p className="text-neutral-600">{orderData.location.address}</p>
                </div>
                
                <div className="py-3">
                  <h3 className="font-medium text-neutral-700 mb-1">Vehicle</h3>
                  <p className="text-neutral-600">
                    {orderData.vehicle.make} {orderData.vehicle.model} ({orderData.vehicle.year})
                  </p>
                </div>
                
                <div className="py-3">
                  <h3 className="font-medium text-neutral-700 mb-1">Fuel</h3>
                  <p className="text-neutral-600">
                    {orderData.fuelType.replace('_', ' ')} - {orderData.amount} gallons
                  </p>
                </div>
                
                <div className="py-3">
                  <h3 className="font-medium text-neutral-700 mb-1">Total</h3>
                  <p className="text-lg font-semibold">
                    ${(orderData.amount * (orderData.fuelType === "PREMIUM_UNLEADED" ? 4.59 : orderData.fuelType === "DIESEL" ? 4.29 : 3.99)).toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Traditional payment method selection */}
            {paymentMethods.length > 0 && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <h3 className="font-medium text-neutral-700 mb-3">Saved Payment Methods</h3>
                  
                  <RadioGroup 
                    value={orderData.paymentMethod?.id} 
                    onValueChange={(value) => {
                      const method = paymentMethods.find(m => m.id === value);
                      if (method) selectPaymentMethod(method);
                    }}
                    className="space-y-2"
                  >
                    {paymentsLoading ? (
                      <p>Loading payment methods...</p>
                    ) : (
                      paymentMethods.map(method => (
                        <div key={method.id} className="flex items-center space-x-2 border p-3 rounded-lg">
                          <RadioGroupItem value={method.id} id={`payment-${method.id}`} />
                          <Label htmlFor={`payment-${method.id}`} className="flex justify-between w-full">
                            <div className="flex items-center">
                              <div className="mr-3">
                                {method.type === 'visa' && <span className="text-blue-500">Visa</span>}
                                {method.type === 'mastercard' && <span className="text-red-500">MC</span>}
                                {method.type === 'amex' && <span className="text-blue-400">Amex</span>}
                              </div>
                              <span>•••• {method.last4}</span>
                            </div>
                            <span className="text-sm text-neutral-500">Exp: {method.expiry}</span>
                          </Label>
                        </div>
                      ))
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            )}
            
            {/* Stripe Payment Integration */}
            <div className="mb-4">
              <h3 className="font-medium text-neutral-700 mb-3">Pay with Card</h3>
              <StripePayment 
                amount={parseFloat((orderData.amount * (orderData.fuelType === "PREMIUM_UNLEADED" ? 4.59 : orderData.fuelType === "DIESEL" ? 4.29 : 3.99)).toFixed(2))}
                orderId={orderData.vehicle?.id || 1} // Using vehicle ID as a placeholder for now
                onPaymentSuccess={() => {
                  // Create a dummy payment method object for the order
                  selectPaymentMethod({
                    id: 'stripe-payment',
                    type: 'credit-card',
                    last4: '1234'
                  });
                  
                  // Move to next step or submit the order
                  setTimeout(() => {
                    createOrderMutation.mutate(orderData);
                  }, 1000);
                }}
              />
            </div>
            
            {/* Link to manage payment methods */}
            <div className="text-center mt-6">
              <Button variant="link" onClick={() => navigate("/account")}>
                Manage Payment Methods
              </Button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="h-screen-minus-tab overflow-y-auto">
      {/* Toolbar Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={prevStep}>
            <ArrowLeft className="h-6 w-6 text-neutral-700" />
          </Button>
          <h1 className="text-xl font-bold font-heading">Order Fuel</h1>
        </div>
      </header>
      
      {/* Order Step Indicator */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index <= currentStep ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500'} font-medium text-sm`}>
                    {index + 1}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 h-1 ${index < currentStep ? 'bg-primary' : 'bg-neutral-200'}`}></div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-sm text-neutral-500">Step {currentStep + 1} of {STEPS.length}</span>
          </div>
        </div>
      </div>
      
      {/* Order Process Content */}
      <div className="p-4">
        {renderStepContent()}
        
        {/* Action Button */}
        <Button 
          className="w-full" 
          onClick={nextStep}
          disabled={createOrderMutation.isPending}
        >
          {createOrderMutation.isPending ? "Processing..." : currentStep === STEPS.length - 1 ? "Place Order" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
