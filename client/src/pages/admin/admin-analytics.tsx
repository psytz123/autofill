import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, TrendingUp, DollarSign, Calendar, MapPin, Clock, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

// Define types for analytics data
interface RevenueData {
  date: string;
  amount: number;
  growth?: number;
}

interface LocationData {
  id: number;
  address: string;
  count: number;
  percentage: number;
}

interface TimeData {
  hour: number;
  count: number;
}

interface RetentionData {
  month: string;
  newUsers: number;
  returningUsers: number;
  churnRate: number;
}

// Define color constants for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AdminAnalyticsPage() {
  const [timeframe, setTimeframe] = useState("monthly");
  
  // Revenue data query
  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
  } = useQuery({
    queryKey: ["/admin/api/analytics/revenue", timeframe],
    queryFn: getQueryFn(),
  });
  
  // Popular locations query
  const {
    data: locationsData,
    isLoading: isLoadingLocations,
  } = useQuery({
    queryKey: ["/admin/api/analytics/popular-locations"],
    queryFn: getQueryFn(),
  });
  
  // Peak ordering times query
  const {
    data: peakTimesData,
    isLoading: isLoadingPeakTimes,
  } = useQuery({
    queryKey: ["/admin/api/analytics/peak-times"],
    queryFn: getQueryFn(),
  });
  
  // Customer retention metrics query
  const {
    data: retentionData,
    isLoading: isLoadingRetention,
  } = useQuery({
    queryKey: ["/admin/api/analytics/retention"],
    queryFn: getQueryFn(),
  });
  
  // Calculate total revenue
  const calculateTotalRevenue = () => {
    if (!revenueData) return 0;
    return revenueData.reduce((total: number, item: RevenueData) => total + item.amount, 0);
  };
  
  // Calculate average growth
  const calculateAverageGrowth = () => {
    if (!revenueData || revenueData.length < 2) return 0;
    
    const growthValues = revenueData
      .filter((item: RevenueData) => item.growth !== undefined)
      .map((item: RevenueData) => item.growth);
      
    if (growthValues.length === 0) return 0;
    
    const sum = growthValues.reduce((total: number, value: number | undefined) => total + (value || 0), 0);
    return sum / growthValues.length;
  };
  
  // Format dollar amounts
  const formatDollar = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  
  // Format percentages
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  };
  
  // Format time from 24h to 12h format
  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}${ampm}`;
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">{formatDollar(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Location tooltip
  const LocationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded p-2 shadow-md">
          <p className="font-semibold">{payload[0].payload.address}</p>
          <p className="text-primary">{payload[0].value} orders</p>
          <p className="text-muted-foreground">{formatPercent(payload[0].payload.percentage)}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <AdminLayout title="Analytics Dashboard">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Business Analytics</h1>
          <Select 
            value={timeframe} 
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Revenue Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingRevenue ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  formatDollar(calculateTotalRevenue())
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                For selected period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingRevenue ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `${calculateAverageGrowth().toFixed(1)}%`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg. growth per period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Peak Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingPeakTimes ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : peakTimesData && peakTimesData.length > 0 ? (
                  formatHour(peakTimesData.sort((a: TimeData, b: TimeData) => b.count - a.count)[0].hour)
                ) : (
                  "N/A"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Highest order volume
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingRetention ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : retentionData && retentionData.length > 0 ? (
                  `${(retentionData.reduce((sum: number, item: RetentionData) => sum + item.churnRate, 0) / retentionData.length).toFixed(1)}%`
                ) : (
                  "N/A"
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Average customer churn
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="revenue">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="revenue" className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Revenue Trends</span>
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Popular Locations</span>
            </TabsTrigger>
            <TabsTrigger value="times" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Peak Hours</span>
            </TabsTrigger>
            <TabsTrigger value="retention" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>User Retention</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Revenue Trends Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>
                  Revenue analysis over {timeframe} periods
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {isLoadingRevenue ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : revenueData && revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 50,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                        tickMargin={30}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" fill="#FF6B00" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
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
                  Top locations by order volume
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row">
                {isLoadingLocations ? (
                  <div className="flex h-80 w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : locationsData && locationsData.length > 0 ? (
                  <>
                    <div className="w-full lg:w-1/2 h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={locationsData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {locationsData.map((entry: LocationData, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<LocationTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full lg:w-1/2 mt-4 lg:mt-0">
                      <ul className="space-y-2">
                        {locationsData.map((location: LocationData, index: number) => (
                          <li key={location.id} className="flex items-center">
                            <div
                              className="w-4 h-4 mr-2 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <div className="flex-1 truncate" title={location.address}>
                              {location.address}
                            </div>
                            <div className="text-right font-medium">
                              {location.count} orders ({formatPercent(location.percentage)})
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="flex h-80 w-full items-center justify-center text-muted-foreground">
                    No location data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Peak Hours Tab */}
          <TabsContent value="times">
            <Card>
              <CardHeader>
                <CardTitle>Peak Ordering Hours</CardTitle>
                <CardDescription>
                  Order distribution throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoadingPeakTimes ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : peakTimesData && peakTimesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={peakTimesData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="hour" 
                        tickFormatter={formatHour}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => [`${value} orders`, 'Count']}
                        labelFormatter={formatHour}
                      />
                      <Bar dataKey="count" fill="#002B5B" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No peak time data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User Retention Tab */}
          <TabsContent value="retention">
            <Card>
              <CardHeader>
                <CardTitle>Customer Retention Metrics</CardTitle>
                <CardDescription>
                  New vs. returning customers and churn rates
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {isLoadingRetention ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : retentionData && retentionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={retentionData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="newUsers" 
                        stroke="#0088FE" 
                        name="New Users"
                      />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="returningUsers" 
                        stroke="#00C49F" 
                        name="Returning Users"
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="churnRate" 
                        stroke="#FF8042" 
                        name="Churn Rate (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    No retention data available
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