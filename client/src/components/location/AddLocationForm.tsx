import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Home, Briefcase, MapPin } from "lucide-react";
import { LocationType, insertLocationSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const locationFormSchema = insertLocationSchema.extend({
  address: z.string().min(5, "Address is too short"),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface AddLocationFormProps {
  onSuccess?: () => void;
  initialData?: LocationFormValues;
}

export default function AddLocationForm({ onSuccess, initialData }: AddLocationFormProps) {
  const { toast } = useToast();
  const [mapCoordinates, setMapCoordinates] = useState<{ lat: number; lng: number } | null>(
    initialData?.coordinates ? JSON.parse(initialData.coordinates as string) : null
  );

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: initialData || {
      name: "",
      address: "",
      type: LocationType.HOME,
      coordinates: "",
    },
  });

  const addLocationMutation = useMutation({
    mutationFn: async (data: LocationFormValues) => {
      // Ensure coordinates are in the correct format
      const formattedData = {
        ...data,
        coordinates: JSON.stringify(mapCoordinates || { lat: 0, lng: 0 }),
      };
      const res = await apiRequest("POST", "/api/locations", formattedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      toast({
        title: "Location added",
        description: "Your new location has been saved",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
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
                <Card className={`flex-1 cursor-pointer ${field.value === LocationType.HOME ? 'border-primary' : ''}`}>
                  <CardContent className="p-3 flex flex-col items-center justify-center" onClick={() => field.onChange(LocationType.HOME)}>
                    <RadioGroupItem value={LocationType.HOME} id="home" className="sr-only" />
                    <Home className="h-5 w-5 mb-1 text-primary" />
                    <label htmlFor="home" className="text-sm font-medium cursor-pointer">
                      Home
                    </label>
                  </CardContent>
                </Card>
                <Card className={`flex-1 cursor-pointer ${field.value === LocationType.WORK ? 'border-primary' : ''}`}>
                  <CardContent className="p-3 flex flex-col items-center justify-center" onClick={() => field.onChange(LocationType.WORK)}>
                    <RadioGroupItem value={LocationType.WORK} id="work" className="sr-only" />
                    <Briefcase className="h-5 w-5 mb-1 text-primary" />
                    <label htmlFor="work" className="text-sm font-medium cursor-pointer">
                      Work
                    </label>
                  </CardContent>
                </Card>
                <Card className={`flex-1 cursor-pointer ${field.value === LocationType.OTHER ? 'border-primary' : ''}`}>
                  <CardContent className="p-3 flex flex-col items-center justify-center" onClick={() => field.onChange(LocationType.OTHER)}>
                    <RadioGroupItem value={LocationType.OTHER} id="other" className="sr-only" />
                    <MapPin className="h-5 w-5 mb-1 text-primary" />
                    <label htmlFor="other" className="text-sm font-medium cursor-pointer">
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
                <Input placeholder="123 Main St, City, State" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Map Placeholder */}
        <Card className="w-full h-40 bg-neutral-100 flex items-center justify-center">
          <div className="text-center text-neutral-500">
            <MapPin className="h-6 w-6 mx-auto mb-1" />
            <p className="text-sm">Map view will be shown here</p>
            <p className="text-xs">Tap to select precise location</p>
          </div>
        </Card>

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