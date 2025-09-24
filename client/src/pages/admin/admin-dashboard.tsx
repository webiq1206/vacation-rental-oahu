import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BookOpen, 
  DollarSign, 
  Calendar, 
  MessageCircle, 
  TrendingUp,
  Users,
  Eye,
  Clock,
  FileText
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/pricing-utils";
import { Link } from "wouter";
import { useSEO } from "@/lib/seo-utils";

interface DashboardStats {
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  total_revenue: number;
  unread_messages: number;
  recent_bookings: Array<{
    id: string;
    start_date: string;
    end_date: string;
    guests: number;
    total: string;
    status: string;
  }>;
}

export default function AdminDashboard() {
  // SEO for admin dashboard with noindex
  useSEO({
    title: "Admin Dashboard",
    description: "VacationRentalOahu.co administrative dashboard for managing bookings and property.",
    robots: "noindex, nofollow",
    canonical: "https://vacationrentaloahu.co/admin/dashboard"
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="mb-8">
            <div className="h-8 w-48 mb-2 loading-skeleton-luxury" />
            <div className="h-5 w-64 loading-skeleton-luxury" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 loading-skeleton-luxury" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-96 loading-skeleton-luxury" />
            <div className="h-96 loading-skeleton-luxury" />
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main 
        id="main-content"
        className="flex-1 p-8"
        role="main"
        aria-labelledby="dashboard-heading"
      >
        {/* Header */}
        <header className="mb-8">
          <h1 
            id="dashboard-heading"
            className="text-3xl font-bold text-foreground"
          >
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your Beach House Oahu property.
          </p>
        </header>

        {/* Stats Cards */}
        <section 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          aria-label="Property statistics overview"
          role="region"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bookings
              </CardTitle>
              <BookOpen className="h-4 w-4 text-coral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-bookings">
                {stats?.total_bookings || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                +{stats?.confirmed_bookings || 0} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="total-revenue">
                {formatCurrency(stats?.total_revenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                From confirmed bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="pending-bookings">
                {stats?.pending_bookings || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting payment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Messages
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-ocean-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="unread-messages">
                {stats?.unread_messages || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Unread inquiries
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid lg:grid-cols-2 gap-8" aria-label="Recent bookings and quick actions">
          {/* Recent Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Bookings</CardTitle>
              <Link href="/admin/bookings">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recent_bookings && stats.recent_bookings.length > 0 ? (
                  stats.recent_bookings.map((booking) => {
                    return (
                      <div 
                        key={booking.id} 
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-foreground">
                              Booking #{booking.id.slice(-8)}
                            </span>
                            <Badge variant="secondary" className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.guests} guests
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            {formatCurrency(booking.total)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No bookings yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/admin/calendar">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <Calendar className="h-6 w-6 text-coral-500" />
                    <span>Manage Calendar</span>
                  </Button>
                </Link>
                
                <Link href="/admin/pricing">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <DollarSign className="h-6 w-6 text-emerald-500" />
                    <span>Update Pricing</span>
                  </Button>
                </Link>
                
                <Link href="/admin/content">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <FileText className="h-6 w-6 text-ocean-500" />
                    <span>Edit Content</span>
                  </Button>
                </Link>
                
                <Link href="/">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <Eye className="h-6 w-6 text-muted-foreground" />
                    <span>View Site</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Performance Overview */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">95%</div>
                  <div className="text-sm text-muted-foreground">Occupancy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-coral-600 mb-1">N/A</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-ocean-600 mb-1">$450</div>
                  <div className="text-sm text-muted-foreground">Avg. Nightly Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
