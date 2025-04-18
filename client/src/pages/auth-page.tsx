import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Loader2, Droplet, Car, CreditCard, MapPin } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = insertUserSchema.extend({
  email: z.string().email({ message: "Please enter a valid email" }),
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate({
      ...userData,
      username: userData.email,
    });
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="bg-white p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <Logo size="lg" className="mx-auto mb-3 drop-shadow-sm" />
            <p className="text-neutral-500 text-sm mt-2 tracking-wide">ON-DEMAND FUEL DELIVERY</p>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6 bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="login" className="rounded-md">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-md">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-autofill-orange text-white hover:bg-orange-500 font-medium shadow-sm" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Log In
                  </Button>

                  <div className="mt-4 text-center">
                    <Button variant="link" className="autofill-navy text-sm font-medium">
                      Forgot password?
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-autofill-navy text-white hover:bg-blue-900 font-medium shadow-sm" 
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Sign Up
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="bg-autofill-navy hidden md:flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-autofill-orange blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full bg-autofill-orange blur-3xl"></div>
        </div>
        <div className="max-w-md relative z-10">
          <Logo size="lg" className="mx-auto mb-8 filter drop-shadow-lg" />
          <h2 className="text-3xl font-bold mb-4 text-white leading-tight">Fuel delivery, simplified</h2>
          <p className="text-slate-200 mb-10 text-lg">
            AutoFill brings the gas station to you. Order fuel directly to your vehicle, 
            anytime, anywhere. Save time and never worry about empty tanks again.
          </p>
          <div className="grid grid-cols-2 gap-5 text-left">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg border border-white/20 transform transition-all hover:scale-105 hover:bg-white/15">
              <div className="bg-autofill-orange/20 rounded-full w-10 h-10 mb-3 flex items-center justify-center">
                <Droplet className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium mb-2 text-white">On-demand delivery</h3>
              <p className="text-sm text-slate-200">Get fuel delivered to your location in minutes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg border border-white/20 transform transition-all hover:scale-105 hover:bg-white/15">
              <div className="bg-autofill-orange/20 rounded-full w-10 h-10 mb-3 flex items-center justify-center">
                <Car className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium mb-2 text-white">Multiple vehicles</h3>
              <p className="text-sm text-slate-200">Manage all your vehicles in one place</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg border border-white/20 transform transition-all hover:scale-105 hover:bg-white/15">
              <div className="bg-autofill-orange/20 rounded-full w-10 h-10 mb-3 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium mb-2 text-white">Secure payments</h3>
              <p className="text-sm text-slate-200">Pay securely with saved payment methods</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-lg border border-white/20 transform transition-all hover:scale-105 hover:bg-white/15">
              <div className="bg-autofill-orange/20 rounded-full w-10 h-10 mb-3 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-medium mb-2 text-white">Real-time tracking</h3>
              <p className="text-sm text-slate-200">Track your delivery in real-time on the map</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
