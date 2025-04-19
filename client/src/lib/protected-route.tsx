import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { ComponentType, LazyExoticComponent, Suspense, useEffect } from "react";

type ComponentProp = LazyExoticComponent<() => JSX.Element> | ComponentType<any>;

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentProp;
}) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <PageLoader />
      </Route>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Render the protected component if authenticated
  // Wrap in Suspense to handle lazy loading
  return (
    <Route path={path}>
      {(params) => (
        <Suspense fallback={<PageLoader />}>
          <Component {...params} />
        </Suspense>
      )}
    </Route>
  );
}
