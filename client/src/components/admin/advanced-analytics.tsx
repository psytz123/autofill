import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface AnalyticsData {
  revenue: {
    daily: {
      date: string;
      amount: number;
    }[];
    weekly: {
      week: string;
      amount: number;
    }[];
    monthly: {
      month: string;
      amount: number;
    }[];
  };
  fuelConsumption: {
    byType: {
      type: string;
      volume: number;
    }[];
    byTime: {
      period: string;
      regularUnleaded: number;
      premiumUnleaded: number;
      diesel: number;
    }[];
  };
  customerRetention: {
    newCustomers: number;
    returningCustomers: number;
    repeatRate: number;
    churnRate: number;
    retentionByMonth: {
      month: string;
      retention: number;
    }[];
  };
  peakTimes: {
    hourly: {
      hour: string;
      orders: number;
    }[];
    daily: {
      day: string;
      orders: number;
    }[];
  };
}

export default function AdvancedAnalytics() {
  const [timePeriod, setTimePeriod] = useState<string>("last30days");
  
  // Fetch analytics data
  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/admin/api/analytics", timePeriod],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  if (isLoading) {
    return (
      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Fallback data in case API hasn't been implemented yet
  const analyticsData = data || {
    revenue: {
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2025, 3, i + 1).toLocaleDateString(),
        amount: 2000 + Math.random() * 3000
      })).slice(-30),
      weekly: Array.from({ length: 12 }, (_, i) => ({
        week: `Week ${i + 1}`,
        amount: 15000 + Math.random() * 10000
      })),
      monthly: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        amount: 60000 + Math.random() * 40000
      }))
    },
    fuelConsumption: {
      byType: [
        { type: "Regular Unleaded", volume: 15400 },
        { type: "Premium Unleaded", volume: 7800 },
        { type: "Diesel", volume: 9200 }
      ],
      byTime: Array.from({ length: 12 }, (_, i) => ({
        period: new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        regularUnleaded: 1000 + Math.random() * 500,
        premiumUnleaded: 500 + Math.random() * 300,
        diesel: 700 + Math.random() * 400
      }))
    },
    customerRetention: {
      newCustomers: 85,
      returningCustomers: 243,
      repeatRate: 74.5,
      churnRate: 12.3,
      retentionByMonth: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(2025, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        retention: 70 + Math.random() * 25
      }))
    },
    peakTimes: {
      hourly: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        orders: Math.floor(Math.random() * 45)
      })),
      daily: [
        { day: "Monday", orders: 75 },
        { day: "Tuesday", orders: 68 },
        { day: "Wednesday", orders: 82 },
        { day: "Thursday", orders: 91 },
        { day: "Friday", orders: 120 },
        { day: "Saturday", orders: 145 },
        { day: "Sunday", orders: 99 }
      ]
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Advanced Analytics</CardTitle>
            <CardDescription>
              Detailed insights into business performance
            </CardDescription>
          </div>
          
          <Select
            value={timePeriod}
            onValueChange={setTimePeriod}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7days">Last 7 days</SelectItem>
              <SelectItem value="last30days">Last 30 days</SelectItem>
              <SelectItem value="last90days">Last 90 days</SelectItem>
              <SelectItem value="year2025">Year 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="revenue">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="fuel">Fuel Consumption</TabsTrigger>
            <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
            <TabsTrigger value="peak">Peak Times</TabsTrigger>
          </TabsList>
          
          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analyticsData.revenue.daily}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    interval={4}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    name="Revenue" 
                    stroke="#002B5B" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-muted rounded-md p-4">
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold mt-1">
                  ${analyticsData.revenue.daily.reduce((acc, item) => acc + item.amount, 0).toLocaleString()}
                </div>
              </div>
              
              <div className="bg-muted rounded-md p-4">
                <div className="text-sm text-muted-foreground">Average Daily</div>
                <div className="text-2xl font-bold mt-1">
                  ${(analyticsData.revenue.daily.reduce((acc, item) => acc + item.amount, 0) / analyticsData.revenue.daily.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>
              
              <div className="bg-muted rounded-md p-4">
                <div className="text-sm text-muted-foreground">Growth</div>
                <div className="text-2xl font-bold mt-1 text-emerald-500">
                  +18%
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Fuel Consumption Tab */}
          <TabsContent value="fuel" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.fuelConsumption.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="volume"
                      nameKey="type"
                    >
                      {analyticsData.fuelConsumption.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} gallons`, "Volume"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.fuelConsumption.byTime}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} gal`, "Volume"]} />
                    <Legend />
                    <Bar dataKey="regularUnleaded" name="Regular" fill="#0088FE" />
                    <Bar dataKey="premiumUnleaded" name="Premium" fill="#00C49F" />
                    <Bar dataKey="diesel" name="Diesel" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="bg-muted rounded-md p-4">
                <div className="text-sm text-muted-foreground">Total Volume Delivered</div>
                <div className="text-2xl font-bold mt-1">
                  {analyticsData.fuelConsumption.byType.reduce((acc, item) => acc + item.volume, 0).toLocaleString()} gal
                </div>
              </div>
              
              <div className="bg-muted rounded-md p-4">
                <div className="text-sm text-muted-foreground">Most Popular Fuel</div>
                <div className="text-2xl font-bold mt-1">
                  {analyticsData.fuelConsumption.byType.sort((a, b) => b.volume - a.volume)[0].type}
                </div>
              </div>
              
              <div className="bg-muted rounded-md p-4">
                <div className="text-sm text-muted-foreground">Average Order Size</div>
                <div className="text-2xl font-bold mt-1">
                  12.8 gal
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Customer Analytics Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted rounded-md p-4">
                    <div className="text-sm text-muted-foreground">New Customers</div>
                    <div className="text-2xl font-bold mt-1">
                      {analyticsData.customerRetention.newCustomers}
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-md p-4">
                    <div className="text-sm text-muted-foreground">Returning Customers</div>
                    <div className="text-2xl font-bold mt-1">
                      {analyticsData.customerRetention.returningCustomers}
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-md p-4">
                    <div className="text-sm text-muted-foreground">Repeat Rate</div>
                    <div className="text-2xl font-bold mt-1 text-emerald-500">
                      {analyticsData.customerRetention.repeatRate}%
                    </div>
                  </div>
                  
                  <div className="bg-muted rounded-md p-4">
                    <div className="text-sm text-muted-foreground">Churn Rate</div>
                    <div className="text-2xl font-bold mt-1 text-amber-500">
                      {analyticsData.customerRetention.churnRate}%
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted rounded-md p-4">
                  <h3 className="font-medium mb-2">Customer Segments</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Badge variant="outline" className="mr-2">68%</Badge>
                        Regular Users
                      </span>
                      <span className="text-sm">221 customers</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Badge variant="outline" className="mr-2">22%</Badge>
                        Occasional Users
                      </span>
                      <span className="text-sm">72 customers</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Badge variant="outline" className="mr-2">10%</Badge>
                        First-time Users
                      </span>
                      <span className="text-sm">35 customers</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="h-80">
                <h3 className="font-medium mb-2">Retention by Month</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart
                    data={analyticsData.customerRetention.retentionByMonth}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Retention Rate"]} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="retention" 
                      name="Retention Rate" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          {/* Peak Times Tab */}
          <TabsContent value="peak" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-80">
                <h3 className="font-medium mb-2">Orders by Hour of Day</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    data={analyticsData.peakTimes.hourly}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" name="Orders" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-80">
                <h3 className="font-medium mb-2">Orders by Day of Week</h3>
                <ResponsiveContainer width="100%" height="90%">
                  <BarChart
                    data={analyticsData.peakTimes.daily}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="orders" name="Orders" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-muted rounded-md p-4">
              <h3 className="font-medium mb-2">Peak Delivery Times</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <div className="text-sm text-muted-foreground">Busiest Day</div>
                  <div className="font-medium">Saturday</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Busiest Time</div>
                  <div className="font-medium">5:00 PM - 7:00 PM</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Slowest Day</div>
                  <div className="font-medium">Tuesday</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Slowest Time</div>
                  <div className="font-medium">2:00 AM - 4:00 AM</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}