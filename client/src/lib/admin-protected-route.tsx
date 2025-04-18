import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Loader2 } from "lucide-react";
import { ComponentType, LazyExoticComponent } from "react";
import { Redirect, Route } from "wouter";

type ComponentProp = LazyExoticComponent<() => JSX.Element> | (() => JSX.Element);

export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentProp;
}) {
  const { adminUser, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!adminUser) {
    return (
      <Route path={path}>
        <Redirect to="/admin/login" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      {() => <Component />}
    </Route>
  );
}