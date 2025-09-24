import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  Calendar, 
  DollarSign, 
  Users, 
  Star,
  TrendingUp,
  TrendingDown,
  Download,
  Eye,
  MessageSquare,
  MapPin,
  PieChart,
  LineChart,
  FileText,
  Receipt,
  CreditCard,
  Home,
  Activity,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  ComposedChart,
  Area,
  AreaChart
} from "recharts";

// Enhanced interfaces for Phase 2 Advanced Reporting
interface RevenueAnalytics {
  totalRevenue: number;
  grossRevenue: number;
  netRevenue: number;
  monthlyBreakdown: Array<{ month: string; revenue: number; bookings: number }>;
  averageBookingValue: number;
  occupancyRate: number;
  averageDailyRate: number;
}

interface TaxAnalytics {
  totalTaxes: number;
  tatTaxes: number;
  getTaxes: number;
  countyTaxes: number;
  taxBreakdown: Array<{ month: string; tat: number; get: number; county: number }>;
}

interface BookingAnalytics {
  totalBookings: number;
  confirmedBookings: number;
  canceledBookings: number;
  averageStayLength: number;
  averageGroupSize: number;
  occupancyRate: number;
  seasonalTrends: Array<{ month: string; bookings: number; occupancy: number }>;
  guestDemographics: {
    repeatCustomers: number;
    newGuests: number;
    averageGuestsPerBooking: number;
  };
}

interface FinancialBreakdown {
  grossRevenue: number;
  cleaningFees: number;
  serviceFees: number;
  taxes: number;
  netRevenue: number;
  revenueByMonth: Array<{ month: string; gross: number; net: number; taxes: number; fees: number }>;
}

interface GuestAnalytics {
  totalGuests: number;
  uniqueGuests: number;
  repeatGuests: number;
  averageStayLength: number;
  averageGroupSize: number;
  guestSources: Array<{ source: string; count: number; revenue: number }>;
}

interface EmailAnalytics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  templateBreakdown: Array<{ template: string; sent: number; delivered: number; openRate: number }>;
}

interface LegacyBookingStats {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  monthlyBookings: Array<{ month: string; bookings: number; revenue: number }>;
  recentBookings: Array<{
    id: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    total: string;
    status: string;
  }>;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
  recentReviews: Array<{
    id: string;
    guest_name: string;
    rating: number;
    review_text: string;
    created_at: string;
  }>;
}

interface MessageStats {
  totalMessages: number;
  unreadMessages: number;
  responseTime: number;
  recentMessages: Array<{
    id: string;
    guest_name: string;
    email: string;
    subject: string;
    created_at: string;
    replied: boolean;
  }>;
}

// Color palette for charts
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC', '#66BB6A'];

export default function AdminReporting() {
  useSEO({
    title: "Admin Reporting",
    description: "View analytics and reporting dashboard",
    robots: "noindex, nofollow",
    canonical: `${window.location.origin}/admin/reporting`
  });

  // State Management
  const [dateRange, setDateRange] = useState("90");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [useCustomDates, setUseCustomDates] = useState(false);

  // Calculate date range based on selection
  const { startDate, endDate } = useMemo(() => {
    if (useCustomDates && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate
      };
    }

    const end = new Date();
    const start = new Date();
    const days = parseInt(dateRange);
    start.setDate(start.getDate() - days);

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [dateRange, customStartDate, customEndDate, useCustomDates]);

  // API Queries for Advanced Analytics
  const { data: revenueAnalytics, isLoading: revenueLoading } = useQuery<RevenueAnalytics>({
    queryKey: [`/api/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`],
  });

  const { data: taxAnalytics, isLoading: taxLoading } = useQuery<TaxAnalytics>({
    queryKey: [`/api/admin/reports/taxes?startDate=${startDate}&endDate=${endDate}`],
  });

  const { data: bookingAnalytics, isLoading: bookingLoading } = useQuery<BookingAnalytics>({
    queryKey: [`/api/admin/reports/bookings?startDate=${startDate}&endDate=${endDate}`],
  });

  const { data: financialBreakdown, isLoading: financialLoading } = useQuery<FinancialBreakdown>({
    queryKey: [`/api/admin/reports/financial?startDate=${startDate}&endDate=${endDate}`],
  });

  const { data: guestAnalytics, isLoading: guestLoading } = useQuery<GuestAnalytics>({
    queryKey: [`/api/admin/reports/guests?startDate=${startDate}&endDate=${endDate}`],
  });

  const { data: emailAnalytics, isLoading: emailLoading } = useQuery<EmailAnalytics>({
    queryKey: [`/api/admin/emails/analytics?startDate=${startDate}&endDate=${endDate}`],
  });

  // Legacy queries for backward compatibility
  const { data: legacyBookingStats, isLoading: legacyBookingStatsLoading } = useQuery<LegacyBookingStats>({
    queryKey: [`/api/admin/stats/bookings?days=${dateRange}`],
  });

  const { data: reviewStats, isLoading: reviewStatsLoading } = useQuery<ReviewStats>({
    queryKey: ["/api/admin/stats/reviews"],
  });

  const { data: messageStats, isLoading: messageStatsLoading } = useQuery<MessageStats>({
    queryKey: ["/api/admin/stats/messages"],
  });

  // Utility Functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Export functionality
  const handleExport = async (type: 'revenue' | 'bookings' | 'taxes' | 'guests', format: 'csv' | 'json' = 'csv') => {
    const url = `/api/admin/reports/export?type=${type}&startDate=${startDate}&endDate=${endDate}&format=${format}`;
    
    if (format === 'csv') {
      // For CSV, trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // For JSON, open in new tab
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BarChart3 className="h-10 w-10 text-blue-600" />
                Advanced Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Comprehensive reporting with Hawaii tax compliance & guest analytics
              </p>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Date Range Controls */}
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Date Range:</Label>
                <div className="flex items-center gap-2">
                  <Select 
                    value={useCustomDates ? "custom" : dateRange} 
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setUseCustomDates(true);
                      } else {
                        setUseCustomDates(false);
                        setDateRange(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="180">Last 6 months</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {useCustomDates && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-36"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-36"
                  />
                </div>
              )}
              
              {/* Export Buttons */}
              <div className="flex gap-2">
                <Select onValueChange={(type) => handleExport(type as any, 'csv')}>
                  <SelectTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Export CSV
                    </Button>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue Report</SelectItem>
                    <SelectItem value="bookings">Bookings Report</SelectItem>
                    <SelectItem value="taxes">Tax Report</SelectItem>
                    <SelectItem value="guests">Guest Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Date Range Display */}
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing data from <strong>{startDate}</strong> to <strong>{endDate}</strong>
          </div>
        </div>

        {/* Advanced Tabs Navigation */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 mb-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="taxes" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Hawaii Taxes
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guests
            </TabsTrigger>
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Financial
            </TabsTrigger>
            <TabsTrigger value="communications" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Communications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="total-bookings">
                        {bookingStatsLoading ? "..." : bookingStats?.totalBookings || 0}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-coral-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                    <span className="text-sm text-emerald-600">+12% from last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="total-revenue">
                        {bookingStatsLoading ? "..." : formatCurrency(bookingStats?.totalRevenue || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500 mr-1" />
                    <span className="text-sm text-emerald-600">+18% from last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="average-rating">
                        {reviewStatsLoading ? "..." : (reviewStats?.averageRating || 0).toFixed(1)}
                      </p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-muted-foreground">
                      Based on {reviewStats?.totalReviews || 0} reviews
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                      <p className="text-2xl font-bold text-foreground" data-testid="occupancy-rate">
                        {bookingStatsLoading ? "..." : formatPercentage(bookingStats?.occupancyRate || 0)}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-ocean-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm text-red-600">-3% from last period</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookingStatsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded mb-2" />
                          <div className="h-3 bg-muted rounded w-3/4" />
                        </div>
                      ))
                    ) : (
                      bookingStats?.recentBookings?.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium text-foreground">{booking.guest_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.check_in} - {booking.check_out}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">{formatCurrency(parseFloat(booking.total))}</p>
                            <Badge 
                              variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                      )) || []
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviewStatsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-muted rounded mb-2" />
                          <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                          <div className="h-3 bg-muted rounded w-4/5" />
                        </div>
                      ))
                    ) : (
                      reviewStats?.recentReviews?.map((review) => (
                        <div key={review.id} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-foreground">{review.guest_name}</p>
                            <div className="flex items-center">
                              {Array.from({ length: review.rating }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.review_text}
                          </p>
                        </div>
                      )) || []
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(bookingStats?.averageBookingValue || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Average Booking Value</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">
                        {bookingStats?.totalBookings || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold text-foreground">
                        {formatPercentage(bookingStats?.occupancyRate || 0)}
                      </p>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                    </div>
                  </div>

                  {/* Monthly Chart Placeholder */}
                  <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground">Monthly booking chart would go here</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                      <div className="space-y-3">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center space-x-3">
                            <span className="w-8 text-sm font-medium">{rating}★</span>
                            <div className="flex-1 bg-muted rounded-full h-2">
                              <div 
                                className="bg-coral-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${((reviewStats?.ratingDistribution?.[rating] || 0) / (reviewStats?.totalReviews || 1)) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-8">
                              {reviewStats?.ratingDistribution?.[rating] || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Review Summary</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total Reviews:</span>
                          <span className="font-medium">{reviewStats?.totalReviews || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Average Rating:</span>
                          <span className="font-medium">{(reviewStats?.averageRating || 0).toFixed(1)}★</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">5-Star Reviews:</span>
                          <span className="font-medium text-emerald-600">
                            {formatPercentage((reviewStats?.ratingDistribution?.[5] || 0) / (reviewStats?.totalReviews || 1))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">All Reviews</h3>
                    <div className="space-y-4">
                      {reviewStats?.recentReviews?.map((review) => (
                        <div key={review.id} className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">{review.guest_name}</p>
                              <div className="flex items-center mt-1">
                                {Array.from({ length: review.rating }).map((_, i) => (
                                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{review.review_text}</p>
                        </div>
                      )) || []}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-coral-500" />
                      <p className="text-2xl font-bold text-foreground">
                        {messageStats?.totalMessages || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Messages</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Eye className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p className="text-2xl font-bold text-foreground">
                        {messageStats?.unreadMessages || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Unread Messages</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                      <p className="text-2xl font-bold text-foreground">
                        {messageStats?.responseTime || 0}h
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recent Messages</h3>
                    <div className="space-y-4">
                      {messageStats?.recentMessages?.map((message) => (
                        <div key={message.id} className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-foreground">{message.guest_name}</p>
                              <p className="text-sm text-muted-foreground">{message.email}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={message.replied ? "default" : "destructive"}>
                                {message.replied ? "Replied" : "Pending"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="font-medium text-foreground">{message.subject}</p>
                        </div>
                      )) || []}
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