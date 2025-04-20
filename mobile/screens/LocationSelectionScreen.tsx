import React, { useState } from 'react'; // React import
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { LocationScreenProps } from '../types/navigation';
import LocationMap from '../components/LocationMap';
import { Location, LocationType } from '../utils/types';
import { locations } from '../utils/api';

const LocationSelectionScreen: React.FC<Partial<LocationScreenProps>> = ({ navigation, route }) => {
  // Get the returnTo parameter from the route params
  const returnTo = route?.params?.returnTo || 'Order';
  const onSaveCallback = route?.params?.onSaveCallback;
  
  // State for managing selected location and UI states
  const [selectedLocation, setSelectedLocation] = useState<{
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  } | null>(null);
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle initial location selection from map
  const handleLocationSelect = (locationData: {
    name: string;
    address: string;
    coordinates: { lat: number; lng: number };
  }) => {
    setSelectedLocation(locationData);
    setIsConfirmModalVisible(true);
  };
  
  // Handle location confirmation and saving
  const handleConfirmLocation = async () => {
    if (!selectedLocation) return;
    
    setIsSaving(true);
    setIsConfirmModalVisible(false);
    
    try {
      // Save the location to the backend
      const savedLocation = await locations.create({
        name: selectedLocation.name,
        address: selectedLocation.address,
        type: LocationType.OTHER, // Default to OTHER, user can change later
        coordinates: selectedLocation.coordinates
      });
      
      // If there's a callback, call it with the saved location
      if (onSaveCallback && typeof onSaveCallback === 'function') {
        onSaveCallback(savedLocation);
      }
      
      // Show success alert before navigating
      Alert.alert(
        "Location Saved",
        "Your delivery location has been saved successfully.",
        [
          { 
            text: "OK", 
            onPress: () => navigation?.navigate(returnTo, { selectedLocation: savedLocation }) 
          }
        ]
      );
    } catch (error) {
      console.error('Failed to save location:', error);
      
      Alert.alert(
        "Error Saving Location",
        "There was a problem saving your location. Please try again.",
        [
          { 
            text: "OK", 
            onPress: () => setIsSaving(false)
          }
        ]
      );
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

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isConfirmModalVisible}
        onRequestClose={() => setIsConfirmModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Location</Text>
            
            {selectedLocation && (
              <View style={styles.locationDetails}>
                <Text style={styles.locationDetailLabel}>Address:</Text>
                <Text style={styles.locationDetailValue}>{selectedLocation.address}</Text>
              </View>
            )}
            
            <Text style={styles.modalMessage}>
              Is this the correct delivery location?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsConfirmModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Choose Another</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmLocation}
              >
                <Text style={styles.modalButtonConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Saving Indicator */}
      {isSaving && (
        <View style={styles.savingContainer}>
          <View style={styles.savingContent}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.savingText}>Saving location...</Text>
          </View>
        </View>
      )}
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
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  locationDetails: {
    width: '100%',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
  },
  locationDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  locationDetailValue: {
    fontSize: 15,
    color: '#1e293b',
  },
  modalMessage: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalButtonCancelText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '500',
  },
  modalButtonConfirm: {
    backgroundColor: '#f97316',
  },
  modalButtonConfirmText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  // Saving indicator styles
  savingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  savingContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  savingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1e293b',
  },
});

export default LocationSelectionScreen;