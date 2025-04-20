import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

// Expanded vehicle makes and models
const makes = [
  "Acura",
  "Alfa Romeo",
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Bugatti",
  "Buick",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "Genesis",
  "GMC",
  "Honda",
  "Hyundai",
  "Infiniti",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Lexus",
  "Lincoln",
  "Maserati",
  "Mazda",
  "McLaren",
  "Mercedes",
  "Mini",
  "Mitsubishi",
  "Nissan",
  "Porsche",
  "Ram",
  "Rivian",
  "Rolls-Royce",
  "Subaru",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo",
];

const models = {
  Acura: ["ILX", "MDX", "NSX", "RDX", "TLX", "Integra"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "4C"],
  "Aston Martin": ["DB11", "DBX", "Vantage", "DBS Superleggera"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron", "R8", "TT", "RS6"],
  Bentley: ["Bentayga", "Continental GT", "Flying Spur"],
  BMW: ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "X1", "X3", "X5", "X7", "Z4", "i4", "i7", "iX"],
  Bugatti: ["Chiron", "Veyron"],
  Buick: ["Enclave", "Encore", "Envision"],
  Cadillac: ["CT4", "CT5", "Escalade", "XT4", "XT5", "XT6", "LYRIQ"],
  Chevrolet: ["Blazer", "Bolt", "Camaro", "Colorado", "Corvette", "Equinox", "Malibu", "Silverado", "Suburban", "Tahoe", "Trailblazer", "Traverse"],
  Chrysler: ["300", "Pacifica"],
  Dodge: ["Challenger", "Charger", "Durango", "Hornet"],
  Ferrari: ["296 GTB", "812", "F8", "Portofino", "Roma", "SF90"],
  Fiat: ["500", "500X"],
  Ford: ["Bronco", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "Maverick", "Mustang", "Ranger", "Transit"],
  Genesis: ["G70", "G80", "G90", "GV70", "GV80"],
  GMC: ["Acadia", "Canyon", "Sierra", "Terrain", "Yukon"],
  Honda: ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Pilot", "Ridgeline"],
  Hyundai: ["Elantra", "Ioniq", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson", "Venue"],
  Infiniti: ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  Jaguar: ["E-Pace", "F-Pace", "F-Type", "I-Pace", "XE", "XF"],
  Jeep: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wagoneer", "Wrangler"],
  Kia: ["Carnival", "EV6", "Forte", "K5", "Niro", "Rio", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  Lamborghini: ["Aventador", "Huracan", "Urus"],
  "Land Rover": ["Defender", "Discovery", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  Lexus: ["ES", "IS", "LC", "LS", "LX", "NX", "RX", "UX"],
  Lincoln: ["Aviator", "Corsair", "Nautilus", "Navigator"],
  Maserati: ["Ghibli", "Grecale", "Levante", "MC20", "Quattroporte"],
  Mazda: ["CX-30", "CX-5", "CX-9", "CX-90", "Mazda3", "Mazda6", "MX-5 Miata"],
  McLaren: ["720S", "Artura", "GT"],
  Mercedes: ["A-Class", "C-Class", "E-Class", "S-Class", "EQE", "EQS", "GLA", "GLC", "GLE", "GLB", "GLS", "G-Class"],
  Mini: ["Clubman", "Cooper", "Countryman"],
  Mitsubishi: ["Eclipse Cross", "Mirage", "Outlander", "Outlander Sport"],
  Nissan: ["Altima", "Ariya", "Armada", "Frontier", "Kicks", "Leaf", "Maxima", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan", "Versa", "Z"],
  Porsche: ["718", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
  Ram: ["1500", "2500", "3500", "ProMaster"],
  Rivian: ["R1S", "R1T"],
  "Rolls-Royce": ["Cullinan", "Dawn", "Ghost", "Phantom", "Wraith"],
  Subaru: ["Ascent", "BRZ", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "WRX"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  Toyota: ["4Runner", "Avalon", "Camry", "Corolla", "GR86", "Highlander", "Prius", "RAV4", "Sequoia", "Sienna", "Supra", "Tacoma", "Tundra", "Venza"],
  Volkswagen: ["Atlas", "Golf", "ID.4", "Jetta", "Passat", "Taos", "Tiguan"],
  Volvo: ["C40", "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"],
};
// Generate years from 2024 to 1980
const years = Array.from({ length: 45 }, (_, i) => (2024 - i).toString());

interface AddVehicleFormProps {
  vehicle?: Vehicle;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function AddVehicleForm({
  vehicle,
  onCancel,
  onSuccess,
}: AddVehicleFormProps) {
  const { toast } = useToast();
  const isEditing = !!vehicle;

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: vehicle?.make || "",
      model: vehicle?.model || "",
      year: vehicle?.year || "",
      fuelType: vehicle?.fuelType || FuelType.REGULAR_UNLEADED,
      licensePlate: vehicle?.licensePlate || "",
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormValues) => {
      const res = await apiRequest("POST", "/api/vehicles", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
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
    mutationFn: async (data: VehicleFormValues & { id: number | string }) => {
      const res = await apiRequest("PATCH", `/api/vehicles/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
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
    if (isEditing && vehicle) {
      updateVehicleMutation.mutate({ ...data, id: vehicle.id.toString() });
    } else {
      createVehicleMutation.mutate(data);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-4">
          {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
        </h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Make" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        <div className="sticky top-0 p-2 bg-white">
                          <input 
                            className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground" 
                            placeholder="Search vehicle make..." 
                            onChange={(e) => {
                              // Find all SelectItem elements
                              const items = document.querySelectorAll('[data-vehicle-make-item]');
                              const searchTerm = e.target.value.toLowerCase();
                              
                              // Hide/show based on search term
                              items.forEach((item) => {
                                const text = item.textContent?.toLowerCase() || '';
                                if (text.includes(searchTerm)) {
                                  (item as HTMLElement).style.display = '';
                                } else {
                                  (item as HTMLElement).style.display = 'none';
                                }
                              });
                            }}
                          />
                        </div>
                        {makes.map((make) => (
                          <SelectItem key={make} value={make} data-vehicle-make-item>
                            {make}
                          </SelectItem>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {form.watch("make") &&
                          models[
                            form.watch("make") as keyof typeof models
                          ]?.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Fuel Type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="REGULAR_UNLEADED">
                          Regular Unleaded
                        </SelectItem>
                        <SelectItem value="PREMIUM_UNLEADED">
                          Premium Unleaded
                        </SelectItem>
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
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createVehicleMutation.isPending ||
                  updateVehicleMutation.isPending
                }
              >
                {createVehicleMutation.isPending ||
                updateVehicleMutation.isPending
                  ? "Saving..."
                  : isEditing
                    ? "Update Vehicle"
                    : "Save Vehicle"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
