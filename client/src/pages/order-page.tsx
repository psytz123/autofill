import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, MapPin, Clock, FileText, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
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
import DeliveryTimeSelector from "@/components/order/DeliveryTimeSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { FuelSelector } from "@/components/order/FuelSelector";

const STEPS = [
  { id: "location", title: "Delivery Location", icon: MapPin },
  { id: "time", title: "Delivery Time", icon: Clock },
  { id: "instructions", title: "Delivery Instructions", icon: FileText },
  { id: "vehicle", title: "Vehicles", icon: CreditCard },
  { id: "payment", title: "Payment Method", icon: CreditCard }
];

export default function OrderPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Define proper type for the orderData
  interface OrderForm {
    location: Location | null;
    vehicle: Vehicle | null;
    fuelType: FuelType;
    amount: number;
    paymentMethod: PaymentMethod | null;
    deliveryDate: Date | null;
    deliveryTimeSlot: string | null;
    repeatWeekly: boolean;
    instructions: string;
    leaveGasDoorOpen: boolean;
  }
  
  // State with proper typing
  const [orderData, setOrderData] = useState<OrderForm>({
    location: null,
    vehicle: null,
    fuelType: "REGULAR_UNLEADED" as FuelType,
    amount: 10,
    paymentMethod: null,
    deliveryDate: null,
    deliveryTimeSlot: null,
    repeatWeekly: false,
    instructions: "",
    leaveGasDoorOpen: false
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
    
    if (currentStep === 1 && (!orderData.deliveryDate || !orderData.deliveryTimeSlot)) {
      return toast({
        title: "Please select a delivery time",
        description: "You need to select when you want your fuel delivered",
        variant: "destructive",
      });
    }
    
    // Instructions step doesn't require validation
    
    if (currentStep === 3 && !orderData.vehicle) {
      return toast({
        title: "Please select a vehicle",
        description: "You need to select a vehicle to continue",
        variant: "destructive",
      });
    }
    
    if (currentStep === 4 && !orderData.fuelType) {
      return toast({
        title: "Please select a fuel type",
        description: "You need to select a fuel type to continue",
        variant: "destructive",
      });
    }
    
    if (currentStep === 5) {
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
  
  const selectLocation = (location: Location) => {
    setOrderData(prev => ({ ...prev, location }));
  };
  
  const selectVehicle = (vehicle: Vehicle) => {
    setOrderData(prev => ({ ...prev, vehicle }));
  };
  
  const selectFuelType = (fuelType: FuelType) => {
    setOrderData(prev => ({ ...prev, fuelType }));
  };
  
  const updateAmount = (amount: number) => {
    setOrderData(prev => ({ ...prev, amount }));
  };
  
  const selectPaymentMethod = (paymentMethod: PaymentMethod) => {
    setOrderData(prev => ({ ...prev, paymentMethod }));
  };
  
  const updateDeliveryTime = (data: { date: Date; timeSlot: string; repeat: boolean }) => {
    setOrderData(prev => ({
      ...prev,
      deliveryDate: data.date,
      deliveryTimeSlot: data.timeSlot,
      repeatWeekly: data.repeat
    }));
  };
  
  const updateInstructions = (instructions: string) => {
    setOrderData(prev => ({ ...prev, instructions }));
  };
  
  const toggleLeaveGasDoorOpen = (checked: boolean) => {
    setOrderData(prev => ({ ...prev, leaveGasDoorOpen: checked }));
  };
  
  // State for dialogs
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showFuelLevel, setShowFuelLevel] = useState(false);
  const [showDeliveryTime, setShowDeliveryTime] = useState(false);
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div id="step-location" className="mb-6">
            <div className="flex items-center">
              <MapPin className="h-6 w-6 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold">Delivery Location</h2>
            </div>
            
            {orderData.location ? (
              <Card className="mt-4 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{orderData.location.name || 'Selected Location'}</h3>
                      <p className="text-neutral-600">{orderData.location.address}</p>
                    </div>
                    <ChevronDown className="h-5 w-5 text-neutral-500" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <MapView 
                  selectedLocation={orderData.location}
                  onLocationSelect={selectLocation}
                  className="w-full h-48 rounded-lg mt-4 mb-4"
                />
                
                <SavedLocationList
                  locations={savedLocations}
                  selectedLocationId={orderData.location ? orderData.location.id : null}
                  onLocationSelect={selectLocation}
                  isLoading={locationsLoading}
                  className="mb-4"
                />
              </>
            )}
            
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
          <div id="step-time" className="mb-6">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold">Delivery Time</h2>
            </div>
            
            {orderData.deliveryDate && orderData.deliveryTimeSlot ? (
              <Card className="mt-4 mb-4" onClick={() => setShowDeliveryTime(true)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {orderData.deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      <p className="text-neutral-600">{orderData.deliveryTimeSlot}</p>
                      {orderData.repeatWeekly && (
                        <p className="text-sm text-orange-500 mt-1">Repeats Weekly</p>
                      )}
                    </div>
                    <ChevronDown className="h-5 w-5 text-neutral-500" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button 
                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white" 
                onClick={() => setShowDeliveryTime(true)}
              >
                Select Delivery Time
              </Button>
            )}
            
            <Dialog open={showDeliveryTime} onOpenChange={setShowDeliveryTime}>
              <DialogContent className="sm:max-w-[425px] p-0">
                <DeliveryTimeSelector
                  onSelect={(data) => {
                    updateDeliveryTime(data);
                    setShowDeliveryTime(false);
                  }}
                  onClose={() => setShowDeliveryTime(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        );
        
      case 2:
        return (
          <div id="step-instructions" className="mb-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold">Delivery Instructions</h2>
            </div>
            
            <div className="mt-4">
              <Card className="mb-4">
                <CardContent className="p-4">
                  <h3 className="font-medium text-neutral-700 mb-3">Additional Instructions</h3>
                  
                  <Textarea
                    placeholder="Add any special delivery instructions here..."
                    value={orderData.instructions}
                    onChange={(e) => updateInstructions(e.target.value)}
                    className="min-h-[120px]"
                  />
                </CardContent>
              </Card>
              
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="gas-door" 
                      checked={orderData.leaveGasDoorOpen}
                      onCheckedChange={toggleLeaveGasDoorOpen}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label 
                        htmlFor="gas-door" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Leave gas door open
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Our delivery driver will close it after refueling
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div id="step-vehicle" className="mb-6">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold">Select Vehicle</h2>
            </div>
            
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
              <div className="mt-4">
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
                      const updatedVehicle = {
                        ...orderData.vehicle,
                        fuelLevel: level
                      };
                      setOrderData(prev => ({
                        ...prev,
                        vehicle: updatedVehicle
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
      
      case 4:
        return (
          <div id="step-fuel" className="mb-6">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold">Fuel Type & Amount</h2>
            </div>
            
            <div className="mt-4">
              {/* Use our new enhanced fuel selector component */}
              <FuelSelector
                fuelType={orderData.fuelType}
                amount={orderData.amount}
                onFuelTypeChange={selectFuelType}
                onAmountChange={updateAmount}
                vehicle={orderData.vehicle || undefined}
              />
            </div>
          </div>
        );
      
      case 5:
        return (
          <div id="step-payment" className="mb-6">
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 text-orange-500 mr-2" />
              <h2 className="text-lg font-semibold">Review & Payment</h2>
            </div>
            
            <Card className="mb-4">
              <CardContent className="p-4 divide-y">
                <div className="pb-3">
                  <h3 className="font-medium text-neutral-700 mb-1">Delivery To</h3>
                  <p className="text-neutral-600">{orderData.location?.address || 'No location selected'}</p>
                </div>
                
                <div className="py-3">
                  <h3 className="font-medium text-neutral-700 mb-1">Vehicle</h3>
                  <p className="text-neutral-600">
                    {orderData.vehicle ? `${orderData.vehicle.make} ${orderData.vehicle.model} (${orderData.vehicle.year})` : 'No vehicle selected'}
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
                    value={orderData.paymentMethod?.id ? String(orderData.paymentMethod.id) : undefined} 
                    onValueChange={(value) => {
                      const method = paymentMethods.find(m => String(m.id) === value);
                      if (method) selectPaymentMethod(method);
                    }}
                    className="space-y-2"
                  >
                    {paymentsLoading ? (
                      <p>Loading payment methods...</p>
                    ) : (
                      paymentMethods.map(method => (
                        <div key={method.id} className="flex items-center space-x-2 border p-3 rounded-lg">
                          <RadioGroupItem value={String(method.id)} id={`payment-${method.id}`} />
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
                  const dummyPaymentMethod: PaymentMethod = {
                    id: 999, // Use a numeric ID
                    userId: 1,
                    type: 'credit-card',
                    last4: '1234',
                    expiry: '12/25',
                    cardHolder: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  };
                  selectPaymentMethod(dummyPaymentMethod);
                  
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
