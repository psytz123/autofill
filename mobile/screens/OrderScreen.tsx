import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import { vehicles, locations, fuel, orders } from "../utils/api";
import { Vehicle, Location, FuelType } from "../utils/types";
import { OrderScreenProps } from "../types/navigation";

const OrderScreen: React.FC<Partial<OrderScreenProps>> = ({ navigation }) => {
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [userLocations, setUserLocations] = useState<Location[]>([]);
  const [fuelPrices, setFuelPrices] = useState<Record<FuelType, number> | null>(
    null,
  );

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    null,
  );
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(
    null,
  );
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>(
    FuelType.REGULAR_UNLEADED,
  );
  const [amount, setAmount] = useState<number>(10); // Default 10 gallons

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch data when component mounts
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch data in parallel
      const [vehiclesData, locationsData, pricesData] = await Promise.all([
        vehicles.getAll(),
        locations.getAll(),
        fuel.getPrices("FL"),
      ]);

      setUserVehicles(vehiclesData);
      setUserLocations(locationsData);
      setFuelPrices(pricesData);

      // Set defaults if available
      if (vehiclesData.length > 0) {
        setSelectedVehicleId(vehiclesData[0].id);
      }

      if (locationsData.length > 0) {
        setSelectedLocationId(locationsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert(
        "Error",
        "Failed to load required data. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFuelTypeSelect = (fuelType: FuelType) => {
    setSelectedFuelType(fuelType);
  };

  const handleVehicleSelect = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    // Optionally change fuel type to match vehicle's fuel type
    const vehicle = userVehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      setSelectedFuelType(vehicle.fuelType);
    }
  };

  const handleLocationSelect = (locationId: number) => {
    setSelectedLocationId(locationId);
  };

  const calculateTotal = (): number => {
    if (!fuelPrices) return 0;
    return fuelPrices[selectedFuelType] * amount;
  };

  const handleSubmitOrder = async () => {
    if (!selectedVehicleId || !selectedLocationId) {
      Alert.alert(
        "Incomplete Order",
        "Please select a vehicle and delivery location.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const total = calculateTotal();

      const orderData = {
        vehicleId: selectedVehicleId,
        locationId: selectedLocationId,
        fuelType: selectedFuelType,
        amount: amount,
        price: fuelPrices?.[selectedFuelType] || 0,
        total: total,
        // Add other fields as required by your API
      };

      const result = await orders.create(orderData);

      Alert.alert(
        "Order Submitted",
        `Your order has been placed successfully! Order #${result.id}`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home"),
          },
        ],
      );
    } catch (error) {
      console.error("Error submitting order:", error);
      Alert.alert(
        "Order Failed",
        "There was a problem submitting your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedVehicle = (): Vehicle | undefined => {
    return userVehicles.find((v) => v.id === selectedVehicleId);
  };

  const getSelectedLocation = (): Location | undefined => {
    return userLocations.find((l) => l.id === selectedLocationId);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading order form...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Order</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          {userLocations.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyCardText}>
                  No saved locations found
                </Text>
                <Button
                  title="Add a Location"
                  variant="outline"
                  size="small"
                  style={styles.emptyCardButton}
                  onPress={() => navigation.navigate('LocationSelection', { 
                    returnTo: 'Order',
                    onSaveCallback: (location: Location) => {
                      setUserLocations([...userLocations, location]);
                      setSelectedLocationId(location.id);
                    }
                  })}
                />
              </Card.Content>
            </Card>
          ) : (
            userLocations.map((location) => (
              <TouchableOpacity
                key={location.id}
                onPress={() => handleLocationSelect(location.id)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.locationCard,
                    selectedLocationId === location.id && styles.selectedCard,
                  ]}
                >
                  <Card.Content>
                    <View style={styles.locationCardContent}>
                      <View>
                        <Text style={styles.locationName}>{location.name}</Text>
                        <Text style={styles.locationAddress}>
                          {location.address}
                        </Text>
                      </View>
                      {selectedLocationId === location.id && (
                        <View style={styles.selectedIndicator} />
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          {userVehicles.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyCardText}>No vehicles found</Text>
                <Button
                  title="Add a Vehicle"
                  variant="outline"
                  size="small"
                  style={styles.emptyCardButton}
                />
              </Card.Content>
            </Card>
          ) : (
            userVehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                onPress={() => handleVehicleSelect(vehicle.id)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.vehicleCard,
                    selectedVehicleId === vehicle.id && styles.selectedCard,
                  ]}
                >
                  <Card.Content>
                    <View style={styles.vehicleCardContent}>
                      <View>
                        <Text style={styles.vehicleName}>
                          {vehicle.make} {vehicle.model}
                        </Text>
                        <Text style={styles.vehicleDetails}>
                          {vehicle.year} • {formatFuelType(vehicle.fuelType)}
                        </Text>
                      </View>
                      {selectedVehicleId === vehicle.id && (
                        <View style={styles.selectedIndicator} />
                      )}
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel Type</Text>
          {!fuelPrices ? (
            <ActivityIndicator color="#f97316" />
          ) : (
            <View style={styles.fuelTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.fuelTypeOption,
                  selectedFuelType === FuelType.REGULAR_UNLEADED &&
                    styles.selectedFuelType,
                ]}
                onPress={() => handleFuelTypeSelect(FuelType.REGULAR_UNLEADED)}
              >
                <Text style={styles.fuelTypeName}>Regular</Text>
                <Text style={styles.fuelTypePrice}>
                  ${fuelPrices.REGULAR_UNLEADED.toFixed(2)}/gal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fuelTypeOption,
                  selectedFuelType === FuelType.PREMIUM_UNLEADED &&
                    styles.selectedFuelType,
                ]}
                onPress={() => handleFuelTypeSelect(FuelType.PREMIUM_UNLEADED)}
              >
                <Text style={styles.fuelTypeName}>Premium</Text>
                <Text style={styles.fuelTypePrice}>
                  ${fuelPrices.PREMIUM_UNLEADED.toFixed(2)}/gal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.fuelTypeOption,
                  selectedFuelType === FuelType.DIESEL &&
                    styles.selectedFuelType,
                ]}
                onPress={() => handleFuelTypeSelect(FuelType.DIESEL)}
              >
                <Text style={styles.fuelTypeName}>Diesel</Text>
                <Text style={styles.fuelTypePrice}>
                  ${fuelPrices.DIESEL.toFixed(2)}/gal
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Location:</Text>
                <Text style={styles.summaryValue}>
                  {getSelectedLocation()?.name || "None selected"}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Vehicle:</Text>
                <Text style={styles.summaryValue}>
                  {getSelectedVehicle()
                    ? `${getSelectedVehicle()?.make} ${getSelectedVehicle()?.model}`
                    : "None selected"}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fuel Type:</Text>
                <Text style={styles.summaryValue}>
                  {formatFuelType(selectedFuelType)}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount:</Text>
                <Text style={styles.summaryValue}>{amount} gallons</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Price:</Text>
                <Text style={styles.totalValue}>
                  ${calculateTotal().toFixed(2)}
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Button
            title={submitting ? "Processing Order..." : "Place Order"}
            loading={submitting}
            onPress={handleSubmitOrder}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper functions
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: "#f97316",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  headerSpacer: {
    width: 50, // Match the width of the back button for centered title
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
  emptyCard: {
    alignItems: "center",
    padding: 24,
  },
  emptyCardText: {
    color: "#64748b",
    fontSize: 16,
    marginBottom: 12,
  },
  emptyCardButton: {
    minWidth: 160,
  },
  locationCard: {
    marginBottom: 8,
  },
  selectedCard: {
    borderColor: "#f97316",
    borderWidth: 2,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: "#64748b",
  },
  selectedIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#f97316",
  },
  vehicleCard: {
    marginBottom: 8,
  },
  vehicleCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    color: "#64748b",
  },
  fuelTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  fuelTypeOption: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: "31%",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedFuelType: {
    borderColor: "#f97316",
    backgroundColor: "rgba(249, 115, 22, 0.05)",
  },
  fuelTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  fuelTypePrice: {
    fontSize: 14,
    color: "#64748b",
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f97316",
  },
  submitButton: {
    height: 56,
  },
});

export default OrderScreen;
