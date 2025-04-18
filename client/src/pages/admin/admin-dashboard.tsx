import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Package, Truck, DollarSign, Users } from "lucide-react";

export default function AdminDashboardPage() {
  const { toast } = useToast();
  
  // Fetch statistics
  const { 
    data: stats,
    isLoading: isLoadingStats 
  } = useQuery({
    queryKey: ['/admin/api/stats'],
    queryFn: getQueryFn({ on401: "throw" }),
    onError: (error) => {
      toast({
        title: "Error loading dashboard data",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Fetch unassigned orders
  const { 
    data: unassignedOrders = [],
    isLoading: isLoadingUnassigned 
  } = useQuery({
    queryKey: ['/admin/api/orders/unassigned'],
    queryFn: getQueryFn({ on401: "throw" }),
    onError: (error) => {
      toast({
        title: "Error loading unassigned orders",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Use dummy data for now
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    activeDrivers: 0,
    revenue: 0,
    customers: 0,
    recentOrders: [],
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
  
  useEffect(() => {
    if (stats) {
      setDashboardData({
        ...dashboardData,
        totalOrders: stats.totalOrders || 0,
        activeDrivers: stats.activeDrivers || 0,
        revenue: stats.revenue || 0,
        customers: stats.customers || 0,
        recentOrders: stats.recentOrders || [],
        ordersByStatus: stats.ordersByStatus || dashboardData.ordersByStatus,
        deliveriesByDay: stats.deliveriesByDay || dashboardData.deliveriesByDay,
      });
    }
  }, [stats]);
  
  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FF8042'];
  
  return (
    <AdminLayout title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {unassignedOrders.length} unassigned
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeDrivers}</div>
            <p className="text-xs text-muted-foreground">
              Ready for delivery
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +10% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.customers}</div>
            <p className="text-xs text-muted-foreground">
              +5 in last week
            </p>
          </CardContent>
        </Card>
      </div>
      
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dashboardData.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Deliveries by Day</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.deliveriesByDay}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="deliveries" fill="#002B5B" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="unassigned">
              <TabsList>
                <TabsTrigger value="unassigned">Unassigned ({unassignedOrders.length})</TabsTrigger>
                <TabsTrigger value="all">All Recent</TabsTrigger>
              </TabsList>
              <TabsContent value="unassigned" className="mt-4">
                {isLoadingUnassigned ? (
                  <div className="text-center py-4">Loading...</div>
                ) : unassignedOrders.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No unassigned orders</div>
                ) : (
                  <div className="rounded-md border">
                    <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b">
                      <div>Order ID</div>
                      <div>Customer</div>
                      <div>Location</div>
                      <div>Fuel Type</div>
                      <div>Amount</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {unassignedOrders.map((order: any) => (
                      <div key={order.id} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
                        <div>#{order.id}</div>
                        <div>{order.userId}</div>
                        <div>
                          {order.locationId || "N/A"}
                        </div>
                        <div>{order.fuelType}</div>
                        <div>{order.amount} gal</div>
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
    </AdminLayout>
  );
}