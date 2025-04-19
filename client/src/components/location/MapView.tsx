import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { Location, LocationType } from "@shared/schema";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { 
  MAP_CONTAINER_STYLE, 
  DEFAULT_MAP_CONFIG, 
  createLocationFromCoordinates,
  formatCoordinates,
  reverseGeocode,
  geocodeAddress
} from "@/lib/mapUtils";

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
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places', 'geometry'],
  });

  // Initialize geocoder when map is loaded
  useEffect(() => {
    if (isLoaded && !geocoder && window.google && window.google.maps) {
      try {
        console.log("Initializing Google Maps Geocoder");
        setGeocoder(new window.google.maps.Geocoder());
      } catch (error) {
        console.error("Error initializing geocoder:", error);
      }
    }
  }, [isLoaded, geocoder]);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
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
            const result = await reverseGeocode(geocoder, currentLocation);
            if (result) {
              const newAddress = result.formatted_address;
              setAddress(newAddress);
              
              // Create a location object and notify parent
              const newLocation = createLocationFromCoordinates(
                currentLocation, 
                newAddress, 
                "Current Location", 
                LocationType.OTHER
              );
              onLocationSelect(newLocation);
            }
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
    const handleGeocoding = async () => {
      if (geocoder && initialAddress && initialAddress !== address) {
        try {
          const result = await geocodeAddress(geocoder, initialAddress);
          if (result) {
            const position = { 
              lat: result.geometry.location.lat(), 
              lng: result.geometry.location.lng() 
            };
            setMarkerPosition(position);
            setAddress(initialAddress);
            
            // Center map on geocoded location
            if (map) {
              map.panTo(position);
            }
            
            // Create a location object and notify parent
            const newLocation = createLocationFromCoordinates(
              position,
              initialAddress,
              "Selected Location",
              LocationType.HOME
            );
            onLocationSelect(newLocation);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
      }
    };
    
    handleGeocoding();
  }, [geocoder, initialAddress, address, map, onLocationSelect]);

  // Handle map click
  const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const clickedPos = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng()
      };
      setMarkerPosition(clickedPos);
      
      // Reverse geocode to get address
      if (geocoder) {
        const result = await reverseGeocode(geocoder, clickedPos);
        if (result) {
          const newAddress = result.formatted_address;
          setAddress(newAddress);
          
          // Create a location object and notify parent
          const newLocation = createLocationFromCoordinates(
            clickedPos,
            newAddress,
            "Selected Location",
            LocationType.HOME
          );
          onLocationSelect(newLocation);
        }
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

  if (loadError || !import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center text-red-500">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading map</p>
            <p className="text-xs">
              {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
                ? "Missing Google Maps API key" 
                : loadError?.toString() || "Please check your internet connection"}
            </p>
            
            {/* Fallback location selection */}
            <button 
              className="mt-4 px-3 py-1 text-xs bg-primary text-white rounded-full hover:bg-primary/90" 
              onClick={() => {
                // Create a fallback location with default coordinates
                const defaultLocation = createLocationFromCoordinates(
                  DEFAULT_MAP_CONFIG.center,
                  "Default Location",
                  "Selected Location",
                  LocationType.OTHER
                );
                onLocationSelect(defaultLocation);
              }}
            >
              Use Default Location
            </button>
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
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={markerPosition || DEFAULT_MAP_CONFIG.center}
          zoom={DEFAULT_MAP_CONFIG.zoom}
          onClick={onMapClick}
          onLoad={onMapLoad}
          onUnmount={onUnmount}
          options={DEFAULT_MAP_CONFIG.options}
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
            {markerPosition && formatCoordinates(markerPosition)}
          </p>
        </div>
      )}
    </Card>
  );
}