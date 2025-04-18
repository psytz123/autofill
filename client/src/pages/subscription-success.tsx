import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function SubscriptionSuccessPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      setLocation('/auth');
      return;
    }
    
    // Invalidate subscription query to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/user/subscription'] });
  }, [user, setLocation]);
  
  return (
    <div className="container py-16 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Subscription Successful!</CardTitle>
          <CardDescription className="text-center">
            Thank you for subscribing to AutoFill
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Your subscription is now active. You'll enjoy discounted deliveries on all your orders.
          </p>
          <p>
            Your account has been updated with your new subscription status.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => setLocation('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}