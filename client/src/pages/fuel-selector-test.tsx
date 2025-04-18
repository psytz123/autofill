import React, { useState } from 'react';
import { FuelSelector } from '@/components/order/FuelSelector';
import { FuelTypeSelector } from '@/components/order/FuelTypeSelector';
import { FuelQuantitySelector } from '@/components/order/FuelQuantitySelector';
import { FuelType, Vehicle } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

// Sample vehicle data for testing with correct typing
const SAMPLE_VEHICLE: Vehicle = {
  id: 1,
  userId: 1,
  make: 'Toyota',
  model: 'Camry',
  year: '2022', // Using string as per schema
  licensePlate: 'ABC-123',
  fuelType: FuelType.REGULAR_UNLEADED,
  fuelLevel: 30,
  createdAt: new Date(),
  updatedAt: new Date()
};

export default function FuelSelectorTest() {
  const [, navigate] = useLocation();
  const [fuelType, setFuelType] = useState<FuelType>(FuelType.REGULAR_UNLEADED);
  const [amount, setAmount] = useState(10);
  
  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fuel Selector Components</h1>
        <Button variant="outline" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
      
      <div className="space-y-10">
        {/* Demo of individual components */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Individual Components</h2>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">1. Fuel Type Selector</h3>
            <FuelTypeSelector 
              selectedType={fuelType} 
              onChange={setFuelType} 
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">2. Fuel Quantity Selector</h3>
            <FuelQuantitySelector
              amount={amount}
              onChange={setAmount}
              fuelType={fuelType}
              vehicleTankCapacity={15}
            />
          </div>
        </section>
        
        {/* Demo of combined component */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">Combined Component</h2>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Full Fuel Selector (without vehicle)</h3>
            <FuelSelector
              fuelType={fuelType}
              amount={amount}
              onFuelTypeChange={setFuelType}
              onAmountChange={setAmount}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Full Fuel Selector (with vehicle)</h3>
            <FuelSelector
              fuelType={fuelType}
              amount={amount}
              onFuelTypeChange={setFuelType}
              onAmountChange={setAmount}
              vehicle={SAMPLE_VEHICLE}
            />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Full Fuel Selector (with mismatched fuel type)</h3>
            <FuelSelector
              fuelType={FuelType.DIESEL}
              amount={amount}
              onFuelTypeChange={setFuelType}
              onAmountChange={setAmount}
              vehicle={SAMPLE_VEHICLE}
            />
          </div>
        </section>
      </div>
    </div>
  );
}