import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Order: undefined;
};

type OrderScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Order'>;

type Props = {
  navigation: OrderScreenNavigationProp;
};

type FuelType = 'REGULAR_UNLEADED' | 'PREMIUM_UNLEADED' | 'DIESEL';

const OrderScreen = ({ navigation }: Props) => {
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('REGULAR_UNLEADED');
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Order</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Delivery Location</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationPlaceholder}>Select a delivery location</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleTitle}>Honda Pilot</Text>
            <Text style={styles.vehicleSubtitle}>2019 • Regular Unleaded</Text>
          </View>
          
          <Text style={styles.sectionTitle}>Fuel Type</Text>
          <View style={styles.fuelOptions}>
            <TouchableOpacity 
              style={[
                styles.fuelOption, 
                selectedFuelType === 'REGULAR_UNLEADED' && styles.fuelOptionSelected
              ]}
              onPress={() => setSelectedFuelType('REGULAR_UNLEADED')}
            >
              <Text style={styles.fuelOptionText}>Regular</Text>
              <Text style={styles.fuelPrice}>$3.75/gal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.fuelOption, 
                selectedFuelType === 'PREMIUM_UNLEADED' && styles.fuelOptionSelected
              ]}
              onPress={() => setSelectedFuelType('PREMIUM_UNLEADED')}
            >
              <Text style={styles.fuelOptionText}>Premium</Text>
              <Text style={styles.fuelPrice}>$4.35/gal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.fuelOption, 
                selectedFuelType === 'DIESEL' && styles.fuelOptionSelected
              ]}
              onPress={() => setSelectedFuelType('DIESEL')}
            >
              <Text style={styles.fuelOptionText}>Diesel</Text>
              <Text style={styles.fuelPrice}>$4.10/gal</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f97316',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  locationPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  vehicleCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  fuelOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  fuelOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  fuelOptionSelected: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  fuelOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#333',
  },
  fuelPrice: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#f97316',
    borderRadius: 6,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderScreen;