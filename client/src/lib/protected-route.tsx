import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { ComponentType, LazyExoticComponent, useEffect } from "react";

type ComponentProp = LazyExoticComponent<() => JSX.Element> | ComponentType<any>;

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentProp;
}) {
  const { user, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Enhanced navigation with better auth handling
  useEffect(() => {
    // If we're not loading anymore and there's no user, redirect to auth
    if (!isLoading && !user && location.startsWith(path)) {
      navigate("/auth", { replace: true });
    }
  }, [user, isLoading, location, navigate, path]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}
