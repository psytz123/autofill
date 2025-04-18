import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { PaymentMethod } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, ArrowLeft, CreditCard } from "lucide-react";
import PaymentMethodCard from "@/components/payment/PaymentMethodCard";
import AddPaymentMethodForm from "@/components/payment/AddPaymentMethodForm";
import TabBar from "@/components/layout/TabBar";

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [addingPayment, setAddingPayment] = useState(false);
  
  // Redirect if not authenticated
  if (!user) {
    setLocation('/auth');
    return null;
  }
  
  // Fetch payment methods
  const { 
    data: paymentMethods = [], 
    isLoading: isLoadingPayments,
    error: paymentError
  } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Delete payment method mutation
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/payment-methods/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Payment method deleted",
        description: "Your payment method has been removed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete payment method",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  if (isLoadingPayments) {
    return (
      <div className="container py-6 flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <TabBar />
      </div>
    );
  }
  
  if (paymentError) {
    return (
      <div className="container py-6 flex flex-col min-h-screen">
        <div className="flex-1">
          <div className="mb-4">
            <Button 
              variant="ghost" 
              className="p-0 h-auto" 
              onClick={() => setLocation('/account')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Account
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>Failed to load payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Please try again later.</p>
            </CardContent>
          </Card>
        </div>
        <TabBar />
      </div>
    );
  }
  
  return (
    <div className="container py-6 flex flex-col min-h-screen">
      <div className="flex-1">
        <div className="mb-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            className="p-0 h-auto" 
            onClick={() => setLocation('/account')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Account
          </Button>
          
          <Dialog open={addingPayment} onOpenChange={setAddingPayment}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Enter your card details to add a new payment method.
                </DialogDescription>
              </DialogHeader>
              
              <AddPaymentMethodForm 
                onSuccess={() => {
                  setAddingPayment(false);
                  toast({
                    title: "Payment method added",
                    description: "Your new payment method has been saved",
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Payment Methods</h1>
        
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="p-6 flex flex-col items-center justify-center">
              <div className="bg-muted rounded-full p-3 mb-4">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-center mb-4">You don't have any payment methods yet</p>
              <Button onClick={() => setAddingPayment(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                paymentMethod={method}
                onDelete={(id) => deletePaymentMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
      <TabBar />
    </div>
  );
}