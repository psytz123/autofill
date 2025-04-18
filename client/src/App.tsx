import { Switch, Route, Redirect } from "wouter";
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
import AdminLoginPage from "@/pages/admin/admin-login";
import AdminDashboardPage from "@/pages/admin/admin-dashboard";
import AdminOrdersPage from "@/pages/admin/admin-orders";
import AdminDriversPage from "@/pages/admin/admin-drivers";
import AdminProfilePage from "@/pages/admin/admin-profile";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "./lib/admin-protected-route";
import TabBar from "./components/layout/TabBar";
import { useAuth, AuthProvider } from "./hooks/use-auth";
import { AdminAuthProvider } from "./hooks/use-admin-auth";

function CustomerRouter() {
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
      </Switch>
      
      {user && <TabBar />}
    </div>
  );
}

function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLoginPage} />
      <AdminProtectedRoute path="/admin/dashboard" component={AdminDashboardPage} />
      <AdminProtectedRoute path="/admin/orders" component={AdminOrdersPage} />
      <AdminProtectedRoute path="/admin/drivers" component={AdminDriversPage} />
      <Route path="/admin/*">
        {() => {
          window.location.href = "/admin/dashboard";
          return null;
        }}
      </Route>
    </Switch>
  );
}

function AppRouter() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/admin/*">
        <AdminRouter />
      </Route>
      <Route path="/*">
        <CustomerRouter />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <AdminAuthProvider>
          <AppRouter />
        </AdminAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
