import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useSEO } from "@/lib/seo-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Mail, 
  CreditCard, 
  Globe, 
  Shield, 
  Bell,
  Key,
  Database,
  Save,
  AlertCircle,
  CheckCircle,
  Search,
  Eye
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const generalSettingsSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  site_description: z.string().min(1, "Site description is required"),
  contact_email: z.string().email("Please enter a valid email"),
  contact_phone: z.string().min(1, "Phone number is required"),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

const emailSettingsSchema = z.object({
  email_provider: z.enum(["resend", "postmark", "mailgun"]),
  from_email: z.string().email("Please enter a valid email"),
  from_name: z.string().min(1, "From name is required"),
  api_key: z.string().min(1, "API key is required"),
});

const paymentSettingsSchema = z.object({
  stripe_public_key: z.string().min(1, "Stripe public key is required"),
  stripe_secret_key: z.string().min(1, "Stripe secret key is required"),
  stripe_webhook_secret: z.string().min(1, "Webhook secret is required"),
  test_mode: z.boolean().default(true),
});

const seoSettingsSchema = z.object({
  site_title: z.string().min(1, "Site title is required"),
  site_description: z.string().min(1, "Site description is required"),
  og_image_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  twitter_handle: z.string().optional().or(z.literal("")),
  page_titles: z.object({
    home: z.string().min(1, "Home page title is required"),
    booking: z.string().min(1, "Booking page title is required"),
    stay: z.string().min(1, "Stay page title is required"),
    contact: z.string().min(1, "Contact page title is required"),
    policies: z.string().min(1, "Policies page title is required"),
  }),
  meta_descriptions: z.object({
    home: z.string().min(1, "Home page description is required"),
    booking: z.string().min(1, "Booking page description is required"),
    stay: z.string().min(1, "Stay page description is required"),
    contact: z.string().min(1, "Contact page description is required"),
    policies: z.string().min(1, "Policies page description is required"),
  }),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;
type EmailSettingsForm = z.infer<typeof emailSettingsSchema>;
type PaymentSettingsForm = z.infer<typeof paymentSettingsSchema>;
type SEOSettingsForm = z.infer<typeof seoSettingsSchema>;

interface Settings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  currency: string;
  timezone: string;
  email_provider: string;
  from_email: string;
  from_name: string;
  stripe_test_mode: boolean;
  notifications_enabled: boolean;
  auto_confirmation: boolean;
  require_approval: boolean;
}

export default function AdminSettings() {
  useSEO({
    title: "Admin Settings",
    description: "Manage application settings and configuration",
    robots: "noindex, nofollow",
    canonical: `${window.location.origin}/admin/settings`
  });

  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/admin/settings"],
  });

  const generalForm = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      site_name: settings?.site_name || "",
      site_description: settings?.site_description || "",
      contact_email: settings?.contact_email || "",
      contact_phone: settings?.contact_phone || "",
      currency: settings?.currency || "USD",
      timezone: settings?.timezone || "Pacific/Honolulu",
    },
  });

  const emailForm = useForm<EmailSettingsForm>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      email_provider: (settings?.email_provider as any) || "resend",
      from_email: settings?.from_email || "",
      from_name: settings?.from_name || "",
      api_key: "",
    },
  });

  const paymentForm = useForm<PaymentSettingsForm>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      stripe_public_key: "",
      stripe_secret_key: "",
      stripe_webhook_secret: "",
      test_mode: settings?.stripe_test_mode ?? true,
    },
  });

  // Fetch SEO settings separately
  const { data: seoSettings } = useQuery({
    queryKey: ['/api/seo-settings'],
  });

  const seoForm = useForm<SEOSettingsForm>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues: {
      site_title: seoSettings?.site_title || "",
      site_description: seoSettings?.site_description || "",
      og_image_url: seoSettings?.og_image_url || "",
      twitter_handle: seoSettings?.twitter_handle || "",
      page_titles: {
        home: seoSettings?.page_titles?.home || "",
        booking: seoSettings?.page_titles?.booking || "",
        stay: seoSettings?.page_titles?.stay || "",
        contact: seoSettings?.page_titles?.contact || "",
        policies: seoSettings?.page_titles?.policies || "",
      },
      meta_descriptions: {
        home: seoSettings?.meta_descriptions?.home || "",
        booking: seoSettings?.meta_descriptions?.booking || "",
        stay: seoSettings?.meta_descriptions?.stay || "",
        contact: seoSettings?.meta_descriptions?.contact || "",
        policies: seoSettings?.meta_descriptions?.policies || "",
      },
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { category: string; settings: any }) => {
      const response = await apiRequest("PUT", "/api/admin/settings", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "Settings saved",
        description: `${variables.category} settings have been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest("POST", "/api/admin/test-connection", { provider });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection successful",
        description: "The connection test was successful.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onGeneralSubmit = (data: GeneralSettingsForm) => {
    updateSettingsMutation.mutate({
      category: "General",
      settings: data,
    });
  };

  const onEmailSubmit = (data: EmailSettingsForm) => {
    updateSettingsMutation.mutate({
      category: "Email",
      settings: data,
    });
  };

  const onPaymentSubmit = (data: PaymentSettingsForm) => {
    updateSettingsMutation.mutate({
      category: "Payment",
      settings: data,
    });
  };

  const onSEOSubmit = async (data: SEOSettingsForm) => {
    try {
      const response = await apiRequest("PUT", "/api/seo-settings", data);
      await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/seo-settings'] });
      toast({
        title: "SEO settings saved",
        description: "SEO settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to save SEO settings",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testEmailConnection = () => {
    const provider = emailForm.getValues("email_provider");
    testConnectionMutation.mutate(provider);
  };

  // Reset forms when settings load
  useState(() => {
    if (settings) {
      generalForm.reset({
        site_name: settings.site_name,
        site_description: settings.site_description,
        contact_email: settings.contact_email,
        contact_phone: settings.contact_phone,
        currency: settings.currency,
        timezone: settings.timezone,
      });
      
      emailForm.reset({
        email_provider: settings.email_provider as any,
        from_email: settings.from_email,
        from_name: settings.from_name,
        api_key: "",
      });
      
      paymentForm.reset({
        stripe_public_key: "",
        stripe_secret_key: "",
        stripe_webhook_secret: "",
        test_mode: settings.stripe_test_mode,
      });
    }
  });

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage system settings and integrations
          </p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="site_name">Site Name</Label>
                      <Input
                        id="site_name"
                        {...generalForm.register("site_name")}
                        data-testid="input-site-name"
                      />
                      {generalForm.formState.errors.site_name && (
                        <p className="text-sm text-destructive">
                          {generalForm.formState.errors.site_name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Contact Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        {...generalForm.register("contact_email")}
                        data-testid="input-contact-email"
                      />
                      {generalForm.formState.errors.contact_email && (
                        <p className="text-sm text-destructive">
                          {generalForm.formState.errors.contact_email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_description">Site Description</Label>
                    <Textarea
                      id="site_description"
                      {...generalForm.register("site_description")}
                      data-testid="input-site-description"
                    />
                    {generalForm.formState.errors.site_description && (
                      <p className="text-sm text-destructive">
                        {generalForm.formState.errors.site_description.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Contact Phone</Label>
                      <Input
                        id="contact_phone"
                        {...generalForm.register("contact_phone")}
                        data-testid="input-contact-phone"
                      />
                      {generalForm.formState.errors.contact_phone && (
                        <p className="text-sm text-destructive">
                          {generalForm.formState.errors.contact_phone.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        {...generalForm.register("currency")}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        data-testid="select-currency"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      {...generalForm.register("timezone")}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      data-testid="select-timezone"
                    >
                      <option value="Pacific/Honolulu">Pacific/Honolulu (HST)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                      <option value="America/Denver">America/Denver (MST)</option>
                      <option value="America/Chicago">America/Chicago (CST)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    data-testid="save-general-settings"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save General Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email_provider">Email Provider</Label>
                    <select
                      id="email_provider"
                      {...emailForm.register("email_provider")}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      data-testid="select-email-provider"
                    >
                      <option value="resend">Resend</option>
                      <option value="postmark">Postmark</option>
                      <option value="mailgun">Mailgun</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from_name">From Name</Label>
                      <Input
                        id="from_name"
                        {...emailForm.register("from_name")}
                        data-testid="input-from-name"
                      />
                      {emailForm.formState.errors.from_name && (
                        <p className="text-sm text-destructive">
                          {emailForm.formState.errors.from_name.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="from_email">From Email</Label>
                      <Input
                        id="from_email"
                        type="email"
                        {...emailForm.register("from_email")}
                        data-testid="input-from-email"
                      />
                      {emailForm.formState.errors.from_email && (
                        <p className="text-sm text-destructive">
                          {emailForm.formState.errors.from_email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      type="password"
                      placeholder="Enter your email provider API key"
                      {...emailForm.register("api_key")}
                      data-testid="input-email-api-key"
                    />
                    {emailForm.formState.errors.api_key && (
                      <p className="text-sm text-destructive">
                        {emailForm.formState.errors.api_key.message}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      disabled={updateSettingsMutation.isPending}
                      data-testid="save-email-settings"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateSettingsMutation.isPending ? "Saving..." : "Save Email Settings"}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testEmailConnection}
                      disabled={testConnectionMutation.isPending}
                      data-testid="test-email-connection"
                    >
                      {testConnectionMutation.isPending ? (
                        <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Stripe Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="test_mode"
                      {...paymentForm.register("test_mode")}
                      data-testid="switch-test-mode"
                    />
                    <Label htmlFor="test_mode">Test Mode</Label>
                    <Badge variant={paymentForm.watch("test_mode") ? "secondary" : "default"}>
                      {paymentForm.watch("test_mode") ? "Test" : "Live"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe_public_key">Stripe Public Key</Label>
                    <Input
                      id="stripe_public_key"
                      type="password"
                      placeholder="pk_test_... or pk_live_..."
                      {...paymentForm.register("stripe_public_key")}
                      data-testid="input-stripe-public-key"
                    />
                    {paymentForm.formState.errors.stripe_public_key && (
                      <p className="text-sm text-destructive">
                        {paymentForm.formState.errors.stripe_public_key.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe_secret_key">Stripe Secret Key</Label>
                    <Input
                      id="stripe_secret_key"
                      type="password"
                      placeholder="sk_test_... or sk_live_..."
                      {...paymentForm.register("stripe_secret_key")}
                      data-testid="input-stripe-secret-key"
                    />
                    {paymentForm.formState.errors.stripe_secret_key && (
                      <p className="text-sm text-destructive">
                        {paymentForm.formState.errors.stripe_secret_key.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stripe_webhook_secret">Webhook Secret</Label>
                    <Input
                      id="stripe_webhook_secret"
                      type="password"
                      placeholder="whsec_..."
                      {...paymentForm.register("stripe_webhook_secret")}
                      data-testid="input-webhook-secret"
                    />
                    {paymentForm.formState.errors.stripe_webhook_secret && (
                      <p className="text-sm text-destructive">
                        {paymentForm.formState.errors.stripe_webhook_secret.message}
                      </p>
                    )}
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Webhook Endpoint</h4>
                    <code className="text-sm bg-background px-2 py-1 rounded">
                      {window.location.origin}/api/webhooks/stripe
                    </code>
                    <p className="text-sm text-muted-foreground mt-2">
                      Add this URL to your Stripe webhook endpoints to receive payment events.
                    </p>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    data-testid="save-payment-settings"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Payment Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Advanced Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send booking notifications to admin</p>
                    </div>
                    <Switch
                      id="notifications"
                      defaultChecked={settings?.notifications_enabled}
                      data-testid="switch-notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto_confirmation">Auto Confirmation</Label>
                      <p className="text-sm text-muted-foreground">Automatically confirm bookings after payment</p>
                    </div>
                    <Switch
                      id="auto_confirmation"
                      defaultChecked={settings?.auto_confirmation}
                      data-testid="switch-auto-confirmation"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="require_approval">Require Approval</Label>
                      <p className="text-sm text-muted-foreground">Require manual approval for bookings</p>
                    </div>
                    <Switch
                      id="require_approval"
                      defaultChecked={settings?.require_approval}
                      data-testid="switch-require-approval"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    System Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Application Version:</span>
                      <span className="ml-2 font-mono">1.0.0</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Node.js Version:</span>
                      <span className="ml-2 font-mono">{process.env.NODE_VERSION || "20.x"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Environment:</span>
                      <Badge variant="secondary" className="ml-2">
                        {process.env.NODE_ENV || "development"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Database:</span>
                      <Badge variant="default" className="ml-2">
                        PostgreSQL
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
