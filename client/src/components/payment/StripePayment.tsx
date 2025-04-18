import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import PaymentForm from "./PaymentForm";

// Get publishable key from env (or use placeholder for now)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || "pk_test_placeholder"
);

interface StripePaymentProps {
  amount: number;
  orderId: number;
  onPaymentSuccess: () => void;
}

export default function StripePayment({ 
  amount, 
  orderId, 
  onPaymentSuccess 
}: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount,
          orderId
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setClientSecret(data.clientSecret);
        } else {
          setError(data.message || "Something went wrong with the payment service.");
        }
      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError("Failed to connect to payment service. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, orderId]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0A2540',
      colorBackground: '#ffffff',
      colorText: '#1A1A1A'
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Setting up payment...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            <p>{error}</p>
            <p className="text-sm mt-2">
              Please try again later or contact customer support.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
      </CardHeader>
      <CardContent>
        {clientSecret && (
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret, 
              appearance: appearance as any
            }}
          >
            <PaymentForm 
              amount={amount} 
              orderId={orderId} 
              onPaymentSuccess={onPaymentSuccess} 
            />
          </Elements>
        )}
      </CardContent>
    </Card>
  );
}