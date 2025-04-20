import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Package, Truck, DollarSign, Users, ArrowRight } from "lucide-react";
import { AdminDashboardStats, AdminOrder } from "@/types/admin";
import OrderLocationMap from "@/components/admin/order-location-map";
import FuelCalculator from "@/components/admin/fuel-calculator";
import AdvancedAnalytics from "@/components/admin/advanced-analytics";
import { useLocation } from "wouter";

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch statistics
  const { data: stats, isLoading: isLoadingStats } =
    useQuery<AdminDashboardStats>({
      queryKey: ["/admin/api/stats"],
      queryFn: getQueryFn({ on401: "throw" }),
    });

  // Fetch unassigned orders
  const {
    data: unassignedOrders = [] as AdminOrder[],
    isLoading: isLoadingUnassigned,
  } = useQuery<AdminOrder[]>({
    queryKey: ["/admin/api/orders/unassigned"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Fetch all orders for mapping
  const {
    data: allOrders = [] as AdminOrder[],
    isLoading: isLoadingAllOrders,
  } = useQuery<AdminOrder[]>({
    queryKey: ["/admin/api/orders/all"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Define the dashboard data state
  const [dashboardData, setDashboardData] = useState<AdminDashboardStats>({
    totalOrders: 0,
    activeDrivers: 0,
    totalDrivers: 0,
    revenue: 0,
    customers: 0,
    ordersByStatus: [
      { name: "In Progress", value: 5 },
      { name: "Completed", value: 25 },
      { name: "Cancelled", value: 2 },
    ],
    deliveriesByDay: [
      { day: "Mon", deliveries: 4 },
      { day: "Tue", deliveries: 6 },
      { day: "Wed", deliveries: 5 },
      { day: "Thu", deliveries: 8 },
      { day: "Fri", deliveries: 12 },
      { day: "Sat", deliveries: 15 },
      { day: "Sun", deliveries: 7 },
    ],
  });

  // Enhanced orders with location data (for demo purposes)
  const enhancedOrders = unassignedOrders.map(order => ({
    ...order,
    coordinates: order.coordinates || {
      lat: 40.7128 + (Math.random() * 0.1 - 0.05),
      lng: -74.0060 + (Math.random() * 0.1 - 0.05)
    },
    customerName: order.customerName || `Customer ${order.userId}`,
    address: order.address || "123 Main St, New York, NY",
    estimatedDeliveryAmount: order.estimatedDeliveryAmount || Math.round(order.amount * 1.1),
    priority: order.priority || (Math.random() > 0.8 ? 'HIGH' : Math.random() > 0.6 ? 'MEDIUM' : 'LOW')
  }));

  useEffect(() => {
    if (stats) {
      setDashboardData({
        ...dashboardData,
        totalOrders: stats.totalOrders || 0,
        activeDrivers: stats.activeDrivers || 0,
        totalDrivers: stats.totalDrivers || 0,
        revenue: stats.revenue || 0,
        customers: stats.customers || 0,
        ordersByStatus: stats.ordersByStatus || dashboardData.ordersByStatus,
        deliveriesByDay: stats.deliveriesByDay || dashboardData.deliveriesByDay,
      });
    }
  }, [stats, dashboardData]);

  // Pie chart colors
  const COLORS = ["#0088FE", "#00C49F", "#FF8042"];

  return (
    <AdminLayout title="Dashboard">
      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {unassignedOrders.length} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Drivers
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.activeDrivers}
            </div>
            <p className="text-xs text-muted-foreground">Ready for delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardData.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +10% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.customers}</div>
            <p className="text-xs text-muted-foreground">+5 in last week</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Map */}
      <div className="mt-4">
        <OrderLocationMap 
          orders={enhancedOrders} 
          isLoading={isLoadingUnassigned || isLoadingAllOrders} 
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {dashboardData.ordersByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <FuelCalculator />
      </div>

      {/* Recent Orders Section */}
      <div className="mt-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/admin/orders")}
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="unassigned">
              <TabsList>
                <TabsTrigger value="unassigned">
                  Unassigned ({unassignedOrders.length})
                </TabsTrigger>
                <TabsTrigger value="all">All Recent</TabsTrigger>
              </TabsList>
              <TabsContent value="unassigned" className="mt-4">
                {isLoadingUnassigned ? (
                  <div className="text-center py-4">Loading...</div>
                ) : unassignedOrders.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No unassigned orders
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-7 gap-2 p-4 font-medium border-b">
                      <div>Order ID</div>
                      <div>Customer</div>
                      <div>Location</div>
                      <div>Fuel Type</div>
                      <div>Amount</div>
                      <div>Est. Amount</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {enhancedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="grid grid-cols-7 gap-2 p-4 border-b last:border-b-0"
                      >
                        <div>#{order.id}</div>
                        <div>{order.customerName}</div>
                        <div className="truncate">{order.address || order.locationId || "N/A"}</div>
                        <div>{order.fuelType}</div>
                        <div>{order.amount} gal</div>
                        <div className="text-green-600">
                          {order.estimatedDeliveryAmount || order.amount} gal
                        </div>
                        <div className="text-right">
                          <button className="text-sm text-blue-600 hover:underline">
                            Assign
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="all" className="mt-4">
                <div className="text-center py-4 text-muted-foreground">
                  Loading recent orders...
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section */}
      <div className="mt-4">
        <AdvancedAnalytics />
      </div>
    </AdminLayout>
  );
}
