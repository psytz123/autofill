import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Home, Briefcase, MapPin } from "lucide-react";
import {
  LocationType,
  insertLocationSchema,
  Location as LocationModel,
} from "@shared/schema";
import type { Location as LocationFromSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MapView from "./MapView";

// Extend the location schema but adjust the coordinates to match our form needs
const locationFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(5, "Address is too short"),
  type: z.nativeEnum(LocationType),
  userId: z.number().optional(),
  // In the form, coordinates is a string that will be parsed to/from JSON
  coordinatesStr: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface AddLocationFormProps {
  onSuccess?: () => void;
  initialData?: Partial<LocationFormValues>;
}

export default function AddLocationForm({
  onSuccess,
  initialData,
}: AddLocationFormProps) {
  const { toast } = useToast();
  const [mapCoordinates, setMapCoordinates] = useState<{
    lat: number;
    lng: number;
  }>(
    initialData?.coordinatesStr
      ? JSON.parse(initialData.coordinatesStr)
      : { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
  );
  
  // Add a flag to track whether we've already initialized location data from the map
  // This prevents overwriting user edits after initial load
  const hasInitializedLocation = useRef(false);

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      type: initialData?.type || LocationType.HOME,
      coordinatesStr:
        initialData?.coordinatesStr || JSON.stringify(mapCoordinates),
    },
  });

  const addLocationMutation = useMutation({
    mutationFn: async (data: LocationFormValues) => {
      try {
        // First, ensure we have a fresh CSRF token registered with the server
        const { getCsrfToken, initCsrfToken } = await import("@/lib/csrfToken");

        // Refresh CSRF token to ensure it's registered with the server
        await initCsrfToken();

        // Get current form values to ensure we have the latest user input
        const formValues = form.getValues();
        
        // Convert from our form schema to the API schema
        const apiData = {
          // Use the user's entered name, ensuring it takes precedence
          name: formValues.name.trim() || data.name,
          address: data.address,
          type: data.type,
          // Pass the coordinates object directly as expected by the API
          coordinates: mapCoordinates,
        };

        // Make the API request with the CSRF token
        const res = await apiRequest("POST", "/api/locations", apiData, {
          retries: 2, // Add retries for better reliability
        });

        return await res.json();
      } catch (error) {
        console.error("Location creation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Location added",
        description: "Your new location has been saved",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      console.error("Location mutation error:", error);
      toast({
        title: "Failed to add location",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LocationFormValues) => {
    addLocationMutation.mutate(data);
  };

  // Keep a stable reference to initial address to avoid continuous re-rendering
  const [initialAddress, setInitialAddress] = useState<string | undefined>(
    initialData?.address
  );

  // Handle location selection from map
  const handleLocationSelect = (location: any) => {
    // Only update if we haven't initialized yet or if user explicitly changed location on map
    if (location && location.address) {
      if (!hasInitializedLocation.current) {
        console.log("[Location] Initial location set from map");
        
        // Update form fields
        form.setValue("address", location.address);
        
        if (location.coordinates) {
          setMapCoordinates(location.coordinates);
          form.setValue(
            "coordinatesStr",
            JSON.stringify(location.coordinates),
          );
        }
        
        // Only set default name if user hasn't entered one
        const currentName = form.getValues("name");
        if (!currentName || currentName.trim() === "") {
          form.setValue("name", "My Location");
        }
        
        // Set the flag to mark we've initialized
        hasInitializedLocation.current = true;
      } else {
        // For subsequent changes (explicit user interaction with map)
        console.log("[Location] Updated location from map interaction");
        
        // Update coordinates and address directly from user map interaction
        if (location.coordinates) {
          setMapCoordinates(location.coordinates);
          form.setValue(
            "coordinatesStr", 
            JSON.stringify(location.coordinates)
          );
        }
        
        // Only update address if it's actually different to avoid loops
        const currentAddress = form.getValues("address");
        if (location.address !== currentAddress) {
          form.setValue("address", location.address);
        }
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Type</FormLabel>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex space-x-1"
              >
                <Card
                  className={`flex-1 cursor-pointer ${field.value === LocationType.HOME ? "border-primary" : ""}`}
                >
                  <CardContent
                    className="p-3 flex flex-col items-center justify-center"
                    onClick={() => field.onChange(LocationType.HOME)}
                  >
                    <RadioGroupItem
                      value={LocationType.HOME}
                      id="home"
                      className="sr-only"
                    />
                    <Home className="h-5 w-5 mb-1 text-primary" />
                    <label
                      htmlFor="home"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Home
                    </label>
                  </CardContent>
                </Card>
                <Card
                  className={`flex-1 cursor-pointer ${field.value === LocationType.WORK ? "border-primary" : ""}`}
                >
                  <CardContent
                    className="p-3 flex flex-col items-center justify-center"
                    onClick={() => field.onChange(LocationType.WORK)}
                  >
                    <RadioGroupItem
                      value={LocationType.WORK}
                      id="work"
                      className="sr-only"
                    />
                    <Briefcase className="h-5 w-5 mb-1 text-primary" />
                    <label
                      htmlFor="work"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Work
                    </label>
                  </CardContent>
                </Card>
                <Card
                  className={`flex-1 cursor-pointer ${field.value === LocationType.OTHER ? "border-primary" : ""}`}
                >
                  <CardContent
                    className="p-3 flex flex-col items-center justify-center"
                    onClick={() => field.onChange(LocationType.OTHER)}
                  >
                    <RadioGroupItem
                      value={LocationType.OTHER}
                      id="other"
                      className="sr-only"
                    />
                    <MapPin className="h-5 w-5 mb-1 text-primary" />
                    <label
                      htmlFor="other"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Other
                    </label>
                  </CardContent>
                </Card>
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Name</FormLabel>
              <FormControl>
                <Input placeholder="My Home" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input 
                  placeholder="123 Main St, City, State" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    // When user manually changes address, allow geocoding on map
                    if (hasInitializedLocation.current && e.target.value) {
                      if (e.target.value !== initialAddress) {
                        console.log("[Location] Address changed by user input, updating initialAddress");
                        setInitialAddress(e.target.value);
                      }
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Interactive Map */}
        <div className="w-full h-48">
          <MapView
            selectedLocation={
              mapCoordinates
                ? {
                    id: 0,
                    name: form.getValues("name"),
                    address: form.getValues("address"),
                    coordinates: mapCoordinates,
                    type: form.getValues("type") || LocationType.HOME,
                    userId: 0, // Default value to satisfy the type
                    createdAt: new Date()
                  } as LocationFromSchema
                : null
            }
            onLocationSelect={handleLocationSelect}
            initialAddress={initialAddress}
            className="w-full h-full"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onSuccess && onSuccess()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={addLocationMutation.isPending}
          >
            {addLocationMutation.isPending ? "Saving..." : "Save Location"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
