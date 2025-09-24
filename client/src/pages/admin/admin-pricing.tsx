import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useSEO } from "@/lib/seo-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Edit2, Calendar, Percent, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing-utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

const pricingRuleSchema = z.object({
  rule_type: z.enum(["base", "seasonal", "weekend", "min_nights", "discount_long_stay", "cleaning_fee", "service_fee", "tat_rate", "get_rate", "county_tax_rate"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  value: z.string().min(1, "Value is required"),
  min_nights: z.string().optional(),
  percentage: z.boolean().optional(),
  active: z.boolean().default(true),
});

type PricingRuleForm = z.infer<typeof pricingRuleSchema>;

interface PricingRule {
  id: string;
  rule_type: string;
  start_date?: string;
  end_date?: string;
  value: string;
  min_nights?: number;
  percentage: boolean;
  active: boolean;
  created_at: string;
}

export default function AdminPricing() {
  useSEO({
    title: "Admin Pricing",
    description: "Manage property pricing rules and rates",
    robots: "noindex, nofollow",
    canonical: `${window.location.origin}/admin/pricing`
  });

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const { data: pricingRules = [], isLoading } = useQuery<PricingRule[]>({
    queryKey: ["/api/admin/pricing-rules"],
  });

  const form = useForm<PricingRuleForm>({
    resolver: zodResolver(pricingRuleSchema),
    defaultValues: {
      rule_type: "base",
      value: "",
      percentage: false,
      active: true,
    },
  });

  const createPricingRuleMutation = useMutation({
    mutationFn: async (data: PricingRuleForm) => {
      if (editingRule) {
        // Update existing rule
        const response = await apiRequest("PUT", `/api/admin/pricing-rules/${editingRule.id}`, data);
        return response.json();
      } else {
        // Create new rule
        const response = await apiRequest("POST", "/api/admin/pricing-rules", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Pricing rule saved",
        description: "The pricing rule has been updated successfully.",
      });
      // Invalidate and refetch pricing rules query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pricing-rules"] });
      setIsDialogOpen(false);
      setEditingRule(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save pricing rule",
        description: error.message || "An error occurred while saving the pricing rule.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PricingRuleForm) => {
    createPricingRuleMutation.mutate(data);
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      base: "Base Rate",
      seasonal: "Seasonal Rate",
      weekend: "Weekend Rate", 
      min_nights: "Minimum Nights",
      discount_long_stay: "Long Stay Discount",
      cleaning_fee: "Cleaning Fee",
      service_fee: "Service Fee",
      tat_rate: "TAT (Transient Accommodations Tax)",
      get_rate: "GET (General Excise Tax)",
      county_tax_rate: "County Tax"
    };
    return labels[type] || type;
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'base':
      case 'seasonal':
      case 'weekend':
        return <DollarSign className="h-4 w-4" />;
      case 'min_nights':
        return <Clock className="h-4 w-4" />;
      case 'discount_long_stay':
      case 'tax_rate':
      case 'service_fee':
        return <Percent className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const groupedRules = pricingRules.reduce((acc, rule) => {
    const category = ['base', 'seasonal', 'weekend'].includes(rule.rule_type) ? 'rates' :
                    ['cleaning_fee', 'service_fee', 'tax_rate'].includes(rule.rule_type) ? 'fees' : 'policies';
    if (!acc[category]) acc[category] = [];
    acc[category].push(rule);
    return acc;
  }, {} as Record<string, PricingRule[]>);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pricing</h1>
            <p className="text-muted-foreground">
              Manage rates, fees, and booking policies
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-bronze text-white mt-4 sm:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Edit Pricing Rule" : "Add Pricing Rule"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rule_type">Rule Type</Label>
                  <select
                    {...form.register("rule_type")}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                    data-testid="select-rule-type"
                  >
                    <option value="base">Base Rate</option>
                    <option value="seasonal">Seasonal Rate</option>
                    <option value="weekend">Weekend Rate</option>
                    <option value="min_nights">Minimum Nights</option>
                    <option value="discount_long_stay">Long Stay Discount</option>
                    <option value="cleaning_fee">Cleaning Fee</option>
                    <option value="service_fee">Service Fee</option>
                    <option value="tat_rate">TAT (Transient Accommodations Tax)</option>
                    <option value="get_rate">GET (General Excise Tax)</option>
                    <option value="county_tax_rate">County Tax</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date (Optional)</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...form.register("start_date")}
                      data-testid="input-start-date"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (Optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...form.register("end_date")}
                      data-testid="input-end-date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...form.register("value")}
                    data-testid="input-value"
                  />
                  {form.formState.errors.value && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.value.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min_nights">Min Nights (Optional)</Label>
                  <Input
                    id="min_nights"
                    type="number"
                    {...form.register("min_nights")}
                    data-testid="input-min-nights"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="percentage"
                    {...form.register("percentage")}
                    data-testid="switch-percentage"
                  />
                  <Label htmlFor="percentage">Is Percentage</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    defaultChecked
                    {...form.register("active")}
                    data-testid="switch-active"
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createPricingRuleMutation.isPending}
                  data-testid="submit-pricing-rule"
                >
                  {createPricingRuleMutation.isPending 
                    ? "Saving..." 
                    : editingRule ? "Update Rule" : "Add Rule"
                  }
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Pricing Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Base Rate</p>
                  <p className="text-2xl font-bold">{formatCurrency(450)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-coral-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cleaning Fee</p>
                  <p className="text-2xl font-bold">{formatCurrency(150)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Fee</p>
                  <p className="text-2xl font-bold">15%</p>
                </div>
                <Percent className="h-8 w-8 text-ocean-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tax Rate</p>
                  <p className="text-2xl font-bold">12.16%</p>
                </div>
                <Percent className="h-8 w-8 text-coral-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Rules */}
        <Tabs defaultValue="rates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rates">Rates</TabsTrigger>
            <TabsTrigger value="fees">Fees & Taxes</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          <TabsContent value="rates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Nightly Rates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedRules.rates?.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getRuleTypeIcon(rule.rule_type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground">
                              {getRuleTypeLabel(rule.rule_type)}
                            </span>
                            {!rule.active && <Badge variant="secondary">Inactive</Badge>}
                          </div>
                          {rule.start_date && rule.end_date && (
                            <p className="text-sm text-muted-foreground">
                              {rule.start_date} to {rule.end_date}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground">
                          {rule.percentage ? `${rule.value}%` : formatCurrency(rule.value)}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No rate rules configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Percent className="h-5 w-5 mr-2" />
                  Fees & Taxes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedRules.fees?.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getRuleTypeIcon(rule.rule_type)}
                        <div>
                          <span className="font-medium text-foreground">
                            {getRuleTypeLabel(rule.rule_type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground">
                          {rule.percentage ? `${rule.value}%` : formatCurrency(rule.value)}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <Percent className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No fee rules configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Booking Policies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {groupedRules.policies?.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getRuleTypeIcon(rule.rule_type)}
                        <div>
                          <span className="font-medium text-foreground">
                            {getRuleTypeLabel(rule.rule_type)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground">
                          {rule.value} {rule.rule_type === 'min_nights' ? 'nights' : ''}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No policy rules configured</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
