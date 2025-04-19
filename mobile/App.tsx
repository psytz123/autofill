import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Mock authentication state for development
const useMockAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUser({ id: 1, username });
      setIsLoading(false);
    }, 1000);
  };

  const logout = () => {
    setUser(null);
  };

  return { user, isLoading, login, logout };
};

// Login Screen
function LoginScreen({ navigation }: any) {
  const { login, isLoading } = useMockAuth();
  
  const handleLogin = () => {
    login('test@example.com', 'password123');
    navigation.navigate('Home');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>AutoFill</Text>
        <Text style={styles.subtitle}>Mobile Fuel Delivery</Text>
        
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.input}>
            <Text>test@example.com</Text>
          </View>
          
          <Text style={styles.label}>Password</Text>
          <View style={styles.input}>
            <Text>••••••••</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Home Screen
function HomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AutoFill</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Quick Order</Text>
          
          <TouchableOpacity 
            style={styles.orderCard}
            onPress={() => navigation.navigate('Order')}
          >
            <View>
              <Text style={styles.orderTitle}>Order Fuel Now</Text>
              <Text style={styles.orderSubtitle}>Get fuel delivered to your location</Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No recent orders found</Text>
          </View>
          
          <Text style={styles.sectionTitle}>My Vehicles</Text>
          <View style={styles.vehicleCard}>
            <Text style={styles.vehicleTitle}>Honda Pilot</Text>
            <Text style={styles.vehicleSubtitle}>2019 • Regular Unleaded</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Order Screen
function OrderScreen() {
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
            <TouchableOpacity style={[styles.fuelOption, styles.fuelOptionSelected]}>
              <Text style={styles.fuelOptionText}>Regular</Text>
              <Text style={styles.fuelPrice}>$3.75/gal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fuelOption}>
              <Text style={styles.fuelOptionText}>Premium</Text>
              <Text style={styles.fuelPrice}>$4.35/gal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fuelOption}>
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
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Order" component={OrderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f97316',
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f97316',
  },
  orderSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyStateText: {
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
});