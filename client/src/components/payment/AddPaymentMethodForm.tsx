import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Form validation schema
const paymentMethodSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .refine((val) => /^\d{16}$/.test(val), {
      message: "Card number must be 16 digits",
    }),
  cardHolder: z.string().min(1, "Cardholder name is required"),
  expiryMonth: z
    .string()
    .min(1, "Expiry month is required")
    .refine((val) => /^(0?[1-9]|1[0-2])$/.test(val), {
      message: "Invalid expiry month",
    }),
  expiryYear: z
    .string()
    .min(1, "Expiry year is required")
    .refine((val) => /^\d{4}$/.test(val) && parseInt(val) >= new Date().getFullYear(), {
      message: "Invalid expiry year",
    }),
  cvv: z
    .string()
    .min(1, "CVV is required")
    .refine((val) => /^\d{3,4}$/.test(val), {
      message: "CVV must be 3-4 digits",
    }),
  type: z.enum(["visa", "mastercard", "amex", "discover"], {
    required_error: "Card type is required",
  }),
});

type FormValues = z.infer<typeof paymentMethodSchema>;

interface AddPaymentMethodFormProps {
  onSuccess?: () => void;
}

export default function AddPaymentMethodForm({ onSuccess }: AddPaymentMethodFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      cardNumber: "",
      cardHolder: "",
      expiryMonth: "",
      expiryYear: "",
      cvv: "",
      type: "visa",
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Format expiry as MM/YY
      const expiryMonth = data.expiryMonth.padStart(2, '0');
      const expiryYear = data.expiryYear.slice(2); // Take just the last 2 digits
      const expiry = `${expiryMonth}/${expiryYear}`;
      
      // Get last 4 digits of card number
      const last4 = data.cardNumber.slice(-4);
      
      const paymentMethodData = {
        type: data.type,
        last4,
        expiry,
        cardHolder: data.cardHolder,
      };
      
      await apiRequest("POST", "/api/payment-methods", paymentMethodData);
      
      toast({
        title: "Payment method added",
        description: "Your payment method has been saved successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      
      if (onSuccess) {
        onSuccess();
      }
      
      form.reset();
      
    } catch (error: any) {
      toast({
        title: "Failed to add payment method",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Card Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="1234 5678 9012 3456"
                  {...field}
                  onChange={(e) => {
                    // Only allow numbers and format with spaces for readability
                    const value = e.target.value.replace(/\D/g, '');
                    field.onChange(value);
                  }}
                  maxLength={16}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cardHolder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cardholder Name</FormLabel>
              <FormControl>
                <Input placeholder="John Smith" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="expiryMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Month</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">01</SelectItem>
                      <SelectItem value="2">02</SelectItem>
                      <SelectItem value="3">03</SelectItem>
                      <SelectItem value="4">04</SelectItem>
                      <SelectItem value="5">05</SelectItem>
                      <SelectItem value="6">06</SelectItem>
                      <SelectItem value="7">07</SelectItem>
                      <SelectItem value="8">08</SelectItem>
                      <SelectItem value="9">09</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="11">11</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="expiryYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Year</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CVV</FormLabel>
                <FormControl>
                  <Input
                    placeholder="123"
                    {...field}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/\D/g, '');
                      field.onChange(value);
                    }}
                    maxLength={4}
                    type="password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Card Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select card type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">Mastercard</SelectItem>
                    <SelectItem value="amex">American Express</SelectItem>
                    <SelectItem value="discover">Discover</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            "Add Payment Method"
          )}
        </Button>
      </form>
    </Form>
  );
}