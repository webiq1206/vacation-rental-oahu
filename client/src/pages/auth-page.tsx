import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Redirect } from "wouter";
import logoPath from "@assets/Vacation Rental Oahu Logo (2)_1758651748029.png";
import logoLightPath from "@assets/Vacation Rental Oahu Logo_1758651723145.png";
import heroVideoPath from "@assets/Vacation Rental Oahu - Chinaman's Beach House_1758642684022.mp4";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });


  // Redirect if already logged in (after all hooks are called)
  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };


  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden lg:block">
          <div 
            className="relative h-full min-h-[600px] rounded-2xl overflow-hidden"
          >
            <video
              src={heroVideoPath}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              aria-label="Beach House Oahu property video showcasing the oceanfront location"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-center justify-center text-center p-8">
              <div className="text-white">
                <div className="flex items-center justify-center mb-6">
                  <img 
                    src={logoPath} 
                    alt="VacationRentalOahu.co" 
                    className="h-12 w-auto mr-3" 
                  />
                </div>
                <h2 className="text-luxury-4xl font-serif font-normal mb-6 leading-tight tracking-luxury-tight">Welcome to Paradise</h2>
                <p className="text-xl text-white/90 max-w-md">
                  Manage your Beach House Oahu property with our comprehensive admin dashboard. 
                  Handle bookings, update content, and provide exceptional guest experiences.
                </p>
                <div className="mt-8 space-y-2 text-white/80">
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2" />
                    <span>Booking Management</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-coral-400 rounded-full mr-2" />
                    <span>Calendar & Pricing Control</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="w-2 h-2 bg-ocean-400 rounded-full mr-2" />
                    <span>Content & Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Forms */}
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8 lg:hidden">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={logoLightPath} 
                alt="VacationRentalOahu.co" 
                className="h-8 w-auto mr-2" 
              />
            </div>
            <h1 className="text-3xl font-serif font-normal text-foreground">Admin Access</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Admin Dashboard</CardTitle>
              <CardDescription className="text-center">
                Sign in to manage your Beach House Oahu vacation rental
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value="login" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="login" data-testid="tab-login">Admin Login</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="admin@vacationrentaloahu.co"
                        {...loginForm.register("email")}
                        data-testid="input-login-email"
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        {...loginForm.register("password")}
                        data-testid="input-login-password"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full btn-bronze text-white"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-4">
            This admin panel is for property management only. 
            <br />
            Guest bookings are handled on the main site.
          </p>
        </div>
      </div>
    </div>
  );
}
