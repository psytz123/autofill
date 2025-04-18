import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import VehicleCard from "@/components/vehicles/VehicleCard";
import AddVehicleForm from "@/components/vehicles/AddVehicleForm";
import { Vehicle } from "@shared/schema";

export default function VehiclesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  const { data: vehicles = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Vehicle deleted",
        description: "Your vehicle has been removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete vehicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleDelete = (id: number) => {
    deleteVehicleMutation.mutate(id.toString());
  };

  return (
    <div className="h-screen-minus-tab overflow-y-auto">
      {/* Toolbar Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate("/")}>
              <ArrowLeft className="h-6 w-6 text-neutral-700" />
            </Button>
            <h1 className="text-xl font-bold font-heading">My Vehicles</h1>
          </div>
          <Button
            variant="ghost"
            size="icon" 
            onClick={() => {
              setEditingVehicle(null);
              setShowAddForm(true);
            }}
            className="text-primary"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Vehicles List */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 && !showAddForm ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-100 mb-4 py-8 text-center">
            <p className="text-neutral-500 mb-3">You don't have any vehicles yet</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="mx-auto"
            >
              Add Your First Vehicle
            </Button>
          </div>
        ) : (
          !showAddForm && vehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={() => handleEdit(vehicle)}
              onDelete={() => handleDelete(vehicle.id)}
              showActions={true}
            />
          ))
        )}
        
        {showAddForm && (
          <AddVehicleForm
            vehicle={editingVehicle || undefined}
            onCancel={() => {
              setShowAddForm(false);
              setEditingVehicle(null);
            }}
            onSuccess={() => {
              setShowAddForm(false);
              setEditingVehicle(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
