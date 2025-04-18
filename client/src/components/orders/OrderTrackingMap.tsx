import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { orderTrackingService, OrderLocation } from "@/lib/orderTrackingService";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface OrderTrackingMapProps {
  orderId: string;
  deliveryLocation: { lat: number; lng: number };
  estimatedTime?: string;
}

export default function OrderTrackingMap({ 
  orderId, 
  deliveryLocation,
  estimatedTime: initialEstimatedTime 
}: OrderTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string | undefined>(initialEstimatedTime);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  useEffect(() => {
    // Setup WebSocket connection if user is logged in
    if (user && user.id) {
      // Authenticate with WebSocket server
      orderTrackingService.authenticate(user.id);
      
      // Setup listeners
      orderTrackingService.on('connected', () => {
        setIsConnecting(false);
        setConnectionError(null);
        console.log('Connected to tracking service, starting to track order:', orderId);
        orderTrackingService.trackOrder(parseInt(orderId));
      });
      
      orderTrackingService.on('disconnected', () => {
        setIsConnecting(true);
        setConnectionError('Connection lost. Reconnecting...');
      });
      
      orderTrackingService.on('error', (error) => {
        setIsConnecting(false);
        setConnectionError(`Error: ${error.message}`);
      });
      
      orderTrackingService.on('driverLocation', (data: OrderLocation) => {
        console.log('Received driver location update:', data);
        if (data.orderId === parseInt(orderId)) {
          setDriverLocation(data.location);
          setEstimatedTime(data.estimatedArrival);
        }
      });
      
      // Connect to the service
      orderTrackingService.connect();
      
      // Clean up when component unmounts
      return () => {
        orderTrackingService.off('connected');
        orderTrackingService.off('disconnected');
        orderTrackingService.off('error');
        orderTrackingService.off('driverLocation');
      };
    }
  }, [user, orderId]);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Live Tracking</h3>
          {estimatedTime && (
            <span className="text-sm">ETA: {estimatedTime}</span>
          )}
        </div>
        
        <div className="relative overflow-hidden rounded-lg bg-neutral-100 w-full h-48">
          {isConnecting ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Connecting to tracking service...</span>
            </div>
          ) : connectionError ? (
            <div className="w-full h-full flex items-center justify-center text-destructive">
              {connectionError}
            </div>
          ) : !driverLocation ? (
            <div className="w-full h-full flex items-center justify-center">
              <span>Waiting for driver location updates...</span>
            </div>
          ) : (
            // This would be a real map in production with Google Maps or MapBox
            <div ref={mapRef} className="w-full h-full bg-neutral-100 flex items-center justify-center relative">
              <div className="text-xs text-neutral-500 text-center absolute top-2 left-2 right-2">
                Map showing driver at position {driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}
                <br />
                heading to delivery location
              </div>
              
              {/* Simulated map content */}
              <div className="absolute w-4 h-4 bg-primary rounded-full animate-pulse" 
                style={{ 
                  left: `${(((driverLocation.lng + 122.41) / 0.02) * 100)}%`, 
                  top: `${(((37.79 - driverLocation.lat) / 0.01) * 100)}%` 
                }}>
              </div>
              
              <div className="absolute w-4 h-4 bg-secondary rounded-full"
                style={{ 
                  left: `${(((deliveryLocation.lng + 122.41) / 0.02) * 100)}%`, 
                  top: `${(((37.79 - deliveryLocation.lat) / 0.01) * 100)}%` 
                }}>
              </div>
              
              <div className="border-2 border-neutral-300 rounded-lg absolute inset-4"></div>
            </div>
          )}
        </div>
        
        <div className="mt-3 text-sm">
          <p className="font-medium">Driver is on the way</p>
          <p className="text-neutral-500">
            {estimatedTime === 'Arrived' 
              ? "Driver has arrived at your location"
              : estimatedTime 
                ? `Estimated arrival in ${estimatedTime}`
                : "Calculating arrival time..."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
