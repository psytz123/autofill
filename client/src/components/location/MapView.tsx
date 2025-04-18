import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { Location, LocationType } from "@shared/schema";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

interface MapViewProps {
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  className?: string;
  initialAddress?: string;
}

export default function MapView({ 
  selectedLocation, 
  onLocationSelect,
  className = "",
  initialAddress
}: MapViewProps) {
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
    selectedLocation?.coordinates || null
  );
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [address, setAddress] = useState<string>(selectedLocation?.address || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  });

  // Initialize geocoder when map is loaded
  useEffect(() => {
    if (isLoaded && !geocoder) {
      setGeocoder(new window.google.maps.Geocoder());
    }
  }, [isLoaded, geocoder]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setMarkerPosition(currentLocation);
          
          // Center map on current location
          if (map) {
            map.panTo(currentLocation);
          }
          
          // Reverse geocode to get address
          if (geocoder) {
            geocoder.geocode({ location: currentLocation }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const newAddress = results[0].formatted_address;
                setAddress(newAddress);
                
                // Create a new location and notify parent
                const newLocation: Location = {
                  id: -1, // Temporary ID
                  userId: -1, // Will be set by backend
                  name: "Current Location",
                  address: newAddress,
                  type: LocationType.OTHER,
                  coordinates: currentLocation,
                  createdAt: new Date().toISOString()
                };
                onLocationSelect(newLocation);
              }
            });
          }
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting current location:", error);
          setIsGettingLocation(false);
        }
      );
    }
  }, [map, geocoder, onLocationSelect]);

  // Set default location if no selected location
  useEffect(() => {
    if (isLoaded && !markerPosition) {
      // Default to San Francisco if no location is provided
      setMarkerPosition({ lat: 37.7749, lng: -122.4194 });
    }
  }, [isLoaded, markerPosition]);

  // Geocode initial address when provided
  useEffect(() => {
    if (geocoder && initialAddress && initialAddress !== address) {
      geocoder.geocode({ address: initialAddress }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const position = { lat: location.lat(), lng: location.lng() };
          setMarkerPosition(position);
          setAddress(initialAddress);
          
          // Center map on geocoded location
          if (map) {
            map.panTo(position);
          }
          
          // Create a new location and notify parent
          const newLocation: Location = {
            id: -1, // Temporary ID
            userId: -1, // Will be set by backend
            name: "Selected Location",
            address: initialAddress,
            type: LocationType.HOME,
            coordinates: position,
            createdAt: new Date().toISOString()
          };
          onLocationSelect(newLocation);
        }
      });
    }
  }, [geocoder, initialAddress, address, map, onLocationSelect]);

  // Handle map click
  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const clickedPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setMarkerPosition(clickedPos);
      
      // Reverse geocode to get address
      if (geocoder) {
        geocoder.geocode({ location: clickedPos }, (results, status) => {
          if (status === "OK" && results && results[0]) {
            const newAddress = results[0].formatted_address;
            setAddress(newAddress);
            
            // Create a new location and notify parent
            const newLocation: Location = {
              id: -1, // Temporary ID
              userId: -1, // Will be set by backend
              name: "Selected Location",
              address: newAddress,
              type: LocationType.HOME,
              coordinates: clickedPos,
              createdAt: new Date().toISOString()
            };
            onLocationSelect(newLocation);
          }
        });
      }
    }
  }, [geocoder, onLocationSelect]);

  // Set up map when loaded
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Try to get user's current location when map loads
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Clean up map on unmount
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center text-red-500">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading map</p>
            <p className="text-xs">Please check your internet connection</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isLoaded || isGettingLocation) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={markerPosition || { lat: 37.7749, lng: -122.4194 }}
          zoom={15}
          onClick={onMapClick}
          onLoad={onMapLoad}
          onUnmount={onUnmount}
          options={{
            fullscreenControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: true,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </div>
      
      {address && (
        <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-90 p-2 rounded-md shadow-md">
          <p className="text-sm font-medium truncate">{address}</p>
          <p className="text-xs text-gray-500">
            {markerPosition && `Lat: ${markerPosition.lat.toFixed(4)}, Lng: ${markerPosition.lng.toFixed(4)}`}
          </p>
        </div>
      )}
    </Card>
  );
}