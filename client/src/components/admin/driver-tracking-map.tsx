import { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplet, Truck, MapPin, ArrowRight, RefreshCcw, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { AdminDriver, AdminOrder } from "@/types/admin";

// Map container style
const containerStyle = {
  width: "100%",
  height: "600px",
};

// Default center (can be adjusted based on active drivers)
const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060, // NYC coordinates as default
};

interface DriverTrackingMapProps {
  onAssignDriver?: (orderId: number, driverId: number) => void;
}

export default function DriverTrackingMap({ onAssignDriver }: DriverTrackingMapProps) {
  const [selectedDriver, setSelectedDriver] = useState<AdminDriver | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(true);
  const [showAssignedOrders, setShowAssignedOrders] = useState<boolean>(true);
  const [showUnassignedOrders, setShowUnassignedOrders] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const mapRef = useRef<google.maps.Map | null>(null);
  
  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places", "directions"],
  });

  // Fetch all drivers
  const { 
    data: drivers = [],
    isLoading: isLoadingDrivers,
    refetch: refetchDrivers 
  } = useQuery<AdminDriver[]>({
    queryKey: ["/admin/api/drivers"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  // Fetch all orders
  const { 
    data: orders = [],
    isLoading: isLoadingOrders,
    refetch: refetchOrders 
  } = useQuery<AdminOrder[]>({
    queryKey: ["/admin/api/orders/all"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 15000, // Refetch every 15 seconds for updates
  });

  // Filter drivers based on active status
  const filteredDrivers = showActiveOnly 
    ? drivers.filter(driver => driver.isAvailable) 
    : drivers;

  // Filter orders based on assigned/unassigned status
  const filteredOrders = orders.filter(order => {
    if (order.status === "ASSIGNED" || order.status === "IN_PROGRESS") {
      return showAssignedOrders;
    } else if (order.status === "UNASSIGNED" || order.status === "PENDING") {
      return showUnassignedOrders;
    }
    return false;
  });

  // When map loads, store ref
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // When map unmounts, clear ref
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Calculate map center based on driver locations
  useEffect(() => {
    if (filteredDrivers.length > 0 && filteredDrivers.some(driver => driver.currentLocationLat && driver.currentLocationLng)) {
      const activeDrivers = filteredDrivers.filter(
        driver => driver.currentLocationLat && driver.currentLocationLng
      );
      
      if (activeDrivers.length > 0) {
        const avgLat = activeDrivers.reduce(
          (sum, driver) => sum + (driver.currentLocationLat || 0), 0
        ) / activeDrivers.length;
        
        const avgLng = activeDrivers.reduce(
          (sum, driver) => sum + (driver.currentLocationLng || 0), 0
        ) / activeDrivers.length;
        
        setMapCenter({ lat: avgLat, lng: avgLng });
      }
    }
  }, [filteredDrivers]);

  // Update selected driver when dropdown changes
  useEffect(() => {
    if (selectedDriverId) {
      const driver = drivers.find(d => d.id.toString() === selectedDriverId);
      if (driver) {
        setSelectedDriver(driver);
        
        // Center map on selected driver
        if (driver.currentLocationLat && driver.currentLocationLng) {
          setMapCenter({ 
            lat: driver.currentLocationLat, 
            lng: driver.currentLocationLng 
          });
          
          if (mapRef.current) {
            mapRef.current.setZoom(14);
          }
        }
      }
    } else {
      setSelectedDriver(null);
      setDirections(null);
    }
  }, [selectedDriverId, drivers]);

  // Calculate directions between driver and order
  const calculateDirections = useCallback((driver: AdminDriver, order: AdminOrder) => {
    if (!window.google || !driver.currentLocationLat || !driver.currentLocationLng || !order.coordinates) {
      return;
    }
    
    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: { lat: driver.currentLocationLat, lng: driver.currentLocationLng },
      destination: { lat: order.coordinates.lat, lng: order.coordinates.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        setDirections(result);
      } else {
        console.error("Directions request failed:", status);
      }
    });
  }, []);

  // Handle a manual refresh of data
  const handleRefresh = () => {
    refetchDrivers();
    refetchOrders();
  };

  // Handle driver assignment
  const handleAssignOrder = (orderId: number, driverId: number) => {
    if (onAssignDriver) {
      onAssignDriver(orderId, driverId);
    } else {
      console.log(`Assign order ${orderId} to driver ${driverId}`);
      // This would be replaced with an actual API call in production
    }
  };

  if (isLoadingDrivers || isLoadingOrders) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driver Tracking</CardTitle>
          <CardDescription>
            Real-time location tracking of delivery drivers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[600px] rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Driver Tracking</CardTitle>
          <CardDescription>
            Real-time location tracking of delivery drivers
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-active"
                  checked={showActiveOnly}
                  onCheckedChange={(checked) => setShowActiveOnly(!!checked)}
                />
                <Label htmlFor="show-active">Active drivers only</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-assigned"
                  checked={showAssignedOrders}
                  onCheckedChange={(checked) => setShowAssignedOrders(!!checked)}
                />
                <Label htmlFor="show-assigned">Assigned orders</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="show-unassigned"
                  checked={showUnassignedOrders}
                  onCheckedChange={(checked) => setShowUnassignedOrders(!!checked)}
                />
                <Label htmlFor="show-unassigned">Unassigned orders</Label>
              </div>
            </div>
            
            <Select
              value={selectedDriverId}
              onValueChange={setSelectedDriverId}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select driver to track" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All drivers</SelectItem>
                {filteredDrivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id.toString()}>
                    {driver.name} ({driver.isAvailable ? "Available" : "Busy"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {!isLoaded ? (
            <div className="w-full h-[600px] bg-muted flex items-center justify-center">
              <p>Loading Google Maps...</p>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={mapCenter}
              zoom={11}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
              }}
            >
              {/* Display drivers on the map */}
              {filteredDrivers.map((driver) => {
                if (!driver.currentLocationLat || !driver.currentLocationLng) return null;
                
                return (
                  <Marker
                    key={`driver-${driver.id}`}
                    position={{
                      lat: driver.currentLocationLat,
                      lng: driver.currentLocationLng,
                    }}
                    icon={{
                      url: driver.isAvailable
                        ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                        : "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                      scaledSize: new window.google.maps.Size(40, 40),
                    }}
                    onClick={() => setSelectedDriver(driver)}
                  />
                );
              })}

              {/* Display orders on the map */}
              {filteredOrders.map((order) => {
                if (!order.coordinates) return null;
                
                return (
                  <Marker
                    key={`order-${order.id}`}
                    position={order.coordinates}
                    icon={{
                      url: order.status === "UNASSIGNED" || order.status === "PENDING"
                        ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                        : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                      scaledSize: new window.google.maps.Size(32, 32),
                    }}
                    onClick={() => setSelectedOrder(order)}
                  />
                );
              })}

              {/* Display info window for selected driver */}
              {selectedDriver && selectedDriver.currentLocationLat && selectedDriver.currentLocationLng && (
                <InfoWindow
                  position={{
                    lat: selectedDriver.currentLocationLat,
                    lng: selectedDriver.currentLocationLng,
                  }}
                  onCloseClick={() => setSelectedDriver(null)}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-medium text-lg">{selectedDriver.name}</h3>
                    <p className="text-sm">{selectedDriver.vehicleModel} ({selectedDriver.vehicleLicense})</p>
                    <p className="text-sm">Phone: {selectedDriver.phone}</p>
                    <div className="mt-2">
                      <Badge variant={selectedDriver.isAvailable ? "success" : "default"}>
                        {selectedDriver.isAvailable ? "Available" : "Busy"}
                      </Badge>
                    </div>
                    
                    {filteredOrders.filter(o => o.status === "UNASSIGNED" || o.status === "PENDING").length > 0 && selectedDriver.isAvailable && (
                      <div className="mt-2">
                        <Select
                          onValueChange={(orderId) => {
                            const order = orders.find(o => o.id.toString() === orderId);
                            if (order && order.coordinates) {
                              setSelectedOrder(order);
                              calculateDirections(selectedDriver, order);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Calculate route to order" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredOrders
                              .filter(o => (o.status === "UNASSIGNED" || o.status === "PENDING") && o.coordinates)
                              .map((order) => (
                                <SelectItem key={order.id} value={order.id.toString()}>
                                  Order #{order.id} - {order.fuelType}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* Display info window for selected order */}
              {selectedOrder && selectedOrder.coordinates && (
                <InfoWindow
                  position={selectedOrder.coordinates}
                  onCloseClick={() => {
                    setSelectedOrder(null);
                    setDirections(null);
                  }}
                >
                  <div className="p-2 max-w-xs">
                    <h3 className="font-medium">Order #{selectedOrder.id}</h3>
                    <p className="text-sm">Status: <Badge>{selectedOrder.status}</Badge></p>
                    <p className="text-sm">Fuel: {selectedOrder.fuelType}</p>
                    <p className="text-sm">Amount: {selectedOrder.amount} gal</p>
                    <p className="text-sm">Customer: ID {selectedOrder.userId}</p>
                    <p className="text-sm">{selectedOrder.address}</p>
                    
                    {selectedOrder.status === "UNASSIGNED" || selectedOrder.status === "PENDING" ? (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium mb-1">Assign Driver:</h4>
                        <Select
                          onValueChange={(driverId) => {
                            const driver = drivers.find(d => d.id.toString() === driverId);
                            if (driver && driver.isAvailable) {
                              handleAssignOrder(selectedOrder.id, driver.id);
                              if (driver.currentLocationLat && driver.currentLocationLng) {
                                calculateDirections(driver, selectedOrder);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue placeholder="Select driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredDrivers
                              .filter(d => d.isAvailable && d.currentLocationLat && d.currentLocationLng)
                              .map((driver) => (
                                <SelectItem key={driver.id} value={driver.id.toString()}>
                                  {driver.name} ({driver.vehicleModel})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      selectedOrder.estimatedDeliveryAmount && (
                        <p className="text-green-600 font-medium mt-1">
                          Est. Delivery: {selectedOrder.estimatedDeliveryAmount} gal
                        </p>
                      )
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* Display directions line between driver and order */}
              {directions && (
                <DirectionsRenderer
                  directions={directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: "#0066CC",
                      strokeWeight: 5,
                      strokeOpacity: 0.7,
                    },
                  }}
                />
              )}
            </GoogleMap>
          )}
          
          {/* Stats and available drivers overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="bg-muted rounded-md p-4">
              <div className="flex items-center mb-2">
                <Truck className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Active Drivers</span>
              </div>
              <div className="text-2xl font-bold">
                {drivers.filter(d => d.isAvailable).length} / {drivers.length}
              </div>
            </div>
            
            <div className="bg-muted rounded-md p-4">
              <div className="flex items-center mb-2">
                <Droplet className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">Pending Orders</span>
              </div>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === "UNASSIGNED" || o.status === "PENDING").length}
              </div>
            </div>
            
            <div className="bg-muted rounded-md p-4">
              <div className="flex items-center mb-2">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <span className="font-medium">In Progress</span>
              </div>
              <div className="text-2xl font-bold">
                {orders.filter(o => o.status === "ASSIGNED" || o.status === "IN_PROGRESS").length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}