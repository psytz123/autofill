import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/admin-layout";
import DriverTrackingMap from "@/components/admin/driver-tracking-map";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

export default function DriverTrackingPage() {
  const { toast } = useToast();

  // Mutation for assigning a driver to an order
  const assignDriverMutation = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: number; driverId: number }) => {
      const res = await apiRequest("POST", "/admin/api/orders/assign", {
        orderId,
        driverId,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Driver assigned",
        description: "The driver has been successfully assigned to the order.",
      });
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/admin/api/orders/unassigned"] });
      queryClient.invalidateQueries({ queryKey: ["/admin/api/orders/assigned"] });
      queryClient.invalidateQueries({ queryKey: ["/admin/api/drivers/available"] });
      queryClient.invalidateQueries({ queryKey: ["/admin/api/drivers"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign driver to order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle assigning a driver to an order
  const handleAssignDriver = (orderId: number, driverId: number) => {
    assignDriverMutation.mutate({ orderId, driverId });
  };

  return (
    <AdminLayout title="Driver Tracking">
      <DriverTrackingMap onAssignDriver={handleAssignDriver} />
    </AdminLayout>
  );
}