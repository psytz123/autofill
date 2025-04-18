import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FuelType, Vehicle } from "@shared/schema";

// Vehicle form schema
const vehicleSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().min(1, "Year is required"),
  fuelType: z.nativeEnum(FuelType, {
    errorMap: () => ({ message: "Please select a fuel type" }),
  }),
  licensePlate: z.string().min(1, "License plate is required"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

// Mock data for selects
const makes = ["Honda", "Toyota", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi", "Tesla"];
const models = {
  Honda: ["Civic", "Accord", "CR-V", "Pilot", "HR-V"],
  Toyota: ["Camry", "Corolla", "RAV4", "Highlander", "Tacoma"],
  Ford: ["F-150", "Mustang", "Explorer", "Escape", "Fusion"],
  Chevrolet: ["Silverado", "Equinox", "Malibu", "Tahoe", "Trax"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "7 Series"],
  Mercedes: ["C-Class", "E-Class", "S-Class", "GLC", "GLE"],
  Audi: ["A4", "A6", "Q5", "Q7", "e-tron"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
};
const years = Array.from({ length: 25 }, (_, i) => (2023 - i).toString());

interface AddVehicleFormProps {
  vehicle?: Vehicle;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddVehicleForm({ vehicle, onCancel, onSuccess }: AddVehicleFormProps) {
  const { toast } = useToast();
  const isEditing = !!vehicle;
  
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: vehicle?.make || "",
      model: vehicle?.model || "",
      year: vehicle?.year || "",
      fuelType: vehicle?.fuelType || "",
      licensePlate: vehicle?.licensePlate || "",
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      const res = await apiRequest("POST", "/api/vehicles", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Vehicle added",
        description: "Your vehicle has been added successfully",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add vehicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormValues & { id: string }) => {
      const res = await apiRequest("PATCH", `/api/vehicles/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Vehicle updated",
        description: "Your vehicle has been updated successfully",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update vehicle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VehicleFormValues) => {
    if (isEditing) {
      updateVehicleMutation.mutate({ ...data, id: vehicle.id });
    } else {
      createVehicleMutation.mutate(data);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-4">{isEditing ? "Edit Vehicle" : "Add New Vehicle"}</h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Make" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {makes.map(make => (
                          <SelectItem key={make} value={make}>{make}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch("make") && models[form.watch("make") as keyof typeof models]?.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fuelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Fuel Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="REGULAR_UNLEADED">Regular Unleaded</SelectItem>
                        <SelectItem value="PREMIUM_UNLEADED">Premium Unleaded</SelectItem>
                        <SelectItem value="DIESEL">Diesel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Plate</FormLabel>
                  <FormControl>
                    <Input placeholder="ABC-123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending}
              >
                {createVehicleMutation.isPending || updateVehicleMutation.isPending
                  ? "Saving..."
                  : isEditing ? "Update Vehicle" : "Save Vehicle"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
