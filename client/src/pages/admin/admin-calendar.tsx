import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/sidebar";
import { useSEO } from "@/lib/seo-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, X, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/pricing-utils";

const blackoutSchema = z.object({
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
});

type BlackoutForm = z.infer<typeof blackoutSchema>;

interface BlackoutDate {
  id: string;
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
}

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  guests: number;
  status: string;
  guests: Array<{
    first_name: string;
    last_name: string;
    is_primary: boolean;
  }>;
}

export default function AdminCalendar() {
  useSEO({
    title: "Admin Calendar",
    description: "Manage property availability and booking calendar",
    robots: "noindex, nofollow",
    canonical: `${window.location.origin}/admin/calendar`
  });

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: blackoutDates = [], isLoading } = useQuery<BlackoutDate[]>({
    queryKey: ["/api/admin/blackout-dates"],
  });

  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const form = useForm<BlackoutForm>({
    resolver: zodResolver(blackoutSchema),
    defaultValues: {
      start_date: "",
      end_date: "",
      reason: "",
    },
  });

  const createBlackoutMutation = useMutation({
    mutationFn: async (data: BlackoutForm) => {
      const response = await apiRequest("POST", "/api/admin/blackout-dates", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blackout-dates"] });
      toast({
        title: "Blackout dates added",
        description: "The dates have been blocked successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add blackout dates",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BlackoutForm) => {
    if (new Date(data.end_date) <= new Date(data.start_date)) {
      form.setError("end_date", {
        message: "End date must be after start date",
      });
      return;
    }
    createBlackoutMutation.mutate(data);
  };

  // Get the next 6 months for calendar view
  const getMonthsToShow = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      months.push(date);
    }
    
    return months;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getDateStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if date is in blackout dates
    const isBlackedOut = blackoutDates.some(blackout =>
      dateStr >= blackout.start_date && dateStr <= blackout.end_date
    );
    
    // Check if date is booked
    const isBooked = bookings.some(booking =>
      booking.status === 'confirmed' &&
      dateStr >= booking.start_date && 
      dateStr <= booking.end_date
    );
    
    if (isBooked) return { status: 'booked', class: 'bg-emerald-100 text-emerald-800' };
    if (isBlackedOut) return { status: 'blackout', class: 'bg-red-100 text-red-800' };
    if (date < new Date()) return { status: 'past', class: 'bg-gray-100 text-gray-400' };
    return { status: 'available', class: 'hover:bg-muted' };
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
            <p className="text-muted-foreground">
              Manage availability and blackout dates
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-bronze text-white mt-4 sm:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Blackout Dates
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Blackout Dates</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...form.register("start_date")}
                      data-testid="input-start-date"
                    />
                    {form.formState.errors.start_date && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.start_date.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...form.register("end_date")}
                      data-testid="input-end-date"
                    />
                    {form.formState.errors.end_date && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.end_date.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="e.g., Property maintenance, Owner stay, etc."
                    {...form.register("reason")}
                    data-testid="input-reason"
                  />
                  {form.formState.errors.reason && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.reason.message}
                    </p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createBlackoutMutation.isPending}
                  data-testid="submit-blackout"
                >
                  {createBlackoutMutation.isPending ? "Adding..." : "Add Blackout Dates"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Legend */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-emerald-100 border border-emerald-200 rounded" />
                <span className="text-sm text-muted-foreground">Booked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
                <span className="text-sm text-muted-foreground">Blackout</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white border border-border rounded" />
                <span className="text-sm text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded" />
                <span className="text-sm text-muted-foreground">Past</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {getMonthsToShow().map((month, monthIndex) => {
            const days = getDaysInMonth(month);
            const monthName = month.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            });

            return (
              <Card key={monthIndex}>
                <CardHeader>
                  <CardTitle className="text-lg">{monthName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="p-2 text-xs font-medium text-center text-muted-foreground">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, dayIndex) => {
                      if (!day) {
                        return <div key={dayIndex} className="p-2" />;
                      }
                      
                      const { status, class: statusClass } = getDateStatus(day);
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`p-2 text-xs text-center rounded transition-colors cursor-pointer ${statusClass}`}
                          title={status === 'booked' ? 'Booked' : status === 'blackout' ? 'Blackout' : 'Available'}
                        >
                          {day.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Current Blackout Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Current Blackout Dates</CardTitle>
          </CardHeader>
          <CardContent>
            {blackoutDates.length > 0 ? (
              <div className="space-y-4">
                {blackoutDates.map((blackout) => (
                  <div key={blackout.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-foreground">
                            {formatDate(blackout.start_date)} - {formatDate(blackout.end_date)}
                          </span>
                          <Badge variant="destructive">Blocked</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{blackout.reason}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No blackout dates set</p>
                <p className="text-sm">Block dates for maintenance or personal use</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
