import { useAuth } from "@/hooks/use-auth";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import QuickActionCard from "@/components/home/QuickActionCard";
import OrderCard from "@/components/orders/OrderCard";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getQueryFn } from "@/lib/queryClient";
import { Order } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders/recent'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  return (
    <div className="h-screen-minus-tab overflow-y-auto pb-4">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-neutral-800">AutoFill</h1>
              <p className="text-sm text-neutral-500">Welcome back, {user?.name || 'User'}</p>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-neutral-50">
              <Bell className="h-6 w-6 text-neutral-700" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Quick Action Cards */}
      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <QuickActionCard 
            title="Order Fuel"
            description="Quick delivery to your location"
            icon="fuel"
            color="primary"
            href="/order"
          />
          
          <QuickActionCard 
            title="My Vehicles"
            description="Manage your vehicles"
            icon="vehicle"
            color="secondary"
            href="/vehicles"
          />
        </div>
      </section>
      
      {/* Recent Orders */}
      <section className="px-4 py-2">
        <h2 className="text-lg font-semibold mb-3">Recent Orders</h2>
        
        {ordersLoading ? (
          <div className="py-8 text-center">
            <p className="text-neutral-500">Loading recent orders...</p>
          </div>
        ) : recentOrders.length > 0 ? (
          <div>
            {recentOrders.map((order) => (
              <OrderCard key={order.id} order={order} showViewDetails={false} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-neutral-100 mb-4 py-6 text-center">
            <p className="text-neutral-500 mb-3">You haven't placed any orders yet</p>
            <Link href="/order">
              <Button variant="outline" className="mx-auto">Order Fuel Now</Button>
            </Link>
          </div>
        )}
        
        {recentOrders.length > 0 && (
          <Link href="/orders">
            <Button variant="link" className="w-full py-3 text-primary font-medium text-center">
              View All Orders
            </Button>
          </Link>
        )}
      </section>
    </div>
  );
}
