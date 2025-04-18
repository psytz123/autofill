import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Search, UserCircle, Car, CreditCard, MapPin, History, LifeBuoy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Types for customer management
interface Customer {
  id: number;
  username: string;
  name: string;
  order_count: number;
  total_spent: number;
  created_at: string;
}

interface CustomerDetail {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  fuelType: string;
}

interface Order {
  id: number;
  status: string;
  totalPrice: number;
  gallons: number;
  fuelType: string;
  createdAt: string;
}

interface PaymentMethod {
  id: number;
  cardType: string;
  lastFour: string;
  expiryDate: string;
  isDefault: boolean;
}

interface Location {
  id: number;
  name: string;
  address: string;
  type: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface SupportRequest {
  id: number;
  type: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface SupportMessage {
  id: number;
  message: string;
  fromAdmin: boolean;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("profile");
  
  // Fetch customers with pagination
  const [page, setPage] = useState(1);
  const limit = 10;
  const offset = (page - 1) * limit;
  
  const {
    data: customers,
    isLoading: isLoadingCustomers,
  } = useQuery({
    queryKey: ["/admin/api/customers", offset, limit],
    queryFn: getQueryFn(),
  });
  
  // Fetch customer details when viewing a specific customer
  const {
    data: customerDetail,
    isLoading: isLoadingDetail,
  } = useQuery({
    queryKey: ["/admin/api/customers", selectedCustomerId],
    queryFn: getQueryFn(),
    enabled: !!selectedCustomerId,
  });
  
  // Fetch customer vehicles
  const {
    data: customerVehicles,
    isLoading: isLoadingVehicles,
  } = useQuery({
    queryKey: ["/admin/api/customers", selectedCustomerId, "vehicles"],
    queryFn: getQueryFn(),
    enabled: !!selectedCustomerId && currentTab === "vehicles",
  });
  
  // Fetch customer orders
  const {
    data: customerOrders,
    isLoading: isLoadingOrders,
  } = useQuery({
    queryKey: ["/admin/api/customers", selectedCustomerId, "orders"],
    queryFn: getQueryFn(),
    enabled: !!selectedCustomerId && currentTab === "orders",
  });
  
  // Fetch customer payment methods
  const {
    data: customerPaymentMethods,
    isLoading: isLoadingPaymentMethods,
  } = useQuery({
    queryKey: ["/admin/api/customers", selectedCustomerId, "payment-methods"],
    queryFn: getQueryFn(),
    enabled: !!selectedCustomerId && currentTab === "payment-methods",
  });
  
  // Fetch customer locations
  const {
    data: customerLocations,
    isLoading: isLoadingLocations,
  } = useQuery({
    queryKey: ["/admin/api/customers", selectedCustomerId, "locations"],
    queryFn: getQueryFn(),
    enabled: !!selectedCustomerId && currentTab === "locations",
  });
  
  // Fetch customer support requests
  const {
    data: customerSupportRequests,
    isLoading: isLoadingSupportRequests,
  } = useQuery({
    queryKey: ["/admin/api/customers", selectedCustomerId, "support-requests"],
    queryFn: getQueryFn(),
    enabled: !!selectedCustomerId && currentTab === "support",
  });
  
  // Fetch support request messages when viewing a support request
  const [selectedSupportRequestId, setSelectedSupportRequestId] = useState<number | null>(null);
  
  const {
    data: supportRequestMessages,
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ["/admin/api/support-requests", selectedSupportRequestId, "messages"],
    queryFn: getQueryFn(),
    enabled: !!selectedSupportRequestId,
  });
  
  const viewCustomerDetails = (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsViewDialogOpen(true);
    setCurrentTab("profile");
  };
  
  const closeDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedCustomerId(null);
    setSelectedSupportRequestId(null);
  };
  
  const viewSupportRequest = (requestId: number) => {
    setSelectedSupportRequestId(requestId);
  };
  
  const filteredCustomers = customers?.filter((customer: Customer) => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <AdminLayout title="Customer Management">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Customers</CardTitle>
            <CardDescription>
              View and manage your customer accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCustomers ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers?.map((customer: Customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.username}</TableCell>
                          <TableCell>{customer.order_count}</TableCell>
                          <TableCell>${customer.total_spent?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => viewCustomerDetails(customer.id)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {filteredCustomers?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No customers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {offset + 1} to {Math.min(offset + limit, filteredCustomers?.length || 0)} of {filteredCustomers?.length || 0} customers
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page => Math.max(1, page - 1))}
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={(page * limit) >= (filteredCustomers?.length || 0)}
                      onClick={() => setPage(page => page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Customer Details Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>
                View and manage customer information
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingDetail ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : customerDetail && (
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid grid-cols-6 mb-8">
                  <TabsTrigger value="profile" className="flex items-center space-x-2">
                    <UserCircle className="h-4 w-4" />
                    <span>Profile</span>
                  </TabsTrigger>
                  <TabsTrigger value="vehicles" className="flex items-center space-x-2">
                    <Car className="h-4 w-4" />
                    <span>Vehicles</span>
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="flex items-center space-x-2">
                    <History className="h-4 w-4" />
                    <span>Orders</span>
                  </TabsTrigger>
                  <TabsTrigger value="payment-methods" className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment</span>
                  </TabsTrigger>
                  <TabsTrigger value="locations" className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Locations</span>
                  </TabsTrigger>
                  <TabsTrigger value="support" className="flex items-center space-x-2">
                    <LifeBuoy className="h-4 w-4" />
                    <span>Support</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Name</h4>
                        <p>{customerDetail.name}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Email</h4>
                        <p>{customerDetail.username}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Phone</h4>
                        <p>{customerDetail.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Member Since</h4>
                        <p>{new Date(customerDetail.createdAt).toLocaleDateString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div className="bg-muted/50 p-4 rounded-md">
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Total Orders</h4>
                        <p className="text-2xl font-bold">{customerDetail.order_count || 0}</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-md">
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Total Spent</h4>
                        <p className="text-2xl font-bold">${customerDetail.total_spent?.toFixed(2) || "0.00"}</p>
                      </div>
                      <div className="bg-muted/50 p-4 rounded-md">
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Lifetime Value</h4>
                        <p className="text-2xl font-bold">${((customerDetail.total_spent || 0) * 1.2).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Vehicles Tab */}
                <TabsContent value="vehicles">
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Vehicles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingVehicles ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Make & Model</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>License Plate</TableHead>
                                <TableHead>Fuel Type</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerVehicles?.map((vehicle: Vehicle) => (
                                <TableRow key={vehicle.id}>
                                  <TableCell className="font-medium">{vehicle.make} {vehicle.model}</TableCell>
                                  <TableCell>{vehicle.year}</TableCell>
                                  <TableCell>{vehicle.licensePlate}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {vehicle.fuelType.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {customerVehicles?.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No vehicles found
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Orders Tab */}
                <TabsContent value="orders">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Order History</CardTitle>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Orders</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent>
                      {isLoadingOrders ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Fuel Type</TableHead>
                                <TableHead>Gallons</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerOrders?.map((order: Order) => (
                                <TableRow key={order.id}>
                                  <TableCell>#{order.id}</TableCell>
                                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell>{order.fuelType.replace('_', ' ')}</TableCell>
                                  <TableCell>{order.gallons}</TableCell>
                                  <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        order.status === 'COMPLETED'
                                          ? 'success'
                                          : order.status === 'IN_PROGRESS'
                                          ? 'default'
                                          : 'destructive'
                                      }
                                    >
                                      {order.status.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {customerOrders?.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No orders found
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Payment Methods Tab */}
                <TabsContent value="payment-methods">
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPaymentMethods ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Card Type</TableHead>
                                <TableHead>Last 4 Digits</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead>Default</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerPaymentMethods?.map((method: PaymentMethod) => (
                                <TableRow key={method.id}>
                                  <TableCell className="font-medium">{method.cardType}</TableCell>
                                  <TableCell>•••• {method.lastFour}</TableCell>
                                  <TableCell>{method.expiryDate}</TableCell>
                                  <TableCell>
                                    {method.isDefault && (
                                      <Badge>Default</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {customerPaymentMethods?.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No payment methods found
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Locations Tab */}
                <TabsContent value="locations">
                  <Card>
                    <CardHeader>
                      <CardTitle>Saved Locations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingLocations ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Coordinates</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerLocations?.map((location: Location) => (
                                <TableRow key={location.id}>
                                  <TableCell className="font-medium">{location.name}</TableCell>
                                  <TableCell>{location.address}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {location.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {customerLocations?.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No saved locations found
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Support Tab */}
                <TabsContent value="support">
                  <Card>
                    <CardHeader>
                      <CardTitle>Support Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingSupportRequests ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : selectedSupportRequestId ? (
                        // Support request conversation view
                        <div className="space-y-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setSelectedSupportRequestId(null)}
                          >
                            Back to Requests
                          </Button>
                          
                          {isLoadingMessages ? (
                            <div className="flex justify-center p-8">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {supportRequestMessages?.map((message: SupportMessage) => (
                                <div 
                                  key={message.id}
                                  className={`p-4 rounded-lg ${
                                    message.fromAdmin
                                      ? "bg-primary text-primary-foreground ml-12"
                                      : "bg-muted mr-12"
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold">
                                      {message.fromAdmin ? "Support Agent" : "Customer"}
                                    </span>
                                    <span className="text-xs">
                                      {new Date(message.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p>{message.message}</p>
                                </div>
                              ))}
                              
                              {(!supportRequestMessages || supportRequestMessages.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground">
                                  No messages in this support request
                                </div>
                              )}
                              
                              <div className="flex gap-2 pt-4">
                                <Input placeholder="Type your response..." />
                                <Button>Send</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Support requests list view
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customerSupportRequests?.map((request: SupportRequest) => (
                                <TableRow key={request.id}>
                                  <TableCell>#{request.id}</TableCell>
                                  <TableCell>{request.type}</TableCell>
                                  <TableCell className="font-medium">{request.subject}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        request.status === 'RESOLVED' || request.status === 'CLOSED'
                                          ? 'success'
                                          : request.status === 'IN_PROGRESS'
                                          ? 'default'
                                          : 'secondary'
                                      }
                                    >
                                      {request.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => viewSupportRequest(request.id)}
                                    >
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {customerSupportRequests?.length === 0 && (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No support requests found
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}