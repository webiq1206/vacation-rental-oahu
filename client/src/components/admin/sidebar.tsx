import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Calendar, 
  BookOpen, 
  DollarSign, 
  FileText, 
  Settings,
  LogOut,
  Edit,
  BarChart3,
  Star,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import logoPath from "@assets/Vacation Rental Oahu Logo_1758651723145.png";

export function AdminSidebar() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Home,
      current: location === "/admin"
    },
    {
      name: "Bookings",
      href: "/admin/bookings",
      icon: BookOpen,
      current: location === "/admin/bookings"
    },
    {
      name: "Calendar",
      href: "/admin/calendar",
      icon: Calendar,
      current: location === "/admin/calendar"
    },
    {
      name: "Content Management",
      href: "/admin/content-management",
      icon: Edit,
      current: location === "/admin/content-management"
    },
    {
      name: "Page Builder",
      href: "/admin/page-builder",
      icon: Layout,
      current: location === "/admin/page-builder"
    },
    {
      name: "Pricing & Taxes",
      href: "/admin/pricing",
      icon: DollarSign,
      current: location === "/admin/pricing"
    },
    {
      name: "Reports & Analytics",
      href: "/admin/reporting",
      icon: BarChart3,
      current: location === "/admin/reporting"
    },
    {
      name: "Reviews",
      href: "/admin/reviews",
      icon: Star,
      current: location === "/admin/reviews"
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: location === "/admin/settings"
    }
  ];

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border min-h-screen">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-border">
        <img 
          src={logoPath} 
          alt="VacationRentalOahu.co" 
          className="h-8 w-auto mr-3" 
        />
        <div>
          <h1 className="text-lg font-bold text-foreground">VacationRental</h1>
          <p className="text-xs text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  item.current
                    ? "bg-coral-100 text-coral-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-4 py-4 border-t border-border">
        <Link href="/">
          <Button variant="outline" size="sm" className="w-full mb-2">
            View Site
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-destructive"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="admin-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
