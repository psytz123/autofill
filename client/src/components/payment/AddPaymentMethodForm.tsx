import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

const paymentFormSchema = z.object({
  cardNumber: z.string()
    .min(16, "Card number must be at least 16 digits")
    .max(19, "Card number must be no more than 19 digits")
    .regex(/^\d+$/, "Card number must contain only digits"),
  cardholderName: z.string().min(1, "Cardholder name is required"),
  expiryDate: z.string()
    .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Expiry date must be in MM/YY format"),
  cvv: z.string()
    .min(3, "CVV must be at least 3 digits")
    .max(4, "CVV must be no more than 4 digits")
    .regex(/^\d+$/, "CVV must contain only digits"),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface AddPaymentMethodFormProps {
  onSuccess?: () => void;
}

export default function AddPaymentMethodForm({ onSuccess }: AddPaymentMethodFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: "",
      cardholderName: "",
      expiryDate: "",
      cvv: "",
    },
  });
  
  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormValues) => {
      const res = await apiRequest("POST", "/api/payment-methods", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment method added",
        description: "Your new payment method has been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add payment method",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: PaymentFormValues) => {
    setIsSubmitting(true);
    addPaymentMutation.mutate(data);
    setIsSubmitting(false);
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
                  placeholder="4242 4242 4242 4242" 
                  {...field} 
                  maxLength={19}
                  onChange={(e) => {
                    // Format card number with spaces
                    const value = e.target.value.replace(/\s/g, '');
                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                    field.onChange(formatted);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cardholderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cardholder Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="MM/YY" 
                    {...field} 
                    maxLength={5}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 2) {
                        value = value.slice(0, 2) + '/' + value.slice(2, 4);
                      }
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CVV</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="123" 
                    type="password" 
                    {...field}
                    maxLength={4} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || addPaymentMutation.isPending}
        >
          {(isSubmitting || addPaymentMutation.isPending) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Add Payment Method"
          )}
        </Button>
      </form>
    </Form>
  );
}