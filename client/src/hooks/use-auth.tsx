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
  logoutMutation: UseMutationResult<void, Error, void>;
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
    isFetched
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ 
      on401: "returnNull", 
      retries: 2,
      timeout: 5000 
    }),
    // Don't refetch too frequently to avoid UI jank
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials, {
        retries: 2
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update auth state
      queryClient.setQueryData(["/api/user"], user);
      
      // Force refetch of any dependent queries
      queryClient.invalidateQueries({ 
        queryKey: ["/api/vehicles"], 
        refetchType: "all" 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/orders"], 
        refetchType: "all" 
      });
      
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
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials, {
        retries: 2
      });
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update auth state
      queryClient.setQueryData(["/api/user"], user);
      
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
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", undefined, {
        retries: 1
      });
    },
    onSuccess: () => {
      // Reset auth state and navigate to login page
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear all cached data on logout to prevent stale data issues
      queryClient.clear();
      
      // Force navigation to auth page
      navigate("/auth");
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
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
