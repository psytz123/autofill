import { Location, LocationType } from "@shared/schema";

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  zoom: 15,
  options: {
    fullscreenControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    zoomControl: true,
  }
};

// Standard map container style
export const MAP_CONTAINER_STYLE = {
  width: '100%',
  height: '100%'
};

// Create a new location from coordinates and address
export function createLocationFromCoordinates(
  coordinates: google.maps.LatLngLiteral,
  address: string,
  name: string = "Selected Location",
  type: LocationType = LocationType.OTHER
): Location {
  return {
    id: -1, // Temporary ID, will be replaced by the server
    userId: -1, // Will be set by backend
    name,
    address,
    type,
    coordinates,
    createdAt: new Date(), // Will be overwritten by the server
    updatedAt: new Date() // Will be overwritten by the server
  } as Location;
}

// Format coordinates for display
export function formatCoordinates(coordinates: google.maps.LatLngLiteral, precision: number = 4): string {
  return `Lat: ${coordinates.lat.toFixed(precision)}, Lng: ${coordinates.lng.toFixed(precision)}`;
}

// Geocode an address to coordinates
export async function geocodeAddress(
  geocoder: google.maps.Geocoder,
  address: string
): Promise<google.maps.GeocoderResult | null> {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        resolve(results[0]);
      } else {
        console.error("Geocode failed:", status);
        resolve(null);
      }
    });
  });
}

// Reverse geocode coordinates to address
export async function reverseGeocode(
  geocoder: google.maps.Geocoder,
  coordinates: google.maps.LatLngLiteral
): Promise<google.maps.GeocoderResult | null> {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: coordinates }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        resolve(results[0]);
      } else {
        console.error("Reverse geocode failed:", status);
        resolve(null);
      }
    });
  });
}