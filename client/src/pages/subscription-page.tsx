import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { SubscriptionPlan } from "@shared/schema";
import PlanCard from "@/components/subscription/PlanCard";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Make sure to call loadStripe outside component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function SubscriptionCheckoutForm() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/subscription-success`,
      },
      redirect: "if_required"
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subscription Successful",
        description: "You are now subscribed!",
      });
      // Successful payment without redirect
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscription'] });
      setLocation('/');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {message && <div className="text-destructive text-sm">{message}</div>}
      <Button 
        type="submit" 
        disabled={isProcessing || !stripe || !elements} 
        className="w-full"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Subscribe Now"
        )}
      </Button>
    </form>
  );
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [, setLocation] = useLocation();
  
  // Fetch available subscription plans
  const { 
    data: plans, 
    isLoading: isLoadingPlans, 
    error: plansError 
  } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Fetch user's current subscription
  const { 
    data: userSubscription, 
    isLoading: isLoadingSubscription 
  } = useQuery<SubscriptionPlan | null>({
    queryKey: ['/api/user/subscription'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });
  
  // Create a new subscription
  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest("POST", "/api/create-subscription", { planId });
      return await res.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Cancel subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cancel-subscription");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will be canceled at the end of the billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/subscription'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to cancel subscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!user && !isLoadingSubscription) {
      setLocation('/auth');
    }
  }, [user, isLoadingSubscription, setLocation]);
  
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    createSubscriptionMutation.mutate(plan.id);
  };
  
  const handleCancelSubscription = () => {
    if (confirm("Are you sure you want to cancel your subscription? You will lose your benefits at the end of the current billing period.")) {
      cancelSubscriptionMutation.mutate();
    }
  };
  
  if (isLoadingPlans || isLoadingSubscription) {
    return (
      <div className="container py-10 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (plansError) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please try again later.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation('/')}>Back to Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-2">Subscription Plans</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Choose a subscription plan that works for you. All plans include access to our app features, with different delivery benefits.
        </p>
      </div>
      
      {clientSecret ? (
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Complete Your Subscription</CardTitle>
              <CardDescription>
                You are subscribing to the {selectedPlan?.name} plan for {(selectedPlan?.price || 0) / 100} USD per month.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements 
                stripe={stripePromise} 
                options={{ clientSecret: clientSecret || undefined }}
              >
                <SubscriptionCheckoutForm />
              </Elements>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {userSubscription && (
            <div className="mb-8 p-4 bg-primary/10 rounded-md">
              <h2 className="text-xl font-semibold mb-2">Your Current Subscription</h2>
              <p className="mb-4">
                You are currently subscribed to the <strong>{userSubscription.name}</strong> plan. 
                You save {userSubscription.deliveryDiscount}% on every delivery.
              </p>
              <Button variant="destructive" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans?.map((plan) => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                isActive={userSubscription?.id === plan.id}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}