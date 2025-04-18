import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, User, Mail, Phone, Car, CreditCard, MapPin, Clock, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface Customer {
  id: number;
  username: string;
  name: string;
  order_count: number;
  total_spent: number;
  created_at: string;
}

interface CustomerDetails {
  customer: any;
  vehicles: any[];
  orders: any[];
  paymentMethods: any[];
  locations: any[];
}

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Fetch customers
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['/admin/api/customers'],
    queryFn: getQueryFn({ on401: "throw" })
  });
  
  // Fetch customer details when selected
  const { 
    data: customerDetails, 
    isLoading: isLoadingDetails 
  } = useQuery<CustomerDetails>({
    queryKey: ['/admin/api/customers', selectedCustomerId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!selectedCustomerId,
  });
  
  // Filter customers based on search query
  const filteredCustomers = searchQuery 
    ? customers.filter(customer => 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;
  
  return (
    <AdminLayout title="Customer Management">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Customers</h2>
          <div className="flex items-center relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              className="pl-8 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Card>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Join Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No customers match your search." : "No customers found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.username}</TableCell>
                        <TableCell>{customer.order_count}</TableCell>
                        <TableCell>${customer.total_spent?.toFixed(2) || "0.00"}</TableCell>
                        <TableCell>{format(new Date(customer.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomerId(customer.id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          )}
        </Card>
      </div>
      
      {/* Customer Detail Dialog */}
      <Dialog 
        open={selectedCustomerId !== null} 
        onOpenChange={(open) => {
          if (!open) setSelectedCustomerId(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {isLoadingDetails || !customerDetails ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">Customer Profile</DialogTitle>
                <DialogDescription>
                  Detailed information about this customer.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                {/* Customer Info */}
                <Card className="md:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{customerDetails.customer.name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Username</p>
                          <p className="font-medium">{customerDetails.customer.username}</p>
                        </div>
                      </div>
                      
                      {customerDetails.customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{customerDetails.customer.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {customerDetails.customer.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="font-medium">{customerDetails.customer.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Member Since</p>
                          <p className="font-medium">
                            {format(new Date(customerDetails.customer.createdAt), "MMMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Tabs for different customer data */}
                <div className="md:col-span-2">
                  <Tabs defaultValue="orders">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="orders" className="flex-1">
                        Orders ({customerDetails.orders.length})
                      </TabsTrigger>
                      <TabsTrigger value="vehicles" className="flex-1">
                        Vehicles ({customerDetails.vehicles.length})
                      </TabsTrigger>
                      <TabsTrigger value="locations" className="flex-1">
                        Locations ({customerDetails.locations.length})
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="orders">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Order History</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {customerDetails.orders.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground">
                              This customer hasn't placed any orders yet.
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Fuel Type</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customerDetails.orders.map((order) => (
                                  <TableRow key={order.id}>
                                    <TableCell className="font-medium">#{order.id}</TableCell>
                                    <TableCell>{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell>
                                      <Badge 
                                        className={
                                          order.status === "COMPLETED" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                                          order.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" :
                                          "bg-red-100 text-red-800 hover:bg-red-100"
                                        }
                                      >
                                        {order.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{order.fuelType}</TableCell>
                                    <TableCell>{order.gallons?.toFixed(2) || 0} gal</TableCell>
                                    <TableCell>${order.totalPrice?.toFixed(2) || "0.00"}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="vehicles">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Registered Vehicles</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {customerDetails.vehicles.length === 0 ? (
                            <div className="text-center text-muted-foreground">
                              This customer hasn't registered any vehicles yet.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {customerDetails.vehicles.map((vehicle) => (
                                <div key={vehicle.id} className="border rounded-lg p-4">
                                  <div className="flex items-center gap-2">
                                    <Car className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-semibold">
                                      {vehicle.make} {vehicle.model} ({vehicle.year})
                                    </span>
                                  </div>
                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Fuel Type:</span>{" "}
                                      {vehicle.fuelType}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Tank Capacity:</span>{" "}
                                      {vehicle.tankCapacity} gallons
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Color:</span>{" "}
                                      {vehicle.color}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">License Plate:</span>{" "}
                                      {vehicle.licensePlate}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="locations">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Saved Delivery Locations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {customerDetails.locations.length === 0 ? (
                            <div className="text-center text-muted-foreground">
                              This customer hasn't saved any delivery locations yet.
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {customerDetails.locations.map((location) => (
                                <div key={location.id} className="border rounded-lg p-4">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-muted-foreground" />
                                    <span className="font-semibold">
                                      {location.nickname || location.type}
                                    </span>
                                  </div>
                                  <div className="mt-2">
                                    <span className="text-muted-foreground">Address:</span>{" "}
                                    {location.address}
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    Coordinates: {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}