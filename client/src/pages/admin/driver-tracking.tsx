import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/admin-layout";
import DriverTrackingMap from "@/components/admin/driver-tracking-map";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, ZapIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DriverTrackingPage() {
  const { toast } = useToast();
  const [autoAssignDialogOpen, setAutoAssignDialogOpen] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);

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
      queryClient.invalidateQueries({ queryKey: ["/admin/api/tracking-data"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment failed",
        description: error.message || "Failed to assign driver to order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for auto-assigning orders to drivers using AI
  const autoAssignMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/admin/api/orders/auto-assign", {});
      return await res.json();
    },
    onSuccess: (data) => {
      setOptimizationResult(data);
      setAutoAssignDialogOpen(true);
      
      if (data.success && data.totalAssigned > 0) {
        toast({
          title: `${data.totalAssigned} orders assigned automatically`,
          description: "AI has assigned orders to optimal drivers based on location and efficiency.",
        });
        
        // Invalidate queries to refresh the data
        queryClient.invalidateQueries({ queryKey: ["/admin/api/orders/unassigned"] });
        queryClient.invalidateQueries({ queryKey: ["/admin/api/orders/assigned"] });
        queryClient.invalidateQueries({ queryKey: ["/admin/api/drivers/available"] });
        queryClient.invalidateQueries({ queryKey: ["/admin/api/drivers"] });
        queryClient.invalidateQueries({ queryKey: ["/admin/api/tracking-data"] });
      } else {
        toast({
          title: "No orders assigned",
          description: data.message || "No orders could be assigned automatically.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Auto-assignment failed",
        description: error.message || "Failed to auto-assign orders. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle assigning a driver to an order
  const handleAssignDriver = (orderId: number, driverId: number) => {
    assignDriverMutation.mutate({ orderId, driverId });
  };

  // Handle auto-assigning orders to drivers
  const handleAutoAssign = () => {
    autoAssignMutation.mutate();
  };

  return (
    <AdminLayout title="Driver Tracking">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Real-time Driver Location & Order Tracking</h2>
          <p className="text-muted-foreground">
            Monitor driver locations and assign orders efficiently
          </p>
        </div>
        <Button 
          onClick={handleAutoAssign} 
          disabled={autoAssignMutation.isPending}
          className="ml-4"
        >
          {autoAssignMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning...
            </>
          ) : (
            <>
              <ZapIcon className="mr-2 h-4 w-4" />
              AI Auto-Assign Orders
            </>
          )}
        </Button>
      </div>

      <DriverTrackingMap onAssignDriver={handleAssignDriver} />

      {/* Auto-Assignment Results Dialog */}
      <Dialog open={autoAssignDialogOpen} onOpenChange={setAutoAssignDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI-Powered Route Optimization Results</DialogTitle>
            <DialogDescription>
              The AI has analyzed driver locations and order destinations to create optimal assignments.
            </DialogDescription>
          </DialogHeader>

          {optimizationResult && (
            <div className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-muted p-4 rounded-md">
                  <div className="font-semibold">Total Assigned:</div>
                  <div className="text-2xl">{optimizationResult.totalAssigned}</div>
                </div>
                <div className="bg-muted p-4 rounded-md">
                  <div className="font-semibold">Total Unassigned:</div>
                  <div className="text-2xl">{optimizationResult.totalUnassigned}</div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Assignment Strategy</h3>
                <p className="text-sm text-muted-foreground">{optimizationResult.explanation}</p>
              </div>

              {optimizationResult.assignments?.length > 0 && (
                <>
                  <h3 className="text-lg font-medium">Assignments</h3>
                  <div className="space-y-3">
                    {optimizationResult.assignments.map((assignment: any) => (
                      <Card key={`${assignment.orderId}-${assignment.driverId}`}>
                        <CardHeader className="py-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              Order #{assignment.orderId} → Driver {assignment.driverName}
                            </CardTitle>
                            {assignment.success ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="py-2 text-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="font-semibold">Distance:</div>
                              <div>{assignment.distanceKm} km</div>
                            </div>
                            <div>
                              <div className="font-semibold">Est. Time:</div>
                              <div>{assignment.estimatedTimeMinutes} min</div>
                            </div>
                            <div className="col-span-2">
                              <div className="font-semibold">Reason:</div>
                              <div>{assignment.reason}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {optimizationResult.unassignedOrders?.length > 0 && (
                <>
                  <h3 className="text-lg font-medium mt-4">Unassigned Orders</h3>
                  <div className="text-sm border rounded-md p-3">
                    <p>The following orders could not be assigned: {optimizationResult.unassignedOrders.join(", ")}</p>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setAutoAssignDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}