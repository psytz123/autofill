import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  DollarSign, 
  ShoppingBag, 
  MapPin 
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

// Custom type definitions
interface RevenueStat {
  time_period: string;
  order_count: number;
  revenue: number;
}

interface LocationStat {
  lat: string;
  lng: string;
  delivery_count: number;
}

interface PeakTimeStat {
  hour: number;
  order_count: number;
}

interface RetentionSummary {
  total_customers: number;
  repeat_customers: number;
  avg_orders_per_customer: number;
  avg_customer_lifespan_days: number;
}

interface RetentionCohort {
  cohort: string;
  total_users: number;
  retention_30d_pct: number;
  retention_60d_pct: number;
  retention_90d_pct: number;
}

interface RetentionData {
  summary: RetentionSummary;
  cohorts: RetentionCohort[];
}

// Card to format a metric with title, value and icon
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  isLoading?: boolean;
}

function MetricCard({ title, value, icon, description, isLoading = false }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { toast } = useToast();
  
  // Fetch revenue analytics
  const { 
    data: revenueData = [], 
    isLoading: isLoadingRevenue 
  } = useQuery<RevenueStat[]>({
    queryKey: ['/admin/api/analytics/revenue', revenuePeriod],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Fetch popular locations
  const { 
    data: locationData = [], 
    isLoading: isLoadingLocations 
  } = useQuery<LocationStat[]>({
    queryKey: ['/admin/api/analytics/popular-locations'],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Fetch peak ordering times
  const { 
    data: peakTimeData = [], 
    isLoading: isLoadingPeakTimes 
  } = useQuery<PeakTimeStat[]>({
    queryKey: ['/admin/api/analytics/peak-times'],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Fetch customer retention metrics
  const { 
    data: retentionData, 
    isLoading: isLoadingRetention 
  } = useQuery<RetentionData>({
    queryKey: ['/admin/api/analytics/customer-retention'],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Format revenue data for charts
  const formattedRevenueData = revenueData.map(item => ({
    name: revenuePeriod === 'daily' 
      ? format(new Date(item.time_period), 'MMM d')
      : revenuePeriod === 'weekly'
        ? `Week ${item.time_period.split('-')[1]}`
        : format(new Date(item.time_period + '-01'), 'MMM yyyy'),
    Revenue: parseFloat(item.revenue as any) || 0,
    Orders: parseInt(item.order_count as any) || 0
  }));
  
  // Format peak time data with proper labels
  const formattedPeakTimeData = peakTimeData.map(item => ({
    name: item.hour < 12 
      ? `${item.hour === 0 ? 12 : item.hour}am`
      : `${item.hour === 12 ? 12 : item.hour - 12}pm`,
    Orders: parseInt(item.order_count as any) || 0,
    hour: item.hour // Keep original hour for sorting
  })).sort((a, b) => a.hour - b.hour);
  
  // Prepare retention cohort data for chart
  const cohortChartData = retentionData?.cohorts.map(cohort => ({
    name: cohort.cohort,
    '30 Days': cohort.retention_30d_pct,
    '60 Days': cohort.retention_60d_pct,
    '90 Days': cohort.retention_90d_pct
  })).reverse() || [];
  
  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="space-y-6">
        {/* Summary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Revenue (90 days)" 
            value={
              isLoadingRevenue 
                ? "Loading..." 
                : `$${revenueData.reduce((sum, item) => sum + (parseFloat(item.revenue as any) || 0), 0).toFixed(2)}`
            } 
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} 
            isLoading={isLoadingRevenue}
          />
          
          <MetricCard 
            title="Total Orders (90 days)" 
            value={
              isLoadingRevenue 
                ? "Loading..." 
                : revenueData.reduce((sum, item) => sum + (parseInt(item.order_count as any) || 0), 0)
            } 
            icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} 
            isLoading={isLoadingRevenue}
          />
          
          <MetricCard 
            title="Customer Retention Rate" 
            value={
              isLoadingRetention 
                ? "Loading..." 
                : `${retentionData?.cohorts[0]?.retention_30d_pct || 0}%`
            } 
            description="Customers who return within 30 days" 
            icon={<Users className="h-4 w-4 text-muted-foreground" />} 
            isLoading={isLoadingRetention}
          />
          
          <MetricCard 
            title="Avg. Customer Lifespan" 
            value={
              isLoadingRetention 
                ? "Loading..." 
                : `${Math.round(retentionData?.summary?.avg_customer_lifespan_days || 0)} days`
            } 
            icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
            isLoading={isLoadingRetention}
          />
        </div>
        
        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Revenue Trends</CardTitle>
              
              <Select value={revenuePeriod} onValueChange={(value) => setRevenuePeriod(value as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>
              Revenue and order trends over the last 90 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRevenue ? (
              <div className="flex items-center justify-center h-80">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : formattedRevenueData.length === 0 ? (
              <div className="flex items-center justify-center h-80 text-muted-foreground">
                No revenue data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart
                  data={formattedRevenueData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="Revenue" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="Orders" 
                    stroke="#82ca9d" 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        {/* Detailed Metrics Tabs */}
        <Tabs defaultValue="peak-times">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="peak-times" className="flex-1">
              Peak Delivery Times
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex-1">
              Popular Locations
            </TabsTrigger>
            <TabsTrigger value="retention" className="flex-1">
              Customer Retention
            </TabsTrigger>
          </TabsList>
          
          {/* Peak Delivery Times Tab */}
          <TabsContent value="peak-times">
            <Card>
              <CardHeader>
                <CardTitle>Peak Ordering Hours</CardTitle>
                <CardDescription>
                  Most popular times of day for orders over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPeakTimes ? (
                  <div className="flex items-center justify-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : formattedPeakTimeData.length === 0 ? (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    No peak time data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={formattedPeakTimeData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Orders" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Popular Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Popular Delivery Locations</CardTitle>
                <CardDescription>
                  Areas with the highest delivery frequency
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLocations ? (
                  <div className="flex items-center justify-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : locationData.length === 0 ? (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    No location data available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={locationData.slice(0, 5).map((item, index) => ({
                              name: `Location ${index + 1}`,
                              value: parseInt(item.delivery_count as any) || 0
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {locationData.slice(0, 5).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Top Delivery Areas</h3>
                      {locationData.slice(0, 5).map((location, index) => (
                        <div key={index} className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <span>Location {index + 1}</span>
                          </div>
                          <div className="font-medium">{location.delivery_count} orders</div>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground mt-4">
                        <span className="font-medium">Note:</span> Coordinates have been grouped by proximity. 
                        For exact delivery points, please export the detailed data.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Customer Retention Tab */}
          <TabsContent value="retention">
            <Card>
              <CardHeader>
                <CardTitle>Customer Retention Analysis</CardTitle>
                <CardDescription>
                  How well we retain customers over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRetention ? (
                  <div className="flex items-center justify-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !retentionData ? (
                  <div className="flex items-center justify-center h-80 text-muted-foreground">
                    No retention data available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Summary card */}
                    <div className="md:col-span-1 space-y-4">
                      <h3 className="font-medium">Retention Summary</h3>
                      
                      <div className="border rounded-lg p-4 space-y-3">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Customers</div>
                          <div className="text-2xl font-bold">{retentionData.summary.total_customers}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Repeat Customers</div>
                          <div className="text-2xl font-bold">{retentionData.summary.repeat_customers}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Repeat Rate</div>
                          <div className="text-2xl font-bold">
                            {retentionData.summary.total_customers > 0 
                              ? ((retentionData.summary.repeat_customers / retentionData.summary.total_customers) * 100).toFixed(1) 
                              : 0}%
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-muted-foreground">Avg. Orders Per Customer</div>
                          <div className="text-2xl font-bold">{retentionData.summary.avg_orders_per_customer?.toFixed(1) || "0"}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chart for cohort retention */}
                    <div className="md:col-span-2">
                      <h3 className="font-medium mb-4">Cohort Retention Rates</h3>
                      {cohortChartData.length === 0 ? (
                        <div className="flex items-center justify-center h-60 border rounded-lg text-muted-foreground">
                          No cohort data available
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={cohortChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="30 Days" fill="#8884d8" />
                            <Bar dataKey="60 Days" fill="#82ca9d" />
                            <Bar dataKey="90 Days" fill="#ffc658" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}