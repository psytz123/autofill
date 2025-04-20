import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/admin-layout";
import DriverTrackingMap from "@/components/admin/driver-tracking-map";
import { apiRequest } from "@/lib/queryClient";

export default function DriverTrackingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);

  // Mutation for assigning a driver to an order
  const assignDriverMutation = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: number; driverId: number }) => {
      const response = await apiRequest("POST", "/admin/api/orders/assign", {
        orderId,
        driverId,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Driver assigned",
        description: "The driver has been successfully assigned to the order.",
        variant: "default",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/admin/api/orders/all"] });
      queryClient.invalidateQueries({ queryKey: ["/admin/api/orders/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/admin/api/drivers"] });
      
      setIsAssigning(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment failed",
        description: error.message || "There was an error assigning the driver to the order.",
        variant: "destructive",
      });
      
      setIsAssigning(false);
    },
  });

  // Handler for assigning a driver to an order
  const handleAssignDriver = (orderId: number, driverId: number) => {
    setIsAssigning(true);
    assignDriverMutation.mutate({ orderId, driverId });
  };

  return (
    <AdminLayout title="Driver Tracking">
      <div className="space-y-4">
        <DriverTrackingMap onAssignDriver={handleAssignDriver} />
      </div>
    </AdminLayout>
  );
}