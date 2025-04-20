import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function AdminLoginTest() {
  const [username, setUsername] = useState("admin@autofill.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (response.ok) {
        toast({
          title: "Login successful",
          description: "You have been logged in as admin",
        });
        setLocation("/admin/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: data.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login error",
        description: "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto mt-12 border rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Admin Login Test</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
      
      <Button
        onClick={handleLogin}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Logging in..." : "Login as Admin"}
      </Button>
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Try these credentials:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Username: admin@autofill.com</li>
          <li>Username: admin</li>
          <li>Password: password, admin, or the password you set during setup</li>
        </ul>
      </div>
    </div>
  );
}