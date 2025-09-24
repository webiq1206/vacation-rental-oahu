import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useSEO } from "@/lib/seo-utils";

export default function NotFound() {
  // SEO for 404 page with noindex
  useSEO({
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist. Return to our luxury Oahu vacation rental homepage.",
    robots: "noindex, nofollow",
    canonical: "https://vacationrentaloahu.co/not-found"
  });
  return (
    <main id="main-content" className="min-h-screen w-full flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-luxury-2xl font-serif font-normal text-foreground tracking-luxury-tight">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Did you forget to add the page to the router?
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
