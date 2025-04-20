import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2, AlertCircle } from "lucide-react";
import { Location, LocationType } from "@shared/schema";
import {
  MAP_CONTAINER_STYLE,
  DEFAULT_MAP_CONFIG,
  createLocationFromCoordinates,
  formatCoordinates,
} from "@/lib/mapUtils";

interface MapViewProps {
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
  className?: string;
  initialAddress?: string;
}

export default function SimpleMapView({
  selectedLocation,
  onLocationSelect,
  className = "",
  initialAddress,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string>(selectedLocation?.address || "");
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
    selectedLocation?.coordinates || null
  );

  // Initialize the map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      return;
    }

    try {
      // Create map instance
      const mapOptions = {
        ...DEFAULT_MAP_CONFIG.options,
        center: markerPosition || DEFAULT_MAP_CONFIG.center,
        zoom: DEFAULT_MAP_CONFIG.zoom,
        clickableIcons: true,
        disableDefaultUI: false,
        zoomControl: true,
      };

      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      googleMapRef.current = map;

      // Create geocoder
      geocoderRef.current = new window.google.maps.Geocoder();

      // Create marker if we have a position
      if (markerPosition) {
        markerRef.current = new window.google.maps.Marker({
          position: markerPosition,
          map,
        });
      }

      // Add click listener
      map.addListener("click", async (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const clickedPos = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          };
          setMarkerPosition(clickedPos);

          // Update marker
          if (markerRef.current) {
            markerRef.current.setPosition(clickedPos);
          } else {
            markerRef.current = new window.google.maps.Marker({
              position: clickedPos,
              map,
            });
          }

          // Reverse geocode
          if (geocoderRef.current) {
            try {
              const response = await geocoderRef.current.geocode({
                location: clickedPos,
              });

              if (response.results && response.results[0]) {
                const newAddress = response.results[0].formatted_address;
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
            } catch (error) {
              console.error("Geocoding error:", error);
            }
          }
        }
      });

      // Get user's location if no location is provided
      if (!markerPosition) {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              setMarkerPosition(currentLocation);

              // Update map center
              map.setCenter(currentLocation);

              // Create or update marker
              if (markerRef.current) {
                markerRef.current.setPosition(currentLocation);
              } else {
                markerRef.current = new window.google.maps.Marker({
                  position: currentLocation,
                  map,
                });
              }

              // Reverse geocode
              if (geocoderRef.current) {
                try {
                  const response = await geocoderRef.current.geocode({
                    location: currentLocation,
                  });

                  if (response.results && response.results[0]) {
                    const newAddress = response.results[0].formatted_address;
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
                } catch (error) {
                  console.error("Geocoding error:", error);
                }
              }
            },
            (error) => {
              console.error("Error getting current location:", error);
            }
          );
        }
      }

      console.log("[SimpleMap] Map initialized successfully");
      setIsLoading(false);
    } catch (err) {
      console.error("[SimpleMap] Error initializing map:", err);
      setError(`Failed to initialize map: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  }, [markerPosition, onLocationSelect]);

  // Load Google Maps script
  useEffect(() => {
    // Skip if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) {
      setError("Missing Google Maps API key");
      setIsLoading(false);
      return;
    }

    // Create the script element
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    
    // Handle script load
    script.onload = () => {
      console.log("[SimpleMap] Google Maps script loaded");
      initializeMap();
    };
    
    // Handle script error
    script.onerror = () => {
      console.error("[SimpleMap] Failed to load Google Maps script");
      setError("Failed to load Google Maps script");
      setIsLoading(false);
    };
    
    // Add the script to the document
    document.head.appendChild(script);
    
    // Cleanup on unmount
    return () => {
      // Clean up marker and map references
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      
      googleMapRef.current = null;
      geocoderRef.current = null;
      
      // Remove the script if it was just added
      document.head.removeChild(script);
    };
  }, [initializeMap]);

  // Handle errors
  if (error) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error with map</p>
            <p className="text-xs">{error}</p>
            
            <button
              className="mt-4 px-3 py-1 text-xs bg-primary text-white rounded-full hover:bg-primary/90"
              onClick={() => {
                const coords = markerPosition || DEFAULT_MAP_CONFIG.center;
                const addr = address || "Default Location";
                
                const defaultLocation = createLocationFromCoordinates(
                  coords,
                  addr,
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

  // Loading state
  if (isLoading) {
    return (
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm">Loading map...</span>
        </div>
      </Card>
    );
  }

  // Render the map
  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div
        ref={mapRef}
        id="simple-google-map-container"
        className="absolute inset-0 z-0"
        style={{ width: "100%", height: "100%", minHeight: "250px" }}
      />

      {address && (
        <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-90 p-2 rounded-md shadow-md z-10">
          <p className="text-sm font-medium truncate">{address}</p>
          <p className="text-xs text-gray-500">
            {markerPosition
              ? formatCoordinates(markerPosition)
              : "No coordinates available"}
          </p>
        </div>
      )}
    </Card>
  );
}