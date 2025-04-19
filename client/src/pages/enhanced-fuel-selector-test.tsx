import React, { useState } from 'react';
import { EnhancedFuelSelector } from '@/components/order/EnhancedFuelSelector';
import { EnhancedFuelTypeSelector } from '@/components/order/EnhancedFuelTypeSelector';
import { EnhancedFuelQuantitySelector } from '@/components/order/EnhancedFuelQuantitySelector';
import { FuelType, Vehicle } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

// Sample vehicle data for testing with correct typing
const SAMPLE_VEHICLE: Vehicle = {
  id: 1,
  userId: 1,
  make: 'Toyota',
  model: 'Camry',
  year: '2020',
  licensePlate: 'ABC123',
  fuelType: FuelType.REGULAR_UNLEADED,
  fuelLevel: 0.25, // 25% full
  createdAt: new Date(),
  updatedAt: new Date()
};

const DIESEL_VEHICLE: Vehicle = {
  ...SAMPLE_VEHICLE,
  id: 2,
  make: 'Ford',
  model: 'F-150',
  fuelType: FuelType.DIESEL
};

export default function EnhancedFuelSelectorTest() {
  const [, navigate] = useLocation();
  const [fuelType, setFuelType] = useState<FuelType>(FuelType.REGULAR_UNLEADED);
  const [amount, setAmount] = useState(10);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center max-w-7xl mx-auto">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate('/')}>
            <ArrowLeft className="h-6 w-6 text-neutral-700" />
          </Button>
          <h1 className="text-xl font-bold font-heading">Enhanced Fuel Selector</h1>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-6 max-w-7xl mx-auto w-full">
        <Tabs defaultValue="combined">
          <TabsList className="mb-4">
            <TabsTrigger value="combined">Combined Component</TabsTrigger>
            <TabsTrigger value="individual">Individual Components</TabsTrigger>
          </TabsList>
          
          {/* Combined Components Tab */}
          <TabsContent value="combined" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Without Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedFuelSelector
                    fuelType={fuelType}
                    amount={amount}
                    onFuelTypeChange={setFuelType}
                    onAmountChange={setAmount}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>With Compatible Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedFuelSelector
                    fuelType={FuelType.REGULAR_UNLEADED}
                    amount={amount}
                    onFuelTypeChange={setFuelType}
                    onAmountChange={setAmount}
                    vehicle={SAMPLE_VEHICLE}
                  />
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>With Incompatible Fuel Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <EnhancedFuelSelector
                    fuelType={FuelType.PREMIUM_UNLEADED}
                    amount={amount}
                    onFuelTypeChange={setFuelType}
                    onAmountChange={setAmount}
                    vehicle={DIESEL_VEHICLE}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Individual Components Tab */}
          <TabsContent value="individual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fuel Type Selector</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedFuelTypeSelector 
                  selectedType={fuelType} 
                  onChange={setFuelType} 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Fuel Quantity Selector</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedFuelQuantitySelector
                  amount={amount}
                  onChange={setAmount}
                  fuelType={fuelType}
                  vehicleTankCapacity={15}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </main>
    </div>
  );
}