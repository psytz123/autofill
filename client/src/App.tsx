import { Switch, Route } from "wouter";
import { Suspense, lazy, ComponentType, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import TabBar from "./components/layout/TabBar";
import { useAuth, AuthProvider } from "./hooks/use-auth";
import { AdminAuthProvider } from "./hooks/use-admin-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminProtectedRoute } from "@/lib/admin-protected-route";
import { FuelOptionsProvider } from "@/providers/FuelOptionsProvider";

// Define module chunks with more specific prefetch and dynamic import options
// Create dynamic imports with customized loading priority
const importWithPriority = (path: string, priority: "low" | "high" = "low") => {
  return lazy(() => {
    // Add a small delay for low priority imports to prioritize critical resources
    if (priority === "low") {
      return new Promise<{ default: ComponentType<any> }>((resolve) => {
        // Use requestIdleCallback when browser is idle or setTimeout as fallback
        const requestIdleCallback =
          window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

        requestIdleCallback(() => {
          import(/* @vite-ignore */ path).then(resolve);
        });
      });
    }

    // High priority modules are loaded immediately
    return import(/* @vite-ignore */ path);
  });
};

// Group pages into logical feature bundles
// Core pages (high priority, loaded right away)
const NotFound = lazy(() => import("@/pages/not-found"));
const AuthPage = lazy(() => import("@/pages/auth-page"));
const HomePage = lazy(() => import("@/pages/home-page"));

// Order feature bundle (loaded when needed)
const OrderPage = lazy(() => import("@/pages/order-page"));
const OrderHistoryPage = lazy(() => import("@/pages/orders-page"));

// Vehicle management bundle (lower priority)
const VehiclesPage = lazy(() => import("@/pages/vehicles-page"));

// Account management bundle (lower priority)
const AccountPage = lazy(() => import("@/pages/account-page"));
const PaymentMethodsPage = lazy(() => import("@/pages/payment-methods-page"));

// Subscription feature bundle (lower priority)
const SubscriptionPage = lazy(() => import("@/pages/subscription-page"));
const SubscriptionSuccessPage = lazy(
  () => import("@/pages/subscription-success"),
);

// Testing pages (lowest priority)
const FuelSelectorTest = lazy(() => import("@/pages/fuel-selector-test"));
const EnhancedFuelSelectorTest = lazy(
  () => import("@/pages/enhanced-fuel-selector-test"),
);

// Admin module (completely separate chunk)
const AdminLoginPage = lazy(() => import("@/pages/admin/admin-login"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/admin-dashboard"));
const AdminOrdersPage = lazy(() => import("@/pages/admin/admin-orders"));
const AdminDriversPage = lazy(() => import("@/pages/admin/admin-drivers"));
const AdminProfilePage = lazy(() => import("@/pages/admin/admin-profile"));
const AdminCustomersPage = lazy(() => import("@/pages/admin/admin-customers"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/admin-analytics"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Custom SuspenseRoute for better loading states
const SuspenseRoute = ({
  path,
  component: Component,
  fallback = <PageLoader />,
}: {
  path: string;
  component: ComponentType<any>;
  fallback?: React.ReactNode;
}) => {
  return (
    <Route path={path}>
      {() => (
        <Suspense fallback={fallback}>
          <Component />
        </Suspense>
      )}
    </Route>
  );
};

// Custom ProtectedSuspenseRoute that combines protection and suspense
const ProtectedSuspenseRoute = ({
  path,
  component: Component,
  fallback = <PageLoader />,
}: {
  path: string;
  component: ComponentType<any>;
  fallback?: React.ReactNode;
}) => {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return <PageLoader />;
        }

        if (!user) {
          // Redirect to auth page
          window.location.href = "/auth";
          return null;
        }

        return (
          <Suspense fallback={fallback}>
            <Component />
          </Suspense>
        );
      }}
    </Route>
  );
};

function CustomerRouter() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Switch>
        <SuspenseRoute path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={HomePage} />
        <ProtectedRoute path="/order" component={OrderPage} />
        <ProtectedRoute path="/orders" component={OrderHistoryPage} />
        <ProtectedRoute path="/vehicles" component={VehiclesPage} />
        <ProtectedRoute path="/account" component={AccountPage} />
        <ProtectedRoute
          path="/payment-methods"
          component={PaymentMethodsPage}
        />
        <ProtectedRoute path="/subscription" component={SubscriptionPage} />
        <ProtectedRoute
          path="/subscription-success"
          component={SubscriptionSuccessPage}
        />
        <SuspenseRoute
          path="/fuel-selector-test"
          component={FuelSelectorTest}
        />
        <SuspenseRoute
          path="/enhanced-fuel-selector-test"
          component={EnhancedFuelSelectorTest}
        />
      </Switch>

      {user && <TabBar />}
    </div>
  );
}

// Custom AdminSuspenseRoute that combines admin protection and suspense
const AdminSuspenseRoute = ({
  path,
  component: Component,
  fallback = <PageLoader />,
}: {
  path: string;
  component: ComponentType<any>;
  fallback?: React.ReactNode;
}) => {
  // Similar to ProtectedSuspenseRoute but for admin routes
  return (
    <Route path={path}>
      {() => (
        <Suspense fallback={fallback}>
          <Component />
        </Suspense>
      )}
    </Route>
  );
};

function AdminRouter() {
  return (
    <Switch>
      <SuspenseRoute path="/admin/login" component={AdminLoginPage} />
      <AdminSuspenseRoute
        path="/admin/dashboard"
        component={AdminDashboardPage}
      />
      <AdminSuspenseRoute path="/admin/orders" component={AdminOrdersPage} />
      <AdminSuspenseRoute path="/admin/drivers" component={AdminDriversPage} />
      <AdminSuspenseRoute
        path="/admin/customers"
        component={AdminCustomersPage}
      />
      <AdminSuspenseRoute
        path="/admin/analytics"
        component={AdminAnalyticsPage}
      />
      <AdminSuspenseRoute path="/admin/profile" component={AdminProfilePage} />
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
        <Route path="*">{() => <NotFound />}</Route>
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
          <FuelOptionsProvider>
            <DataPrefetcher>
              <AppRouter />
            </DataPrefetcher>
          </FuelOptionsProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}

// Component to handle prefetching critical data
function DataPrefetcher({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Prefetch critical data on initial load
  useEffect(() => {
    // Import dynamically to avoid circular dependencies
    import("./lib/prefetch").then(({ prefetchCriticalData }) => {
      prefetchCriticalData(!!user);
    });
  }, [user]);

  return <>{children}</>;
}

export default App;
