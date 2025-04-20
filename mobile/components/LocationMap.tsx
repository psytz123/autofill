import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';

type Coordinates = {
  lat: number;
  lng: number;
};

type LocationType = {
  name: string;
  address: string;
  coordinates: Coordinates;
};

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
  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [currentRegion, setCurrentRegion] = useState<Region>({
    latitude: initialLocation?.coordinates.lat || 25.761681, // Default to Miami, FL
    longitude: initialLocation?.coordinates.lng || -80.191788,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markerPosition, setMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    initialLocation
      ? {
          latitude: initialLocation.coordinates.lat,
          longitude: initialLocation.coordinates.lng,
        }
      : null
  );

  // Get current user location on mount
  useEffect(() => {
    if (initialLocation) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'We need location permissions to show your current location on the map.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01, // Zoom in closer when using current location
          longitudeDelta: 0.01,
        };

        setCurrentRegion(newRegion);
        
        if (!initialLocation && !markerPosition) {
          setMarkerPosition({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }

        mapRef.current?.animateToRegion(newRegion, 1000);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert(
          'Location Error',
          'Could not determine your current location. Please select a location manually.',
          [{ text: 'OK' }]
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [initialLocation]);

  // When a user taps on the map to select a location
  const handleMapPress = async (e: any) => {
    if (readOnly) return;

    const { coordinate } = e.nativeEvent;
    setMarkerPosition(coordinate);

    try {
      const location = await reverseGeocode(coordinate.latitude, coordinate.longitude);
      
      if (onLocationSelect) {
        onLocationSelect({
          name: location.name,
          address: location.address,
          coordinates: {
            lat: coordinate.latitude,
            lng: coordinate.longitude,
          },
        });
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      Alert.alert(
        'Location Error',
        'Could not determine the address for this location. Please try another spot.',
        [{ text: 'OK' }]
      );
    }
  };

  // Get address from coordinates
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const result = results[0];
        const addressComponents = [
          result.name,
          result.street,
          result.district,
          result.city,
          result.region,
          result.postalCode,
        ].filter(Boolean);

        const name = result.name || 'Selected Location';
        const address = addressComponents.join(', ');

        return { name, address };
      }

      // Fallback if no results
      return {
        name: 'Selected Location',
        address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
      };
    } catch (error) {
      console.error('Reverse geocode error:', error);
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={currentRegion}
            onRegionChangeComplete={setCurrentRegion}
            onPress={handleMapPress}
            showsUserLocation={!readOnly}
            showsMyLocationButton={true}
            showsCompass={true}
            rotateEnabled={true}
          >
            {markerPosition && (
              <Marker
                coordinate={markerPosition}
                pinColor="#f97316"
                draggable={!readOnly}
                onDragEnd={(e) => handleMapPress(e)}
              />
            )}
          </MapView>

          {!readOnly && (
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                Tap on the map to select a delivery location
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748b',
  },
  map: {
    flex: 1,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    fontSize: 14,
    color: '#1e293b',
    textAlign: 'center',
  },
});

export default LocationMap;