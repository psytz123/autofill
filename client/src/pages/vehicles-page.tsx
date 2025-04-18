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
import { Logo } from "@/components/ui/logo";

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
    <div className="h-screen-minus-tab overflow-y-auto flex flex-col">
      {/* Toolbar Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-5 flex items-center">
          <Logo size="sm" className="mr-3" />
          <div>
            <h1 className="text-2xl font-bold autofill-navy">My Vehicles</h1>
            <p className="text-sm text-neutral-500">Manage your cars, boats, and other vehicles</p>
          </div>
        </div>
        <div className="px-4 pb-3 flex justify-end">
          <Button
            onClick={() => {
              setEditingVehicle(null);
              setShowAddForm(true);
            }}
            className="bg-autofill-orange text-white hover:bg-orange-500"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Vehicle
          </Button>
        </div>
      </header>

      {/* Vehicles List */}
      <div className="p-4 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-neutral-500">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 && !showAddForm ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-100 mb-4 py-10 text-center">
            <Logo size="sm" className="mx-auto mb-4" />
            <p className="text-neutral-500 mb-4">You haven't added any vehicles yet</p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="mx-auto bg-autofill-orange text-white hover:bg-orange-500"
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
