import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Truck } from "lucide-react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Define types for drivers and orders
interface AdminDriver {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: "AVAILABLE" | "BUSY" | "OFFLINE";
  location?: {
    lat: number;
    lng: number;
  };
  lastUpdated?: string;
}

interface AdminOrder {
  id: number;
  status: string;
  createdAt: string;
  customerId: number;
  customerName: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  fuelType: string;
  quantity: number;
  assigned?: boolean;
  assignedDriverId?: number;
  assignedDriverName?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 25.761681,
  lng: -80.191788, // Miami, FL
};

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places", "geometry"];

interface DriverTrackingMapProps {
  onAssignDriver?: (orderId: number, driverId: number) => void;
}

export default function DriverTrackingMap({ onAssignDriver }: DriverTrackingMapProps) {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<AdminDriver | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [assignLoading, setAssignLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [locationRefreshing, setLocationRefreshing] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  // Fetch tracking data (combines drivers, assigned orders, and unassigned orders)
  const {
    data: trackingData,
    isLoading: trackingDataLoading,
    error: trackingDataError,
    refetch: refetchTrackingData,
  } = useQuery({
    queryKey: ["/admin/api/tracking-data"],
    enabled: isLoaded,
  });

  // Extract data from tracking response
  const unassignedOrders = trackingData?.unassignedOrders || [];
  const assignedOrders = trackingData?.assignedOrders || [];
  const availableDrivers = trackingData?.drivers.filter(d => d.status === "AVAILABLE") || [];
  const allDrivers = trackingData?.drivers || [];

  // Function to refresh location data
  const refreshLocations = async () => {
    setLocationRefreshing(true);
    try {
      await refetchTrackingData();
      toast({
        title: "Locations refreshed",
        description: "All driver locations and orders have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error refreshing data",
        description: "Failed to refresh locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLocationRefreshing(false);
    }
  };

  // Refresh data periodically (every 30 seconds)
  useEffect(() => {
    if (!isLoaded) return;

    const intervalId = setInterval(() => {
      refreshLocations();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isLoaded]);

  // Calculate directions between driver and order
  const calculateDirections = useCallback((driver: AdminDriver, order: AdminOrder) => {
    if (!isLoaded || !driver.location || !order.location) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new google.maps.LatLng(driver.location.lat, driver.location.lng),
        destination: new google.maps.LatLng(order.location.lat, order.location.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          toast({
            title: "Directions error",
            description: `Could not calculate directions: ${status}`,
            variant: "destructive",
          });
        }
      }
    );
  }, [isLoaded, toast]);

  // Clear directions when changing selections
  useEffect(() => {
    if (selectedDriver && selectedOrder) {
      calculateDirections(selectedDriver, selectedOrder);
    } else {
      setDirections(null);
    }
  }, [selectedDriver, selectedOrder, calculateDirections]);

  // Update map center when driver or order is selected
  useEffect(() => {
    if (selectedOrder?.location) {
      setMapCenter(selectedOrder.location);
    } else if (selectedDriver?.location) {
      setMapCenter(selectedDriver.location);
    }
  }, [selectedOrder, selectedDriver]);

  // Handle assigning a driver to an order
  const handleAssignDriver = useCallback(() => {
    if (!selectedOrder || !selectedDriver || !onAssignDriver) return;

    setAssignLoading(true);
    onAssignDriver(selectedOrder.id, selectedDriver.id);
    setTimeout(() => {
      // Clear state after assignment
      setAssignLoading(false);
      setSelectedOrder(null);
      setSelectedDriver(null);
      setDirections(null);
    }, 1000);
  }, [selectedOrder, selectedDriver, onAssignDriver]);

  // Memoize filtered unassigned orders with location data
  const filteredUnassignedOrders = useMemo(() => {
    if (!unassignedOrders) return [];
    return unassignedOrders.filter((order: AdminOrder) => order.location);
  }, [unassignedOrders]);

  // Memoize filtered assigned orders with location data
  const filteredAssignedOrders = useMemo(() => {
    if (!assignedOrders) return [];
    return assignedOrders.filter((order: AdminOrder) => order.location);
  }, [assignedOrders]);

  // Memoize available drivers with location data
  const driversWithLocation = useMemo(() => {
    if (!availableDrivers) return [];
    return availableDrivers.filter((driver: AdminDriver) => driver.location);
  }, [availableDrivers]);

  // Memoize all drivers with location data
  const allDriversWithLocation = useMemo(() => {
    if (!allDrivers) return [];
    return allDrivers.filter((driver: AdminDriver) => driver.location);
  }, [allDrivers]);

  if (loadError) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <p className="text-red-500">Error loading Google Maps API: {loadError.message}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Google Maps...</span>
      </div>
    );
  }

  const isLoading = trackingDataLoading;
  const hasError = trackingDataError;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Driver Tracking Dashboard</h2>
          <p className="text-gray-500">Monitor driver locations and assign deliveries</p>
        </div>
        <Button
          variant="outline"
          onClick={refreshLocations}
          disabled={locationRefreshing}
        >
          {locationRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>Refresh Locations</>
          )}
        </Button>
      </div>

      {isLoading && (
        <div className="bg-white rounded-lg p-6 shadow-sm flex items-center justify-center h-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading tracking data...</span>
        </div>
      )}

      {hasError && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <p className="text-red-500">Error loading data. Please try refreshing.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Live Tracking Map</CardTitle>
              <CardDescription>
                Real-time driver and order locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={12}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {/* Render unassigned order markers */}
                {filteredUnassignedOrders.map((order: AdminOrder) => (
                  <Marker
                    key={`order-${order.id}`}
                    position={order.location}
                    onClick={() => {
                      setSelectedOrder(order);
                      setActiveTab("orders");
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#ef4444",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                    }}
                  />
                ))}

                {/* Render assigned order markers */}
                {filteredAssignedOrders.map((order: AdminOrder) => (
                  <Marker
                    key={`assigned-order-${order.id}`}
                    position={order.location}
                    onClick={() => {
                      setSelectedOrder(order);
                      setActiveTab("orders");
                    }}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: "#3b82f6",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                    }}
                  />
                ))}

                {/* Render driver markers */}
                {allDriversWithLocation.map((driver: AdminDriver) => (
                  <Marker
                    key={`driver-${driver.id}`}
                    position={driver.location!}
                    onClick={() => {
                      setSelectedDriver(driver);
                      setActiveTab("drivers");
                    }}
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/icons/truck.png",
                    }}
                  />
                ))}

                {/* Render directions if available */}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: "#22c55e",
                        strokeWeight: 5,
                      },
                    }}
                  />
                )}
              </GoogleMap>
            </CardContent>
            <CardFooter className="pt-0 flex justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span className="mr-3">Unassigned Orders</span>
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>Assigned Orders</span>
              </div>
              <div>
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="orders">
                Orders
                {filteredUnassignedOrders.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{filteredUnassignedOrders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="drivers">
                Drivers
                {driversWithLocation.length > 0 && (
                  <Badge variant="outline" className="ml-2">{driversWithLocation.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
  
            <TabsContent value="orders" className="m-0">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {selectedOrder ? "Order Details" : "Unassigned Orders"}
                  </CardTitle>
                  <CardDescription>
                    {selectedOrder
                      ? `Order #${selectedOrder.id} - ${selectedOrder.customerName}`
                      : "Orders waiting for assignment"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[350px] overflow-y-auto">
                  {!selectedOrder ? (
                    <div className="space-y-2">
                      {filteredUnassignedOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No unassigned orders</p>
                      ) : (
                        filteredUnassignedOrders.map((order: AdminOrder) => (
                          <div
                            key={order.id}
                            className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">Order #{order.id}</p>
                                <p className="text-sm text-gray-500">{order.customerName}</p>
                              </div>
                              <div>
                                <Badge>{order.fuelType}</Badge>
                              </div>
                            </div>
                            <div className="mt-2 flex items-start text-sm">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5" />
                              <span className="text-gray-600 truncate">
                                {order.location.address}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Customer</p>
                          <p>{selectedOrder.customerName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <Badge variant={selectedOrder.assigned ? "outline" : "destructive"}>
                            {selectedOrder.assigned ? "Assigned" : "Unassigned"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Fuel Type</p>
                          <p>{selectedOrder.fuelType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Quantity</p>
                          <p>{selectedOrder.quantity} gallons</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">Delivery Address</p>
                        <div className="flex items-start mt-1">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5" />
                          <span className="text-gray-600">
                            {selectedOrder.location.address}
                          </span>
                        </div>
                      </div>

                      {selectedOrder.assigned && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Assigned Driver</p>
                          <div className="flex items-center mt-1">
                            <Truck className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{selectedOrder.assignedDriverName}</span>
                          </div>
                        </div>
                      )}

                      {!selectedOrder.assigned && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Assign Driver</p>
                          <div className="mt-1">
                            <Select
                              value={selectedDriver ? String(selectedDriver.id) : ""}
                              onValueChange={(value) => {
                                const driver = driversWithLocation.find(
                                  (d: AdminDriver) => d.id === parseInt(value)
                                );
                                setSelectedDriver(driver || null);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a driver" />
                              </SelectTrigger>
                              <SelectContent>
                                {driversWithLocation.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    No available drivers
                                  </SelectItem>
                                ) : (
                                  driversWithLocation.map((driver: AdminDriver) => (
                                    <SelectItem key={driver.id} value={String(driver.id)}>
                                      {driver.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  {selectedOrder && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedOrder(null);
                          setSelectedDriver(null);
                          setDirections(null);
                        }}
                      >
                        Back
                      </Button>
                      {!selectedOrder.assigned && selectedDriver && (
                        <Button
                          onClick={handleAssignDriver}
                          disabled={assignLoading}
                        >
                          {assignLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>Assign Driver</>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="drivers" className="m-0">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {selectedDriver ? "Driver Details" : "Available Drivers"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDriver
                      ? `${selectedDriver.name}`
                      : "Drivers ready for assignment"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[350px] overflow-y-auto">
                  {!selectedDriver ? (
                    <div className="space-y-2">
                      {allDriversWithLocation.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No drivers available</p>
                      ) : (
                        allDriversWithLocation.map((driver: AdminDriver) => (
                          <div
                            key={driver.id}
                            className="p-3 border rounded-md cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedDriver(driver)}
                          >
                            <div className="flex justify-between">
                              <div>
                                <p className="font-medium">{driver.name}</p>
                                <p className="text-sm text-gray-500">{driver.phone}</p>
                              </div>
                              <div>
                                <Badge
                                  variant={
                                    driver.status === "AVAILABLE"
                                      ? "success"
                                      : driver.status === "BUSY"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {driver.status}
                                </Badge>
                              </div>
                            </div>
                            {driver.lastUpdated && (
                              <div className="mt-1">
                                <p className="text-xs text-gray-400">
                                  Last updated: {new Date(driver.lastUpdated).toLocaleTimeString()}
                                </p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Name</p>
                          <p>{selectedDriver.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <Badge
                            variant={
                              selectedDriver.status === "AVAILABLE"
                                ? "success"
                                : selectedDriver.status === "BUSY"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {selectedDriver.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <p>{selectedDriver.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <p className="truncate">{selectedDriver.email}</p>
                        </div>
                      </div>

                      {selectedDriver.location && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Current Location</p>
                          <div className="flex items-start mt-1">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5" />
                            <span className="text-gray-600">
                              {selectedDriver.location.lat.toFixed(5)}, {selectedDriver.location.lng.toFixed(5)}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedDriver.lastUpdated && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Last Updated</p>
                          <p className="text-gray-600">
                            {new Date(selectedDriver.lastUpdated).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {!selectedOrder && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Assign to Order</p>
                          <div className="mt-1">
                            <Select
                              value={selectedOrder ? String(selectedOrder.id) : ""}
                              onValueChange={(value) => {
                                const order = filteredUnassignedOrders.find(
                                  (o: AdminOrder) => o.id === parseInt(value)
                                );
                                setSelectedOrder(order || null);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an order" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredUnassignedOrders.length === 0 ? (
                                  <SelectItem value="none" disabled>
                                    No unassigned orders
                                  </SelectItem>
                                ) : (
                                  filteredUnassignedOrders.map((order: AdminOrder) => (
                                    <SelectItem key={order.id} value={String(order.id)}>
                                      Order #{order.id} - {order.customerName}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  {selectedDriver && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDriver(null);
                          setSelectedOrder(null);
                          setDirections(null);
                        }}
                      >
                        Back
                      </Button>
                      {selectedOrder && !selectedOrder.assigned && (
                        <Button
                          onClick={handleAssignDriver}
                          disabled={assignLoading}
                        >
                          {assignLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>Assign to Order</>
                          )}
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}