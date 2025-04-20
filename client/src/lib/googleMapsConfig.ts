/**
 * Static configuration for Google Maps to prevent unnecessary reloads
 * Following recommendations from @react-google-maps/api to prevent performance warnings
 */

// IMPORTANT: This array MUST be defined statically outside the component
// to prevent "LoadScript has been reloaded unintentionally" warnings
export const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"] as const;

// Default Map Configuration
export const DEFAULT_MAP_CONFIG = {
  center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  zoom: 14,
  options: {
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: 7, // Right top
    },
  },
};

// CSS styles for map container
export const MAP_CONTAINER_STYLE = {
  width: "100%", 
  height: "100%", 
  borderRadius: "0.5rem", 
  overflow: "hidden"
};