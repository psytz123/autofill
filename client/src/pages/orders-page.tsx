import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import OrderCard from "@/components/orders/OrderCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatus } from "@shared/schema";

export default function OrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");
  
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const filteredOrders = filter === "ALL" 
    ? orders 
    : orders.filter(order => order.status === filter);
  
  return (
    <div className="h-screen-minus-tab overflow-y-auto">
      <header className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold font-heading text-neutral-800">My Orders</h1>
        </div>
      </header>
      
      <div className="p-4">
        {/* Order Filtering */}
        <Tabs defaultValue="ALL" value={filter} onValueChange={setFilter as any} className="mb-4">
          <TabsList className="w-full overflow-x-auto flex justify-start pb-2 -mx-1">
            <TabsTrigger value="ALL" className="whitespace-nowrap px-4 py-2 mx-1 rounded-full text-sm font-medium">
              All Orders
            </TabsTrigger>
            <TabsTrigger value="IN_PROGRESS" className="whitespace-nowrap px-4 py-2 mx-1 rounded-full text-sm font-medium">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="COMPLETED" className="whitespace-nowrap px-4 py-2 mx-1 rounded-full text-sm font-medium">
              Completed
            </TabsTrigger>
            <TabsTrigger value="CANCELLED" className="whitespace-nowrap px-4 py-2 mx-1 rounded-full text-sm font-medium">
              Cancelled
            </TabsTrigger>
          </TabsList>
        
          <TabsContent value="ALL">
            {renderOrdersList(filteredOrders, isLoading)}
          </TabsContent>
          
          <TabsContent value="IN_PROGRESS">
            {renderOrdersList(filteredOrders, isLoading)}
          </TabsContent>
          
          <TabsContent value="COMPLETED">
            {renderOrdersList(filteredOrders, isLoading)}
          </TabsContent>
          
          <TabsContent value="CANCELLED">
            {renderOrdersList(filteredOrders, isLoading)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function renderOrdersList(orders: any[], isLoading: boolean) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">Loading orders...</p>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-100 mb-4 py-8 text-center">
        <p className="text-neutral-500 mb-3">No orders found</p>
        <Button variant="outline" className="mx-auto">Order Fuel Now</Button>
      </div>
    );
  }
  
  return (
    <div>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} showViewDetails={true} />
      ))}
    </div>
  );
}
