import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient as globalQueryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<Response, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  
  const {
    data: user,
    error,
    isLoading,
    status,
    isFetched,
    refetch: refetchUser
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async (context) => {
      console.log("Fetching auth state...");
      const fetchFn = getQueryFn({ 
        on401: "returnNull", 
        retries: 1,
        timeout: 5000 
      });
      
      try {
        const result = await fetchFn(context) as SelectUser | null;
        console.log("Auth state fetched:", result ? "Authenticated" : "Not authenticated");
        return result;
      } catch (error) {
        console.error("Error fetching auth state:", error);
        return null;
      }
    },
    // Don't refetch too frequently to avoid UI jank
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 0
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials, {
        retries: 2
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update auth state
      queryClient.setQueryData(["/api/user"], user);
      
      // Refresh the auth state
      refetchUser();
      
      // Invalidate all queries to ensure fresh data
      queryClient.invalidateQueries();
      
      // Navigate to home page after successful login
      if (location === "/auth") {
        navigate("/");
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}`,
      });
    },
    onError: (error: Error) => {
      // Clear any stale user data
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials, {
        retries: 2
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update auth state
      queryClient.setQueryData(["/api/user"], user);
      
      // Refresh the auth state
      refetchUser();
      
      // Invalidate all queries to ensure fresh data
      queryClient.invalidateQueries();
      
      // Navigate to home page after successful registration
      if (location === "/auth") {
        navigate("/");
      }
      
      toast({
        title: "Registration successful",
        description: "Your account has been created",
      });
    },
    onError: (error: Error) => {
      // Clear any stale user data
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with a different email",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout", undefined, {
        retries: 1
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Logout failed");
      }
      
      return res;
    },
    onSuccess: () => {
      // Reset auth state
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear all cached data on logout to prevent stale data issues
      queryClient.clear();
      
      // Force navigation to auth page
      navigate("/auth", { replace: true });
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      // Even if logout failed on the server, we still want to clear the local state
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      navigate("/auth", { replace: true });
      
      toast({
        title: "Logout issues",
        description: "Your session has been cleared locally",
        variant: "default",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
