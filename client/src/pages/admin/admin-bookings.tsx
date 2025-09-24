import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar, 
  Users, 
  DollarSign,
  Mail,
  Phone
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/pricing-utils";
import { useSEO } from "@/lib/seo-utils";

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  nights: number;
  guest_count: number;
  status: string;
  total: string;
  currency: string;
  created_at: string;
  guests: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_primary: boolean;
  }>;
}

export default function AdminBookings() {
  // SEO for admin bookings with noindex
  useSEO({
    title: "Admin Bookings",
    description: "Manage bookings and reservations for VacationRentalOahu.co luxury vacation rental.",
    robots: "noindex, nofollow",
    canonical: "https://vacationrentaloahu.co/admin/bookings"
  });

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings", statusFilter],
  });

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

  const filteredBookings = bookings.filter(booking => {
    const primaryGuest = booking.guests.find(g => g.is_primary);
    const guestName = primaryGuest ? `${primaryGuest.first_name} ${primaryGuest.last_name}`.toLowerCase() : '';
    const email = primaryGuest?.email.toLowerCase() || '';
    
    const matchesSearch = searchTerm === '' || 
      guestName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex-1 p-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
            <p className="text-muted-foreground">
              Manage reservations and guest information
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-coral-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(
                      bookings
                        .filter(b => b.status === 'confirmed')
                        .reduce((sum, b) => sum + parseFloat(b.total), 0)
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by guest name, email, or booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="search-bookings"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => {
              const primaryGuest = booking.guests.find(g => g.is_primary);
              return (
                <Card key={booking.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {primaryGuest ? `${primaryGuest.first_name} ${primaryGuest.last_name}` : 'Guest'}
                          </h3>
                          <Badge variant="secondary" className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{formatDate(booking.start_date)} - {formatDate(booking.end_date)}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{booking.guest_count} guests • {booking.nights} nights</span>
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span className="font-semibold text-foreground">{formatCurrency(booking.total)}</span>
                          </div>
                        </div>

                        {primaryGuest && (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              <span>{primaryGuest.email}</span>
                            </div>
                            {primaryGuest.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                <span>{primaryGuest.phone}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-foreground mb-2">Booking Info</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">ID:</span> {booking.id}</p>
                                    <p><span className="text-muted-foreground">Status:</span> 
                                      <Badge variant="secondary" className={`ml-2 ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                      </Badge>
                                    </p>
                                    <p><span className="text-muted-foreground">Booked:</span> {formatDate(booking.created_at)}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground mb-2">Stay Details</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Check-in:</span> {formatDate(booking.start_date)}</p>
                                    <p><span className="text-muted-foreground">Check-out:</span> {formatDate(booking.end_date)}</p>
                                    <p><span className="text-muted-foreground">Guests:</span> {booking.guest_count}</p>
                                    <p><span className="text-muted-foreground">Nights:</span> {booking.nights}</p>
                                  </div>
                                </div>
                              </div>

                              {primaryGuest && (
                                <div>
                                  <h4 className="font-semibold text-foreground mb-2">Guest Information</h4>
                                  <div className="bg-muted/30 p-4 rounded-lg">
                                    <p className="font-medium">{primaryGuest.first_name} {primaryGuest.last_name}</p>
                                    <p className="text-sm text-muted-foreground">{primaryGuest.email}</p>
                                    {primaryGuest.phone && (
                                      <p className="text-sm text-muted-foreground">{primaryGuest.phone}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div>
                                <h4 className="font-semibold text-foreground mb-2">Payment</h4>
                                <div className="bg-emerald-50 p-4 rounded-lg">
                                  <p className="text-lg font-semibold text-emerald-800">
                                    {formatCurrency(booking.total)} {booking.currency}
                                  </p>
                                  <p className="text-sm text-emerald-600">
                                    {booking.status === 'confirmed' ? 'Payment completed' : 'Payment pending'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No bookings found</p>
                  {searchTerm || statusFilter ? (
                    <p className="text-sm">Try adjusting your filters</p>
                  ) : (
                    <p className="text-sm">Your first booking will appear here</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
