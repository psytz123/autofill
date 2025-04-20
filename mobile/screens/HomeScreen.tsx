import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import Card from "../components/Card";
import Button from "../components/Button";
import { vehicles, orders, fuel, locations } from "../utils/api";
import { Vehicle, Order, FuelType, LocationType } from "../utils/types";
import { HomeScreenProps } from "../types/navigation";
import * as Location from 'expo-location';

const HomeScreen: React.FC<Partial<HomeScreenProps>> = ({ navigation }) => {
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [fuelPrices, setFuelPrices] = useState<Record<FuelType, number> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingEmergency, setProcessingEmergency] = useState(false);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<
    'granted' | 'denied' | 'undetermined'
  >('undetermined');

  // Fetch data when component mounts and check location permissions
  useEffect(() => {
    fetchInitialData();
    checkLocationPermission();
  }, []);

  // Check location permission
  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermissionStatus(status as 'granted' | 'denied' | 'undetermined');
    } catch (error) {
      console.error("Error checking location permission:", error);
      setLocationPermissionStatus('denied');
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch data in parallel
      const [vehiclesData, ordersData, pricesData] = await Promise.all([
        vehicles.getAll(),
        orders.getRecent(),
        fuel.getPrices("FL"),
      ]);

      setUserVehicles(vehiclesData);
      setRecentOrders(ordersData);
      setFuelPrices(pricesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  };

  const handleNewOrder = () => {
    navigation?.navigate("Order");
  };
  
  // Handle emergency fuel request
  const handleEmergencyFuel = async () => {
    if (userVehicles.length === 0) {
      Alert.alert(
        "No Vehicles Found",
        "Please add a vehicle before requesting emergency fuel.",
        [{ text: "OK" }]
      );
      return;
    }
    
    if (locationPermissionStatus !== 'granted') {
      Alert.alert(
        "Location Permission Required",
        "AutoFill needs your location to send emergency fuel to you.",
        [
          { text: "Cancel" },
          { 
            text: "Grant Permission", 
            onPress: async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              setLocationPermissionStatus(status as 'granted' | 'denied' | 'undetermined');
              if (status === 'granted') {
                handleEmergencyFuel();
              }
            } 
          }
        ]
      );
      return;
    }

    // Select vehicle if multiple vehicles exist
    const selectedVehicle = userVehicles.length === 1 
      ? userVehicles[0] 
      : await selectVehiclePrompt();
    
    if (!selectedVehicle) return;

    setProcessingEmergency(true);
    
    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      // Get address from coordinates
      const [addressData] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      const address = formatAddress(addressData);
      
      // Confirm emergency request
      Alert.alert(
        "Confirm Emergency Fuel Request",
        `We'll send fuel to:\n${address}\n\nVehicle: ${selectedVehicle.make} ${selectedVehicle.model}\nFuel: ${formatFuelType(selectedVehicle.fuelType)}`,
        [
          { 
            text: "Cancel",
            style: "cancel",
            onPress: () => setProcessingEmergency(false)
          },
          {
            text: "Send Help Now",
            style: "destructive",
            onPress: () => processEmergencyOrder(selectedVehicle, {
              address,
              coordinates: {
                lat: location.coords.latitude,
                lng: location.coords.longitude
              }
            })
          }
        ]
      );
    } catch (error) {
      console.error("Error processing emergency fuel request:", error);
      Alert.alert(
        "Location Error",
        "Unable to determine your current location. Please try again or use the standard order process.",
        [{ text: "OK" }]
      );
      setProcessingEmergency(false);
    }
  };
  
  // Format address data from geocoding result
  const formatAddress = (address: Location.LocationGeocodedAddress): string => {
    const parts = [
      address.name,
      address.street,
      address.city,
      address.region,
      address.postalCode,
      address.country
    ].filter(Boolean);
    
    return parts.join(", ");
  };
  
  // Prompt user to select a vehicle if they have multiple
  const selectVehiclePrompt = (): Promise<Vehicle | null> => {
    return new Promise((resolve) => {
      const options = userVehicles.map(vehicle => 
        `${vehicle.make} ${vehicle.model} (${vehicle.year})`
      );
      
      options.push("Cancel");
      
      Alert.alert(
        "Select Vehicle for Emergency Fuel",
        "Which vehicle needs fuel?",
        options.map((option, index) => ({
          text: option,
          onPress: () => {
            if (index === options.length - 1) {
              // User selected Cancel
              resolve(null);
            } else {
              resolve(userVehicles[index]);
            }
          },
          style: index === options.length - 1 ? "cancel" : "default"
        }))
      );
    });
  };
  
  // Process the emergency order
  const processEmergencyOrder = async (
    vehicle: Vehicle,
    location: { address: string; coordinates: { lat: number; lng: number } }
  ) => {
    try {
      // Default to 5 gallons for emergency
      const fuelAmount = 5;
      
      // Create emergency order
      const response = await orders.createEmergency({
        vehicleId: vehicle.id,
        location,
        fuelType: vehicle.fuelType,
        amount: fuelAmount
      });
      
      // Refresh data and show success message
      await fetchInitialData();
      
      Alert.alert(
        "Emergency Fuel Request Sent!",
        "Your request has been confirmed. A driver will be dispatched to your location shortly.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error creating emergency order:", error);
      Alert.alert(
        "Request Failed",
        "There was an error sending your emergency fuel request. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setProcessingEmergency(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>AutoFill</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f97316"
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Order</Text>
          <Card onPress={handleNewOrder} style={styles.orderCard}>
            <Card.Content>
              <View style={styles.orderCardContent}>
                <View>
                  <Text style={styles.orderCardTitle}>Order Fuel Now</Text>
                  <Text style={styles.orderCardSubtitle}>
                    Get fuel delivered to your location
                  </Text>
                </View>
                {fuelPrices && (
                  <View style={styles.priceTag}>
                    <Text style={styles.priceTagText}>
                      From ${fuelPrices.REGULAR_UNLEADED.toFixed(2)}/gal
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Emergency Fuel Button */}
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergencyFuel}
            disabled={processingEmergency}
          >
            <View style={styles.emergencyButtonContent}>
              <Text style={styles.emergencyButtonText}>
                {processingEmergency ? "Processing..." : "Emergency Fuel (One-Tap)"}
              </Text>
              <Text style={styles.emergencyButtonSubtext}>
                Instantly request fuel to your current location
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {recentOrders.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No recent orders found</Text>
              <Button
                title="Place Your First Order"
                variant="outline"
                size="small"
                onPress={handleNewOrder}
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            recentOrders.map((order) => (
              <Card key={order.id} style={styles.orderHistoryCard}>
                <Card.Content>
                  <View style={styles.orderHistoryHeader}>
                    <Text style={styles.orderHistoryId}>Order #{order.id}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    >
                      <Text style={styles.statusText}>{order.status}</Text>
                    </View>
                  </View>
                  <View style={styles.orderHistoryDetails}>
                    <Text style={styles.orderHistoryLabel}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.orderHistoryValue}>
                      ${order.total.toFixed(2)}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Vehicles</Text>
          {userVehicles.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No vehicles added yet</Text>
              <Button
                title="Add a Vehicle"
                variant="outline"
                size="small"
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            userVehicles.map((vehicle) => (
              <Card key={vehicle.id} style={styles.vehicleCard}>
                <Card.Content>
                  <Text style={styles.vehicleTitle}>
                    {vehicle.make} {vehicle.model}
                  </Text>
                  <Text style={styles.vehicleSubtitle}>
                    {vehicle.year} • {formatFuelType(vehicle.fuelType)}
                  </Text>
                  {vehicle.licensePlate && (
                    <View style={styles.licensePlateContainer}>
                      <Text style={styles.licensePlateText}>
                        {vehicle.licensePlate}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper functions
const getStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "#10b981";
    case "IN_PROGRESS":
    case "EN_ROUTE":
      return "#3b82f6";
    case "PENDING":
      return "#f59e0b";
    case "CANCELLED":
      return "#ef4444";
    default:
      return "#6b7280";
  }
};

const formatFuelType = (fuelType: FuelType): string => {
  switch (fuelType) {
    case FuelType.REGULAR_UNLEADED:
      return "Regular Unleaded";
    case FuelType.PREMIUM_UNLEADED:
      return "Premium Unleaded";
    case FuelType.DIESEL:
      return "Diesel";
    default:
      return fuelType;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#f97316",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: "#ffffff",
    marginBottom: 12,
  },
  orderCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#f97316",
    marginBottom: 4,
  },
  orderCardSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  priceTag: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  priceTagText: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 14,
  },
  emergencyButton: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyButtonContent: {
    alignItems: "center",
  },
  emergencyButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  emergencyButtonSubtext: {
    color: "#ffffff",
    fontSize: 14,
    opacity: 0.9,
    textAlign: "center",
  },
  emptyStateContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  emptyStateText: {
    color: "#64748b",
    fontSize: 16,
    marginBottom: 12,
  },
  emptyStateButton: {
    minWidth: 160,
  },
  orderHistoryCard: {
    marginBottom: 12,
  },
  orderHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderHistoryId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  orderHistoryDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderHistoryLabel: {
    color: "#64748b",
    fontSize: 14,
  },
  orderHistoryValue: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 16,
  },
  vehicleCard: {
    marginBottom: 12,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  licensePlateContainer: {
    backgroundColor: "#f1f5f9",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  licensePlateText: {
    color: "#334155",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
  },
});

export default HomeScreen;
