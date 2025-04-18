import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import OrderPage from "@/pages/order-page";
import OrdersPage from "@/pages/orders-page";
import VehiclesPage from "@/pages/vehicles-page";
import AccountPage from "@/pages/account-page";
import PaymentMethodsPage from "@/pages/payment-methods-page";
import SubscriptionPage from "@/pages/subscription-page";
import SubscriptionSuccessPage from "@/pages/subscription-success";
import { ProtectedRoute } from "./lib/protected-route";
import TabBar from "./components/layout/TabBar";
import { useAuth, AuthProvider } from "./hooks/use-auth";

function AppRouter() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Switch>
        <Route path="/auth" component={AuthPage}/>
        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/order" component={OrderPage} />
        <ProtectedRoute path="/orders" component={OrdersPage} />
        <ProtectedRoute path="/vehicles" component={VehiclesPage} />
        <ProtectedRoute path="/account" component={AccountPage} />
        <ProtectedRoute path="/payment-methods" component={PaymentMethodsPage} />
        <ProtectedRoute path="/subscription" component={SubscriptionPage} />
        <ProtectedRoute path="/subscription-success" component={SubscriptionSuccessPage} />
        <Route component={NotFound} />
      </Switch>
      
      {user && <TabBar />}
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
