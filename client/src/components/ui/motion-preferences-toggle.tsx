import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Sparkles, Settings } from "lucide-react";
import { useMotionPreferences } from "@/hooks/use-motion-preferences";
import { cn } from "@/lib/utils";

interface MotionPreferencesToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: "inline" | "card" | "icon-only";
}

export function MotionPreferencesToggle({ 
  className, 
  showLabel = true, 
  variant = "inline" 
}: MotionPreferencesToggleProps) {
  const { 
    preferReducedMotion, 
    userOverride, 
    setUserOverride, 
    toggleMotion 
  } = useMotionPreferences();

  const getStatusText = () => {
    if (userOverride === null) {
      return preferReducedMotion ? "System: Reduced" : "System: Normal";
    }
    return userOverride ? "User: Reduced" : "User: Normal";
  };

  const getStatusBadgeVariant = () => {
    if (preferReducedMotion) {
      return "secondary";
    }
    return "outline";
  };

  if (variant === "icon-only") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMotion}
        className={cn(
          "w-10 h-10 rounded-full",
          "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-bronze-600",
          className
        )}
        aria-label={
          preferReducedMotion 
            ? "Enable animations and motion effects" 
            : "Reduce animations and motion effects"
        }
        data-testid="motion-toggle-icon"
      >
        {preferReducedMotion ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    );
  }

  if (variant === "card") {
    return (
      <div 
        className={cn(
          "p-4 rounded-lg border border-border bg-card",
          "space-y-4",
          className
        )}
        role="group"
        aria-labelledby="motion-preferences-heading"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 
              id="motion-preferences-heading"
              className="text-sm font-medium text-foreground"
            >
              Motion Preferences
            </h3>
            <p className="text-xs text-muted-foreground">
              Control animations and transitions
            </p>
          </div>
          <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-foreground">Reduce motion</div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant()} className="text-xs">
                  {getStatusText()}
                </Badge>
              </div>
            </div>
            <Switch
              checked={preferReducedMotion}
              onCheckedChange={toggleMotion}
              aria-describedby="motion-switch-description"
              data-testid="motion-toggle-switch"
            />
          </div>
          
          <p 
            id="motion-switch-description"
            className="text-xs text-muted-foreground"
          >
            {preferReducedMotion 
              ? "Animations and transitions are minimized for better accessibility"
              : "Normal animations and transitions are enabled"
            }
          </p>
          
          {userOverride !== null && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserOverride(null)}
              className="text-xs h-8"
              data-testid="motion-reset-button"
            >
              Use system preference
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default inline variant
  return (
    <div 
      className={cn(
        "flex items-center gap-3",
        className
      )}
      role="group"
      aria-labelledby={showLabel ? "motion-toggle-label" : undefined}
    >
      {showLabel && (
        <label 
          id="motion-toggle-label"
          htmlFor="motion-preferences-switch"
          className="text-sm font-medium text-foreground cursor-pointer"
        >
          Reduce motion
        </label>
      )}
      
      <Switch
        id="motion-preferences-switch"
        checked={preferReducedMotion}
        onCheckedChange={toggleMotion}
        aria-describedby="motion-status"
        data-testid="motion-toggle-switch"
      />
      
      <Badge 
        variant={getStatusBadgeVariant()} 
        className="text-xs min-w-[5rem] justify-center"
        id="motion-status"
        aria-live="polite"
      >
        {getStatusText()}
      </Badge>
      
      {userOverride !== null && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUserOverride(null)}
          className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
          aria-label="Reset to system motion preference"
          data-testid="motion-reset-button"
        >
          Reset
        </Button>
      )}
    </div>
  );
}