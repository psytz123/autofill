import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { AdminOrder, AssignedOrder, AdminDriver } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  
  // Fetch all orders
  const { data: orders = [] as AdminOrder[], isLoading: isLoadingOrders } = useQuery<AdminOrder[]>({
    queryKey: ['/admin/api/orders'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch unassigned orders
  const { data: unassignedOrders = [] as AdminOrder[], isLoading: isLoadingUnassigned } = useQuery<AdminOrder[]>({
    queryKey: ['/admin/api/orders/unassigned'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch assigned orders
  const { data: assignedOrders = [] as AssignedOrder[], isLoading: isLoadingAssigned } = useQuery<AssignedOrder[]>({
    queryKey: ['/admin/api/orders/assigned'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch available drivers
  const { data: availableDrivers = [] as AdminDriver[], isLoading: isLoadingDrivers } = useQuery<AdminDriver[]>({
    queryKey: ['/admin/api/drivers/available'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Assign order to driver mutation
  const assignOrderMutation = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: number, driverId: number }) => {
      const res = await apiRequest("POST", "/admin/api/orders/assign", {
        orderId,
        driverId,
      });
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['/admin/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/admin/api/orders/unassigned'] });
      queryClient.invalidateQueries({ queryKey: ['/admin/api/orders/assigned'] });
      
      toast({
        title: "Order assigned",
        description: "The order has been assigned to the driver successfully",
      });
      
      setAssignDialogOpen(false);
      setSelectedOrder(null);
      setSelectedDriver("");
    },
    onError: (error) => {
      toast({
        title: "Error assigning order",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleAssignOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
    setAssignDialogOpen(true);
  };
  
  const confirmAssignOrder = () => {
    if (!selectedOrder || !selectedDriver) return;
    
    assignOrderMutation.mutate({
      orderId: selectedOrder.id,
      driverId: parseInt(selectedDriver),
    });
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <AdminLayout title="Orders Management">
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unassigned">
            <TabsList className="mb-4">
              <TabsTrigger value="unassigned">
                Unassigned ({unassignedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="assigned">
                Assigned ({assignedOrders.length})
              </TabsTrigger>
              <TabsTrigger value="all">
                All Orders ({orders.length})
              </TabsTrigger>
            </TabsList>
          
            <TabsContent value="unassigned">
              {isLoadingUnassigned ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : unassignedOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No unassigned orders found
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium">Order ID</th>
                        <th className="py-3 px-4 text-left font-medium">Customer</th>
                        <th className="py-3 px-4 text-left font-medium">Date</th>
                        <th className="py-3 px-4 text-left font-medium">Fuel Type</th>
                        <th className="py-3 px-4 text-left font-medium">Amount</th>
                        <th className="py-3 px-4 text-left font-medium">Status</th>
                        <th className="py-3 px-4 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassignedOrders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-3 px-4">#{order.id}</td>
                          <td className="py-3 px-4">{order.userId}</td>
                          <td className="py-3 px-4">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">{order.fuelType}</td>
                          <td className="py-3 px-4">{order.amount} gal</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusBadgeColor(order.status)}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAssignOrder(order)}
                            >
                              Assign
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="assigned">
              {isLoadingAssigned ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : assignedOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No assigned orders found
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium">Order ID</th>
                        <th className="py-3 px-4 text-left font-medium">Customer</th>
                        <th className="py-3 px-4 text-left font-medium">Date</th>
                        <th className="py-3 px-4 text-left font-medium">Fuel Type</th>
                        <th className="py-3 px-4 text-left font-medium">Driver</th>
                        <th className="py-3 px-4 text-left font-medium">Status</th>
                        <th className="py-3 px-4 text-left font-medium">Est. Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedOrders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-3 px-4">#{order.id}</td>
                          <td className="py-3 px-4">{order.userId}</td>
                          <td className="py-3 px-4">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">{order.fuelType}</td>
                          <td className="py-3 px-4">{order.driver_name}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusBadgeColor(order.status)}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {order.estimated_delivery_time
                              ? new Date(order.estimated_delivery_time).toLocaleTimeString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {isLoadingOrders ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium">Order ID</th>
                        <th className="py-3 px-4 text-left font-medium">Customer</th>
                        <th className="py-3 px-4 text-left font-medium">Date</th>
                        <th className="py-3 px-4 text-left font-medium">Fuel Type</th>
                        <th className="py-3 px-4 text-left font-medium">Amount</th>
                        <th className="py-3 px-4 text-left font-medium">Total</th>
                        <th className="py-3 px-4 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order: any) => (
                        <tr key={order.id} className="border-b">
                          <td className="py-3 px-4">#{order.id}</td>
                          <td className="py-3 px-4">{order.userId}</td>
                          <td className="py-3 px-4">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">{order.fuelType}</td>
                          <td className="py-3 px-4">{order.amount} gal</td>
                          <td className="py-3 px-4">${order.totalPrice.toFixed(2)}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusBadgeColor(order.status)}>
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Assign Driver Dialog */}
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Order to Driver</DialogTitle>
                <DialogDescription>
                  Select a driver to fulfill this order.
                </DialogDescription>
              </DialogHeader>
              
              {selectedOrder && (
                <div className="py-4">
                  <div className="flex justify-between mb-4">
                    <span className="font-medium">Order #{selectedOrder.id}</span>
                    <span>{new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Fuel Type</p>
                      <p>{selectedOrder.fuelType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p>{selectedOrder.amount} gallons</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p>${selectedOrder.totalPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p>{selectedOrder.status}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Select Driver
                </label>
                <Select
                  value={selectedDriver}
                  onValueChange={setSelectedDriver}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingDrivers ? (
                      <div className="flex justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : availableDrivers.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No available drivers
                      </div>
                    ) : (
                      availableDrivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.name} ({driver.vehicleModel})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAssignDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmAssignOrder}
                  disabled={!selectedDriver || assignOrderMutation.isPending}
                >
                  {assignOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    "Assign Order"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}