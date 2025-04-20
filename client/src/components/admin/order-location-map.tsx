import { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { AdminOrder } from "@/types/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Map container style
const containerStyle = {
  width: "100%",
  height: "400px",
};

// Default center (can be adjusted based on orders)
const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795, // Center of US
};

interface OrderLocationMapProps {
  orders: AdminOrder[];
  isLoading: boolean;
}

export default function OrderLocationMap({ orders, isLoading }: OrderLocationMapProps) {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  useEffect(() => {
    // Calculate the center of visible orders if there are any with coordinates
    if (orders.length > 0 && orders.some(order => order.coordinates)) {
      const ordersWithCoords = orders.filter(order => order.coordinates);
      if (ordersWithCoords.length > 0) {
        const avgLat = ordersWithCoords.reduce((sum, order) => 
          sum + (order.coordinates?.lat || 0), 0) / ordersWithCoords.length;
        const avgLng = ordersWithCoords.reduce((sum, order) => 
          sum + (order.coordinates?.lng || 0), 0) / ordersWithCoords.length;
        
        setMapCenter({ lat: avgLat, lng: avgLng });
      }
    }
  }, [orders]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[400px] rounded-md" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Locations</CardTitle>
      </CardHeader>
      <CardContent>
        {!isLoaded ? (
          <div className="w-full h-[400px] bg-muted flex items-center justify-center">
            Loading map...
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={5}
          >
            {orders.map((order) => {
              if (!order.coordinates) return null;
              
              return (
                <Marker
                  key={order.id}
                  position={order.coordinates}
                  onClick={() => setSelectedOrder(order)}
                  icon={{
                    url: order.status === "UNASSIGNED" 
                      ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                      : order.status === "ASSIGNED" 
                        ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                        : "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  }}
                />
              );
            })}

            {selectedOrder && selectedOrder.coordinates && (
              <InfoWindow
                position={selectedOrder.coordinates}
                onCloseClick={() => setSelectedOrder(null)}
              >
                <div className="p-2 max-w-xs">
                  <h3 className="font-medium">Order #{selectedOrder.id}</h3>
                  <p>Status: {selectedOrder.status}</p>
                  <p>Fuel: {selectedOrder.fuelType}</p>
                  <p>Amount: {selectedOrder.amount} gal</p>
                  <p>Customer: ID {selectedOrder.userId}</p>
                  {selectedOrder.estimatedDeliveryAmount && (
                    <p className="text-green-600 font-medium mt-1">
                      Est. Delivery: {selectedOrder.estimatedDeliveryAmount} gal
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </CardContent>
    </Card>
  );
}