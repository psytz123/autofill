import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity
} from 'react-native';
import { LocationScreenProps } from '../types/navigation';
import LocationMap from '../components/LocationMap';
import { Location } from '../utils/types';
import { locations } from '../utils/api';

const LocationSelectionScreen: React.FC<Partial<LocationScreenProps>> = ({ navigation, route }) => {
  // Get the returnTo parameter from the route params
  const returnTo = route?.params?.returnTo || 'Order';
  const onSaveCallback = route?.params?.onSaveCallback;
  
  // Handle location selection
  const handleLocationSelect = async (locationData: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  }) => {
    try {
      // Save the location to the backend
      const savedLocation = await locations.create({
        name: locationData.name,
        address: locationData.address,
        type: 'OTHER', // Default to OTHER, user can change later
        coordinates: locationData.coordinates
      });
      
      // If there's a callback, call it with the saved location
      if (onSaveCallback && typeof onSaveCallback === 'function') {
        onSaveCallback(savedLocation);
      }
      
      // Navigate back to the screen that launched this screen
      navigation?.navigate(returnTo, { selectedLocation: savedLocation });
    } catch (error) {
      console.error('Failed to save location:', error);
      // Still navigate back, but without a location
      navigation?.navigate(returnTo);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <View style={styles.spacer} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.instruction}>
          Tap on the map to select a delivery location
        </Text>
        
        <View style={styles.mapContainer}>
          <LocationMap onLocationSelect={handleLocationSelect} />
        </View>
        
        <Text style={styles.note}>
          Please ensure you select an accurate location for fuel delivery.
          Our driver will navigate to the exact pin location you select.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#f97316',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  spacer: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instruction: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  mapContainer: {
    height: 350,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  note: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    padding: 8,
  },
});

export default LocationSelectionScreen;