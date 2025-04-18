import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import TabBar from "./components/layout/TabBar";
import { useAuth, AuthProvider } from "./hooks/use-auth";
import { AdminAuthProvider } from "./hooks/use-admin-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "@/lib/admin-protected-route";

// Lazily load components for better performance
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const HomePage = lazy(() => import("@/pages/home-page"));
const OrderPage = lazy(() => import("@/pages/order-page"));
const OrdersPage = lazy(() => import("@/pages/orders-page"));
const VehiclesPage = lazy(() => import("@/pages/vehicles-page"));
const AccountPage = lazy(() => import("@/pages/account-page"));
const PaymentMethodsPage = lazy(() => import("@/pages/payment-methods-page"));
const SubscriptionPage = lazy(() => import("@/pages/subscription-page"));
const SubscriptionSuccessPage = lazy(() => import("@/pages/subscription-success"));
const FuelSelectorTest = lazy(() => import("@/pages/fuel-selector-test"));

// Admin pages (these are in a different code-split chunk)
const AdminLoginPage = lazy(() => import("@/pages/admin/admin-login"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/admin-dashboard"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/admin-orders"));
const AdminDriversPage = lazy(() => import("@/pages/admin/admin-drivers"));
const AdminProfilePage = lazy(() => import("@/pages/admin/admin-profile"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function CustomerRouter() {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/auth">
            {() => <AuthPage />}
          </Route>
          <ProtectedRoute path="/" component={HomePage} />
          <ProtectedRoute path="/order" component={OrderPage} />
          <ProtectedRoute path="/orders" component={OrdersPage} />
          <ProtectedRoute path="/vehicles" component={VehiclesPage} />
          <ProtectedRoute path="/account" component={AccountPage} />
          <ProtectedRoute path="/payment-methods" component={PaymentMethodsPage} />
          <ProtectedRoute path="/subscription" component={SubscriptionPage} />
          <ProtectedRoute path="/subscription-success" component={SubscriptionSuccessPage} />
          <Route path="/fuel-selector-test">
            {() => <FuelSelectorTest />}
          </Route>
        </Switch>
      </Suspense>
      
      {user && <TabBar />}
    </div>
  );
}

function AdminRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/admin/login">
          {() => <AdminLoginPage />}
        </Route>
        <AdminProtectedRoute path="/admin/dashboard" component={AdminDashboardPage} />
        <AdminProtectedRoute path="/admin/orders" component={AdminOrdersPage} />
        <AdminProtectedRoute path="/admin/drivers" component={AdminDriversPage} />
        <AdminProtectedRoute path="/admin/profile" component={AdminProfilePage} />
        <Route path="/admin/settings">
          {() => {
            window.location.href = "/admin/profile";
            return null;
          }}
        </Route>
        <Route path="/admin/*">
          {() => {
            window.location.href = "/admin/dashboard";
            return null;
          }}
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppRouter() {
  const { user } = useAuth();
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/admin/*">
          <AdminRouter />
        </Route>
        <Route path="/*">
          <CustomerRouter />
        </Route>
        <Route path="*">
          {() => <NotFound />}
        </Route>
      </Switch>
    </Suspense>
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
