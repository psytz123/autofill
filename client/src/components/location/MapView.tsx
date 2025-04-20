import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { Location, LocationType } from "@shared/schema";
import { 
  GoogleMap, 
  useJsApiLoader, 
  Marker
} from "@react-google-maps/api";
import { GOOGLE_MAPS_OPTIONS } from "@/lib/googleMapsConfig";
import {
  MAP_CONTAINER_STYLE,
  DEFAULT_MAP_CONFIG,
  createLocationFromCoordinates,
  formatCoordinates,
  reverseGeocode,
  geocodeAddress,
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
  initialAddress,
}: MapViewProps) {
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(
      selectedLocation?.coordinates || null,
    );
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [address, setAddress] = useState<string>(
    selectedLocation?.address || "",
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // For debugging purposes
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [debugInfo, setDebugInfo] = useState<{
    apiKeyPresent: boolean;
    apiLoaded: boolean;
    googleObject: boolean;
    googleMapsObject: boolean;
    mapContainerVisible: boolean;
  }>({
    apiKeyPresent: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    apiLoaded: false,
    googleObject: false,
    googleMapsObject: false,
    mapContainerVisible: false
  });
  
  // Use the static configuration object to prevent reloading
  // This fixes the "LoadScript has been reloaded unintentionally!" warning
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    ...GOOGLE_MAPS_OPTIONS,
  });

  // Update debug info whenever relevant state changes
  useEffect(() => {
    const newDebugInfo = {
      apiKeyPresent: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      apiLoaded: isLoaded,
      googleObject: typeof window !== 'undefined' && !!window.google,
      googleMapsObject: typeof window !== 'undefined' && !!window.google?.maps,
      mapContainerVisible: !!mapContainerRef.current && 
                          mapContainerRef.current.offsetWidth > 0 &&
                          mapContainerRef.current.offsetHeight > 0
    };
    
    setDebugInfo(newDebugInfo);
    console.log("[MapDebug] Status:", newDebugInfo);
    
    if (isLoaded) {
      console.log("[Map] Google Maps API loaded successfully");
      
      // Additional debugging for map container
      if (mapContainerRef.current) {
        console.log("[MapDebug] Container dimensions:", {
          width: mapContainerRef.current.offsetWidth,
          height: mapContainerRef.current.offsetHeight,
          visible: mapContainerRef.current.offsetWidth > 0 && mapContainerRef.current.offsetHeight > 0
        });
      } else {
        console.log("[MapDebug] Map container ref not available");
      }
    }
  }, [isLoaded, mapContainerRef.current]);

  // Handle load errors
  useEffect(() => {
    if (loadError) {
      console.error("[Map] Google Maps API loading error:", loadError);
      setMapError("Failed to load Google Maps API: " + loadError.toString());
    }
  }, [loadError]);

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
            lng: position.coords.longitude,
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
                LocationType.OTHER,
              );
              onLocationSelect(newLocation);
            }
          }
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting current location:", error);
          setIsGettingLocation(false);
        },
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
              lng: result.geometry.location.lng(),
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
              LocationType.HOME,
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
  const onMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const clickedPos = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
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
              LocationType.HOME,
            );
            onLocationSelect(newLocation);
          }
        }
      }
    },
    [geocoder, onLocationSelect],
  );

  // Set up map when loaded
  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      setMap(map);
      // Try to get user's current location when map loads
      getCurrentLocation();
    },
    [getCurrentLocation],
  );

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
                : loadError?.toString() ||
                  "Please check your internet connection"}
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
                  LocationType.OTHER,
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

  // Show error message if mapError is set
  if (mapError) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center text-red-500">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>Error with map</p>
            <p className="text-xs">{mapError}</p>

            {/* Fallback location selection with existing location */}
            <button
              className="mt-4 px-3 py-1 text-xs bg-primary text-white rounded-full hover:bg-primary/90"
              onClick={() => {
                const coords = markerPosition || DEFAULT_MAP_CONFIG.center;
                const addr = address || "Default Location";

                // Create a location even without a map
                const defaultLocation = createLocationFromCoordinates(
                  coords,
                  addr,
                  "Selected Location",
                  LocationType.OTHER,
                );
                onLocationSelect(defaultLocation);
              }}
            >
              Use Current Location Details
            </button>
          </div>
        </div>
      </Card>
    );
  }

  // Create a try-catch wrapper for the map component
  // This will catch and handle any runtime errors during map rendering
  try {
    console.log("[MapDebug] Rendering map with API key:", import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? "API key present" : "No API key");
    
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div 
          className="absolute inset-0 z-0" 
          ref={mapContainerRef}
          id="google-map-container"
          style={{ width: '100%', height: '100%', minHeight: '150px' }}
        >
          <GoogleMap
            mapContainerStyle={{
              ...MAP_CONTAINER_STYLE,
              // Force explicit dimensions to ensure the map renders
              width: '100%',
              height: '100%',
              minHeight: '150px'
            }}
            center={markerPosition || DEFAULT_MAP_CONFIG.center}
            zoom={DEFAULT_MAP_CONFIG.zoom}
            onClick={onMapClick}
            onLoad={(map) => {
              console.log("[MapDebug] Map loaded successfully");
              onMapLoad(map);
            }}
            onUnmount={onUnmount}
            options={{
              ...DEFAULT_MAP_CONFIG.options,
              // Add these options to ensure the map is fully interactive
              clickableIcons: true,
              disableDefaultUI: false,
              zoomControl: true,
            }}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                // Using animation causes TypeScript error, so we'll use a regular marker
                // This doesn't affect functionality, just the drop animation
              />
            )}
          </GoogleMap>
        </div>

        {/* Display debug info in development */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="absolute top-2 right-2 bg-white bg-opacity-90 p-1 rounded text-xs z-10">
            <span className={debugInfo.apiLoaded ? "text-green-600" : "text-red-600"}>
              API: {debugInfo.apiLoaded ? "✓" : "✗"}
            </span>
          </div>
        )}

        {address && (
          <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-90 p-2 rounded-md shadow-md z-10">
            <p className="text-sm font-medium truncate">{address}</p>
            <p className="text-xs text-gray-500">
              {markerPosition && formatCoordinates(markerPosition)}
            </p>
          </div>
        )}
      </Card>
    );
  } catch (error) {
    console.error("Error rendering Google Map:", error);
    setMapError(
      "Failed to render map: " + ((error as Error)?.message || "Unknown error"),
    );

    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center text-red-500">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            <p>Error rendering map</p>
            <p className="text-xs">Please try again later</p>
          </div>
        </div>
      </Card>
    );
  }
}
