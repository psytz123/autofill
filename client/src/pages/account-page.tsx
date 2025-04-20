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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { useLocation } from "wouter";

export default function AccountPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [addingPayment, setAddingPayment] = useState(false);
  const [, setLocation] = useLocation();

  const { data: paymentMethods = [], isLoading: paymentsLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/payment-methods"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/payment-methods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
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
    <div className="h-screen-minus-tab overflow-y-auto flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="px-4 py-5 flex items-center">
          <Logo size="sm" className="mr-3" />
          <div>
            <h1 className="text-2xl font-bold autofill-navy">My Account</h1>
            <p className="text-sm text-neutral-500">
              Manage your profile and settings
            </p>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Profile Section */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mr-4">
                <span className="text-xl font-medium text-neutral-500">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-lg">
                  {user?.name || "User"}
                </h2>
                <p className="text-neutral-500">
                  {user?.username || "user@example.com"}
                </p>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <h2 className="font-semibold text-lg mb-3">Subscription</h2>

            <div className="rounded-lg border border-dashed border-autofill-orange p-4 mb-4">
              <h3 className="text-md font-medium text-autofill-orange mb-1">
                Save with AutoFill Subscriptions
              </h3>
              <p className="text-sm text-neutral-600 mb-3">
                Subscribe to a plan and save up to 20% on every fuel delivery!
              </p>
              <Button
                variant="default"
                className="w-full bg-autofill-orange hover:bg-autofill-orange/90"
                onClick={() => setLocation("/subscription")}
              >
                View Plans
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">Payment Methods</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-autofill-navy"
                onClick={() => setLocation("/payment-methods")}
              >
                View All
              </Button>
            </div>

            {paymentsLoading ? (
              <div className="text-center py-4">
                <p className="text-neutral-500">Loading payment methods...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-neutral-500 mb-3">
                  You don't have any payment methods yet
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/payment-methods")}
                >
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-3">
                  {/* Show only the first payment method on the account page */}
                  {paymentMethods.slice(0, 1).map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      paymentMethod={method}
                      onDelete={() => deletePaymentMutation.mutate(method.id)}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/payment-methods")}
                >
                  Manage Payment Methods
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Settings List */}
        <Card className="mb-4">
          <CardContent className="p-0">
            <div className="divide-y divide-neutral-100">
              <Button
                variant="ghost"
                className="p-4 w-full flex items-center justify-between"
              >
                <span className="font-medium">Notifications</span>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </Button>

              <Button
                variant="ghost"
                className="p-4 w-full flex items-center justify-between"
              >
                <span className="font-medium">Privacy Settings</span>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </Button>

              <Button
                variant="ghost"
                className="p-4 w-full flex items-center justify-between"
              >
                <span className="font-medium">Help & Support</span>
                <ChevronRight className="h-5 w-5 text-neutral-400" />
              </Button>

              <Button
                variant="ghost"
                className="p-4 w-full flex items-center justify-between"
              >
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
