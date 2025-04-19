import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Order: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

const HomeScreen = ({ navigation }: Props) => {
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
});

export default HomeScreen;