import { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useBooking } from "@/hooks/use-booking-context";
import { 
  formatDate, 
  getTomorrowDate, 
  getMinCheckoutDate, 
  isDateInPast 
} from "@/lib/date-utils";
import { DateRange } from "react-day-picker";

interface DateRangeFieldProps {
  className?: string;
  error?: boolean;
  minNights?: number;
  onValidationChange?: (isValid: boolean) => void;
}

export function DateRangeField({ 
  className, 
  error, 
  minNights = 1,
  onValidationChange 
}: DateRangeFieldProps) {
  const { checkIn, checkOut, updateBookingDates, hasValidDates } = useBooking();
  
  const [isOpen, setIsOpen] = useState(false);
  const [announceText, setAnnounceText] = useState("");
  const [activeField, setActiveField] = useState<'checkin' | 'checkout' | null>(null);
  
  // Refs for focus management
  const checkinRef = useRef<HTMLButtonElement>(null);
  const checkoutRef = useRef<HTMLButtonElement>(null);

  // Convert string dates to Date objects for the calendar
  const dateRange: DateRange | undefined = 
    checkIn && checkOut 
      ? { from: new Date(checkIn), to: new Date(checkOut) }
      : checkIn 
      ? { from: new Date(checkIn), to: undefined }
      : undefined;

  // Validation effect
  useEffect(() => {
    const isValid = hasValidDates();
    onValidationChange?.(isValid);
  }, [checkIn, checkOut, hasValidDates, onValidationChange]);

  // Format date for display
  const formatDisplayDate = (date: string) => {
    if (!date) return "";
    try {
      return format(new Date(date), "MMM dd");
    } catch {
      return "";
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) return;

    const fromDate = range.from ? format(range.from, "yyyy-MM-dd") : "";
    const toDate = range.to ? format(range.to, "yyyy-MM-dd") : "";

    if (fromDate && toDate) {
      // Both dates selected
      updateBookingDates(fromDate, toDate);
      setAnnounceText(`Dates selected: ${formatDate(fromDate)} to ${formatDate(toDate)}`);
      setIsOpen(false);
      setActiveField(null);
    } else if (fromDate) {
      // Only start date selected
      updateBookingDates(fromDate);
      setAnnounceText(`Check-in date selected: ${formatDate(fromDate)}. Please select checkout date.`);
      setActiveField('checkout');
    }
  };

  // Handle clearing dates
  const handleClear = () => {
    updateBookingDates("", "");
    setAnnounceText("Dates cleared");
    setActiveField(null);
  };

  // Handle individual field clicks
  const handleFieldClick = (field: 'checkin' | 'checkout') => {
    setActiveField(field);
    setIsOpen(true);
  };

  // Determine if dates should be disabled
  const isDateDisabled = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    // Disable past dates
    if (isDateInPast(dateStr)) return true;
    
    // If we have a checkin date and this is for checkout selection
    if (checkIn && activeField === 'checkout') {
      const minCheckout = getMinCheckoutDate(checkIn);
      const minDate = new Date(minCheckout);
      
      // Add minimum nights requirement
      if (minNights > 1) {
        minDate.setDate(minDate.getDate() + minNights - 1);
      }
      
      return date < minDate;
    }
    
    return false;
  };

  // Check if we have any dates selected
  const hasDatesSelected = Boolean(checkIn || checkOut);
  const hasCompleteDates = Boolean(checkIn && checkOut);

  // Style classes for Airbnb-like appearance
  const triggerBaseClasses = cn(
    "h-14 px-4 justify-start text-left font-normal border rounded-lg",
    "hover:bg-muted/50 focus:ring-2 focus:ring-offset-2 focus:ring-ring",
    "transition-all duration-200 relative overflow-hidden",
    "bg-background border-border",
    error && "border-destructive focus:ring-destructive"
  );

  const labelClasses = "text-luxury-xs font-serif font-normal text-muted-foreground uppercase tracking-luxury-tight";
  const dateClasses = "text-luxury-sm font-serif font-normal text-foreground mt-0.5";
  const placeholderClasses = "text-luxury-sm font-serif font-normal text-muted-foreground mt-0.5";

  return (
    <div className={cn("relative", className)}>
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announceText}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <div 
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 border rounded-lg overflow-hidden bg-background",
            "hover:shadow-md transition-shadow duration-200",
            error && "border-destructive"
          )}
          data-testid="date-range-field"
        >
          {/* Check-in Field */}
          <PopoverTrigger asChild>
            <Button
              ref={checkinRef}
              variant="ghost"
              className={cn(
                triggerBaseClasses,
                "rounded-r-none border-r-0",
                activeField === 'checkin' && "bg-muted/50 ring-2 ring-ring ring-offset-0"
              )}
              onClick={() => handleFieldClick('checkin')}
              data-testid="trigger-checkin"
              aria-label="Select check-in date"
              aria-describedby="checkin-help"
            >
              <div className="flex flex-col items-start w-full">
                <span className={labelClasses}>Check-in</span>
                {checkIn ? (
                  <span className={dateClasses}>{formatDisplayDate(checkIn)}</span>
                ) : (
                  <span className={placeholderClasses}>Add dates</span>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          
          <div id="checkin-help" className="sr-only">
            Select your arrival date. Must be today or later.
          </div>

          {/* Check-out Field */}
          <PopoverTrigger asChild>
            <Button
              ref={checkoutRef}
              variant="ghost"
              className={cn(
                triggerBaseClasses,
                "rounded-l-none",
                activeField === 'checkout' && "bg-muted/50 ring-2 ring-ring ring-offset-0"
              )}
              onClick={() => handleFieldClick('checkout')}
              data-testid="trigger-checkout"
              aria-label="Select check-out date"
              aria-describedby="checkout-help"
            >
              <div className="flex flex-col items-start w-full">
                <span className={labelClasses}>Check-out</span>
                {checkOut ? (
                  <span className={dateClasses}>{formatDisplayDate(checkOut)}</span>
                ) : (
                  <span className={placeholderClasses}>Add dates</span>
                )}
              </div>
            </Button>
          </PopoverTrigger>
          
          <div id="checkout-help" className="sr-only">
            Select your departure date. Must be after check-in date.
          </div>
        </div>

        <PopoverContent 
          className="w-auto max-w-[calc(100vw-2rem)] p-0 border-0 shadow-2xl" 
          align="center"
          side="bottom"
          sideOffset={8}
          data-testid="calendar-popover"
        >
          <div className="bg-popover rounded-2xl border border-border overflow-hidden">
            {/* Header with clear button */}
            {hasDatesSelected && (
              <div className="flex justify-between items-center p-4 border-b border-border">
                <div className="text-luxury-sm font-serif font-normal text-muted-foreground">
                  {hasCompleteDates ? (
                    <>
                      {formatDate(checkIn!)} → {formatDate(checkOut!)}
                    </>
                  ) : checkIn ? (
                    <>Check-in: {formatDate(checkIn)}</>
                  ) : (
                    "Select dates"
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-luxury-xs font-serif font-normal text-muted-foreground hover:text-foreground p-1 h-auto"
                  data-testid="button-clear"
                  aria-label="Clear selected dates"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Calendar */}
            <div className="p-4">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                disabled={isDateDisabled}
                showOutsideDays={false}
                className="border-0"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-6 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center mb-4",
                  caption_label: "text-luxury-base font-serif font-normal text-foreground",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(
                    "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100",
                    "hover:bg-muted rounded-full transition-colors"
                  ),
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex mb-2",
                  head_cell: "text-muted-foreground rounded-md w-10 font-serif font-normal text-luxury-sm py-2",
                  row: "flex w-full mt-1",
                  cell: cn(
                    "h-10 w-10 text-center text-luxury-sm font-serif font-normal p-0 relative",
                    "[&:has([aria-selected].day-range-end)]:rounded-r-full",
                    "[&:has([aria-selected].day-range-start)]:rounded-l-full",
                    "[&:has([aria-selected])]:bg-muted",
                    "focus-within:relative focus-within:z-20"
                  ),
                  day: cn(
                    "h-10 w-10 p-0 font-serif font-normal text-luxury-sm rounded-full",
                    "hover:bg-muted focus:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
                    "aria-selected:opacity-100 transition-colors"
                  ),
                  day_range_start: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-full",
                  day_range_end: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-full",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-full",
                  day_today: "bg-foreground text-background font-semibold rounded-full",
                  day_outside: "text-muted-foreground/50 aria-selected:bg-muted/50 aria-selected:text-muted-foreground/70",
                  day_disabled: "text-muted-foreground/50 opacity-50 cursor-not-allowed",
                  day_range_middle: "aria-selected:bg-muted aria-selected:text-foreground rounded-none",
                  day_hidden: "invisible",
                }}
                data-testid="calendar-range"
                aria-label="Select date range for your stay"
              />
            </div>

            {/* Footer with instructions */}
            <div className="px-4 pb-4 text-luxury-xs font-serif font-normal text-muted-foreground">
              {!checkIn ? (
                "Select your check-in date"
              ) : !checkOut ? (
                "Select your check-out date"
              ) : (
                `${Math.max(1, minNights)} night minimum stay`
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Error message */}
      {error && (
        <div 
          className="mt-1 text-luxury-sm font-serif font-normal text-destructive"
          role="alert"
          data-testid="error-message"
        >
          Please select valid check-in and check-out dates
        </div>
      )}
    </div>
  );
}