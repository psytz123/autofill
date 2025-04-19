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

// Geocode an address to coordinates - updated for new Google Maps API
export async function geocodeAddress(
  geocoder: google.maps.Geocoder,
  address: string
): Promise<google.maps.GeocoderResult | null> {
  try {
    const request: google.maps.GeocoderRequest = { address };
    const response = await geocoder.geocode(request);
    
    if (response.results && response.results.length > 0) {
      return response.results[0];
    } else {
      console.error("Geocode returned no results for address:", address);
      return null;
    }
  } catch (error) {
    console.error("Geocode error:", error);
    return null;
  }
}

// Reverse geocode coordinates to address - updated for new Google Maps API
export async function reverseGeocode(
  geocoder: google.maps.Geocoder,
  coordinates: google.maps.LatLngLiteral
): Promise<google.maps.GeocoderResult | null> {
  try {
    const request: google.maps.GeocoderRequest = { location: coordinates };
    const response = await geocoder.geocode(request);
    
    if (response.results && response.results.length > 0) {
      return response.results[0];
    } else {
      console.error("Reverse geocode returned no results for coordinates:", coordinates);
      return null;
    }
  } catch (error) {
    console.error("Reverse geocode error:", error);
    return null;
  }
}