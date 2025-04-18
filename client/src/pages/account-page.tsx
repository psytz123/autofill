import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PaymentMethodCard from "@/components/payment/PaymentMethodCard";
import AddPaymentMethodForm from "@/components/payment/AddPaymentMethodForm";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function AccountPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [addingPayment, setAddingPayment] = useState(false);
  
  const { data: paymentMethods = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
      toast({
        title: "Payment method deleted",
        description: "Your payment method has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete payment method",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <div className="h-screen-minus-tab overflow-y-auto">
      <header className="bg-white shadow-sm">
        <div className="px-4 py-6">
          <h1 className="text-2xl font-bold font-heading text-neutral-800">My Account</h1>
        </div>
      </header>
      
      <div className="p-4">
        {/* Profile Section */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mr-4">
                <span className="text-xl font-medium text-neutral-500">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-lg">{user?.name || 'User'}</h2>
                <p className="text-neutral-500">{user?.username || 'user@example.com'}</p>
              </div>
            </div>
            
            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>
        
        {/* Payment Methods */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="font-semibold text-lg mb-3">Payment Methods</h2>
            
            {paymentsLoading ? (
              <div className="text-center py-4">
                <p className="text-neutral-500">Loading payment methods...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-neutral-500 mb-3">You don't have any payment methods yet</p>
              </div>
            ) : (
              <div className="space-y-3 mb-3">
                {paymentMethods.map(method => (
                  <PaymentMethodCard
                    key={method.id}
                    paymentMethod={method}
                    onDelete={() => deletePaymentMutation.mutate(method.id)}
                  />
                ))}
              </div>
            )}
            
            <Dialog open={addingPayment} onOpenChange={setAddingPayment}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Enter your card details to add a new payment method.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input placeholder="1234 5678 9012 3456" {...field} />
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
                              <Input placeholder="MM/YY" {...field} />
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
                              <Input placeholder="123" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setAddingPayment(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addPaymentMutation.isPending}>
                        {addPaymentMutation.isPending ? "Adding..." : "Add Payment Method"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
        
        {/* Settings List */}
        <Card className="mb-4">
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              <Button variant="ghost" className="p-4 w-full flex items-center justify-between">
                <span className="font-medium">Notifications</span>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </Button>
              
              <Button variant="ghost" className="p-4 w-full flex items-center justify-between">
                <span className="font-medium">Privacy Settings</span>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </Button>
              
              <Button variant="ghost" className="p-4 w-full flex items-center justify-between">
                <span className="font-medium">Help & Support</span>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </Button>
              
              <Button variant="ghost" className="p-4 w-full flex items-center justify-between">
                <span className="font-medium">About</span>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Button 
          variant="ghost" 
          className="w-full py-3 text-destructive font-medium"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Logging out..." : "Log Out"}
        </Button>
      </div>
    </div>
  );
}
