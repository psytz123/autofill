import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AdminLayout from "@/components/admin/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { AdminDriver } from "@/types/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehicleLicense: z.string().min(1, "License plate is required"),
  isAvailable: z.boolean().default(true),
});

type DriverFormValues = z.infer<typeof driverSchema>;

export default function AdminDriversPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<AdminDriver | null>(null);
  
  // Fetch all drivers
  const { data: drivers = [], isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['/admin/api/drivers'],
    queryFn: getQueryFn({ on401: "throw" }),
    onError: (error) => {
      toast({
        title: "Error loading drivers",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create driver form
  const addForm = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      vehicleModel: "",
      vehicleLicense: "",
      isAvailable: true,
    },
  });
  
  // Edit driver form
  const editForm = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      vehicleModel: "",
      vehicleLicense: "",
      isAvailable: true,
    },
  });
  
  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (data: DriverFormValues) => {
      const res = await apiRequest("POST", "/admin/api/drivers", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/api/drivers'] });
      toast({
        title: "Driver created",
        description: "New driver has been added successfully",
      });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error creating driver",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update driver mutation
  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: DriverFormValues }) => {
      const res = await apiRequest("PUT", `/admin/api/drivers/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/api/drivers'] });
      toast({
        title: "Driver updated",
        description: "Driver information has been updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedDriver(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating driver",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/admin/api/drivers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/api/drivers'] });
      toast({
        title: "Driver deleted",
        description: "Driver has been removed successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedDriver(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting driver",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleEditDriver = (driver: any) => {
    setSelectedDriver(driver);
    editForm.reset({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      vehicleModel: driver.vehicleModel,
      vehicleLicense: driver.vehicleLicense,
      isAvailable: driver.isAvailable,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteDriver = (driver: any) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };
  
  const onAddSubmit = (data: DriverFormValues) => {
    createDriverMutation.mutate(data);
  };
  
  const onEditSubmit = (data: DriverFormValues) => {
    if (selectedDriver) {
      updateDriverMutation.mutate({
        id: selectedDriver.id,
        data,
      });
    }
  };
  
  const confirmDelete = () => {
    if (selectedDriver) {
      deleteDriverMutation.mutate(selectedDriver.id);
    }
  };
  
  return (
    <AdminLayout title="Drivers Management">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Drivers</CardTitle>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-autofill-navy"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Driver
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingDrivers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No drivers found. Add a driver to get started.
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-3 px-4 text-left font-medium">Name</th>
                    <th className="py-3 px-4 text-left font-medium">Contact</th>
                    <th className="py-3 px-4 text-left font-medium">Vehicle</th>
                    <th className="py-3 px-4 text-left font-medium">License Plate</th>
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver: any) => (
                    <tr key={driver.id} className="border-b">
                      <td className="py-3 px-4">{driver.name}</td>
                      <td className="py-3 px-4">
                        <div>{driver.phone}</div>
                        <div className="text-sm text-muted-foreground">{driver.email}</div>
                      </td>
                      <td className="py-3 px-4">{driver.vehicleModel}</td>
                      <td className="py-3 px-4">{driver.vehicleLicense}</td>
                      <td className="py-3 px-4">
                        <Badge className={driver.isAvailable ? 
                          "bg-green-100 text-green-800" : 
                          "bg-gray-100 text-gray-800"
                        }>
                          {driver.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => handleEditDriver(driver)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleDeleteDriver(driver)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Add Driver Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Driver</DialogTitle>
                <DialogDescription>
                  Enter the details for the new driver.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="vehicleModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Model</FormLabel>
                          <FormControl>
                            <Input placeholder="Ford F-150" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="vehicleLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Plate</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC1234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={addForm.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Available for Assignments</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createDriverMutation.isPending}
                    >
                      {createDriverMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Driver"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Driver Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Driver</DialogTitle>
                <DialogDescription>
                  Update the driver's information.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="vehicleModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle Model</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="vehicleLicense"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Plate</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editForm.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Available for Assignments</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateDriverMutation.isPending}
                    >
                      {updateDriverMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Delete Driver Alert Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the driver 
                  {selectedDriver && <strong> {selectedDriver.name}</strong>}.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700"
                  onClick={confirmDelete}
                  disabled={deleteDriverMutation.isPending}
                >
                  {deleteDriverMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}