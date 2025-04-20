import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Location as LocationType } from '../utils/types';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface LocationMapProps {
  initialLocation?: LocationType;
  onLocationSelect?: (location: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  }) => void;
  readOnly?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({
  initialLocation,
  onLocationSelect,
  readOnly = false
}) => {
  // Map references for controlling the map programmatically
  const mapRef = useRef<MapView | null>(null);
  
  // State for controlling the map
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.coordinates?.lat ?? 25.7617,  // Default to Miami if no location
    longitude: initialLocation?.coordinates?.lng ?? -80.1918,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(
    initialLocation ? {
      latitude: initialLocation.coordinates.lat,
      longitude: initialLocation.coordinates.lng,
      address: initialLocation.address
    } : null
  );
  const [loading, setLoading] = useState(false);
  const [userLocationLoading, setUserLocationLoading] = useState(true);
  
  // Get user's current location on component mount
  useEffect(() => {
    if (!initialLocation && !readOnly) {
      getUserLocation();
    } else {
      setUserLocationLoading(false);
    }
  }, [initialLocation, readOnly]);
  
  // Function to get user's current location
  const getUserLocation = async () => {
    setUserLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please grant location permissions to use this feature'
        );
        setUserLocationLoading(false);
        return;
      }
      
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const newRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      setRegion(newRegion);
      
      // Animate map to user's location
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      // Get address from coordinates
      await reverseGeocode(
        currentLocation.coords.latitude, 
        currentLocation.coords.longitude
      );
      
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your device settings.'
      );
    } finally {
      setUserLocationLoading(false);
    }
  };
  
  // Function to reverse geocode coordinates to address
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      setLoading(true);
      
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (result.length > 0) {
        const address = result[0];
        const addressString = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country
        ]
          .filter(Boolean)
          .join(', ');
        
        setSelectedLocation({
          latitude,
          longitude,
          address: addressString,
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle map press to select location
  const handleMapPress = async (event: any) => {
    if (readOnly) return;
    
    const { coordinate } = event.nativeEvent;
    await reverseGeocode(coordinate.latitude, coordinate.longitude);
  };
  
  // Handle confirmation of selected location
  const handleConfirmLocation = () => {
    if (!selectedLocation || !onLocationSelect) return;
    
    onLocationSelect({
      name: 'Selected Location', // User can rename this later
      address: selectedLocation.address,
      coordinates: {
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
      },
    });
  };
  
  // Render loading indicator while getting user location
  if (userLocationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={!readOnly}
        showsMyLocationButton={!readOnly}
      >
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            pinColor="#f97316"
          />
        )}
      </MapView>
      
      {selectedLocation && (
        <View style={styles.addressContainer}>
          <Text style={styles.addressTitle}>Selected Location:</Text>
          <Text style={styles.addressText}>{selectedLocation.address}</Text>
          
          {!readOnly && onLocationSelect && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmLocation}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Location</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {!readOnly && (
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={getUserLocation}
          disabled={userLocationLoading}
        >
          <Text style={styles.currentLocationText}>📍 Current Location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    height: 300,
    borderRadius: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  addressContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#f97316',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  currentLocationButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
});

export default LocationMap;