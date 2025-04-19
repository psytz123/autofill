/**
 * Location API Service
 * Handles all location-related API requests
 */

import { SavedLocation } from '@shared/schema';
import { ApiService, ApiResponse, ApiRequestOptions } from './base-api';

/**
 * Geocoding result type
 */
interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  streetNumber?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * Service coverage check result
 */
interface ServiceCoverageResult {
  available: boolean;
  message?: string;
  estimatedTime?: number; // minutes
  distance?: number; // miles
}

/**
 * API service for location operations
 */
class LocationApi extends ApiService {
  /**
   * Get all saved locations for the current user
   * @returns List of saved locations
   */
  async getSavedLocations(): Promise<ApiResponse<SavedLocation[]>> {
    try {
      return await this.get('/api/locations');
    } catch (error) {
      return this.handleError(error, 'Failed to fetch saved locations');
    }
  }
  
  /**
   * Get a specific saved location
   * @param locationId Location ID
   * @returns Location details
   */
  async getSavedLocation(locationId: number): Promise<ApiResponse<SavedLocation>> {
    try {
      return await this.get(`/api/locations/${locationId}`);
    } catch (error) {
      return this.handleError(error, 'Failed to fetch location details');
    }
  }
  
  /**
   * Add a new saved location
   * @param location Location details
   * @returns Created location
   */
  async addSavedLocation(location: Omit<SavedLocation, 'id' | 'userId'>): Promise<ApiResponse<SavedLocation>> {
    try {
      return await this.post('/api/locations', location);
    } catch (error) {
      return this.handleError(error, 'Failed to save location');
    }
  }
  
  /**
   * Update a saved location
   * @param locationId Location ID
   * @param data Updated location data
   * @returns Updated location
   */
  async updateSavedLocation(locationId: number, data: Partial<SavedLocation>): Promise<ApiResponse<SavedLocation>> {
    try {
      return await this.patch(`/api/locations/${locationId}`, data);
    } catch (error) {
      return this.handleError(error, 'Failed to update location');
    }
  }
  
  /**
   * Delete a saved location
   * @param locationId Location ID
   * @returns Success response
   */
  async deleteSavedLocation(locationId: number): Promise<ApiResponse<{ success: boolean }>> {
    try {
      return await this.delete(`/api/locations/${locationId}`);
    } catch (error) {
      return this.handleError(error, 'Failed to delete location');
    }
  }
  
  /**
   * Geocode an address to get coordinates
   * @param address Address to geocode
   * @returns Geocoding result
   */
  async geocodeAddress(address: string): Promise<ApiResponse<GeocodingResult>> {
    try {
      return await this.get(`/api/geocode?address=${encodeURIComponent(address)}`);
    } catch (error) {
      return this.handleError(error, 'Failed to geocode address');
    }
  }
  
  /**
   * Reverse geocode coordinates to get address
   * @param lat Latitude
   * @param lng Longitude
   * @returns Geocoding result
   */
  async reverseGeocode(lat: number, lng: number): Promise<ApiResponse<GeocodingResult>> {
    try {
      return await this.get(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
    } catch (error) {
      return this.handleError(error, 'Failed to reverse geocode coordinates');
    }
  }
  
  /**
   * Check if a location is within the service area
   * @param lat Latitude
   * @param lng Longitude
   * @returns Service coverage result
   */
  async checkServiceCoverage(lat: number, lng: number): Promise<ApiResponse<ServiceCoverageResult>> {
    try {
      return await this.get(`/api/service-coverage?lat=${lat}&lng=${lng}`);
    } catch (error) {
      return this.handleError(error, 'Failed to check service coverage');
    }
  }
  
  /**
   * Get the service area boundaries for map display
   * @returns GeoJSON polygon of service area
   */
  async getServiceArea(): Promise<ApiResponse<{
    type: 'Feature';
    geometry: {
      type: 'Polygon';
      coordinates: number[][][];
    };
    properties: {
      name: string;
      description?: string;
    };
  }>> {
    try {
      return await this.get('/api/service-area');
    } catch (error) {
      return this.handleError(error, 'Failed to fetch service area');
    }
  }
}

// Export as singleton
export const locationApi = new LocationApi();