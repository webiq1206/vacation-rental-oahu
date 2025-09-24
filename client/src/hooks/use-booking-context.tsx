import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getTomorrowDate, getMinCheckoutDate, isDateInPast } from "@/lib/date-utils";

// Types for booking state
export interface BookingState {
  checkIn: string;
  checkOut: string;
  guests: string;
}

export interface BookingContextType {
  // Current booking state
  checkIn: string;
  checkOut: string;
  guests: string;
  
  // Setters for updating state
  setCheckIn: (date: string) => void;
  setCheckOut: (date: string) => void;
  setGuests: (guests: string) => void;
  
  // Helper functions
  updateBookingDates: (checkIn: string, checkOut?: string) => void;
  resetBooking: () => void;
  
  // Validation helpers
  isValidBooking: () => boolean;
  hasValidDates: () => boolean;
}

// Create the context
const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Storage key for persisting booking data
const BOOKING_STORAGE_KEY = 'vacation-rental-booking-state';

// Default booking values
const getDefaultBookingState = (): BookingState => ({
  checkIn: getTomorrowDate(),
  checkOut: getMinCheckoutDate(getTomorrowDate()),
  guests: "2"
});

// Load booking state from localStorage/sessionStorage
const loadBookingState = (): BookingState => {
  try {
    // Try sessionStorage first (for current session)
    const sessionData = sessionStorage.getItem(BOOKING_STORAGE_KEY);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      // Validate dates aren't in the past
      if (parsed.checkIn && !isDateInPast(parsed.checkIn)) {
        return {
          checkIn: parsed.checkIn || getTomorrowDate(),
          checkOut: parsed.checkOut || getMinCheckoutDate(parsed.checkIn),
          guests: parsed.guests || "2"
        };
      }
    }
    
    // Fall back to localStorage (persistent across sessions)
    const localData = localStorage.getItem(BOOKING_STORAGE_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      // Validate dates aren't in the past
      if (parsed.checkIn && !isDateInPast(parsed.checkIn)) {
        return {
          checkIn: parsed.checkIn || getTomorrowDate(),
          checkOut: parsed.checkOut || getMinCheckoutDate(parsed.checkIn),
          guests: parsed.guests || "2"
        };
      }
    }
  } catch (error) {
    console.warn('Error loading booking state from storage:', error);
  }
  
  // Return default state if no valid stored state
  return getDefaultBookingState();
};

// Save booking state to both localStorage and sessionStorage
const saveBookingState = (state: BookingState) => {
  try {
    const stateData = JSON.stringify(state);
    sessionStorage.setItem(BOOKING_STORAGE_KEY, stateData);
    localStorage.setItem(BOOKING_STORAGE_KEY, stateData);
  } catch (error) {
    console.warn('Error saving booking state to storage:', error);
  }
};

interface BookingProviderProps {
  children: ReactNode;
}

export function BookingProvider({ children }: BookingProviderProps) {
  // Initialize state from storage or defaults
  const [bookingState, setBookingState] = useState<BookingState>(() => loadBookingState());
  
  // Individual state values for easy access
  const { checkIn, checkOut, guests } = bookingState;
  
  // Save to storage whenever state changes
  useEffect(() => {
    saveBookingState(bookingState);
  }, [bookingState]);
  
  // Auto-adjust checkout date when checkin changes
  useEffect(() => {
    if (checkIn && (checkOut <= checkIn || isDateInPast(checkOut))) {
      const newCheckOut = getMinCheckoutDate(checkIn);
      setBookingState(prev => ({ ...prev, checkOut: newCheckOut }));
    }
  }, [checkIn, checkOut]);
  
  // Setters that update the full state
  const setCheckIn = useCallback((date: string) => {
    setBookingState(prev => ({ ...prev, checkIn: date }));
  }, []);
  
  const setCheckOut = useCallback((date: string) => {
    setBookingState(prev => ({ ...prev, checkOut: date }));
  }, []);
  
  const setGuests = useCallback((guests: string) => {
    setBookingState(prev => ({ ...prev, guests }));
  }, []);
  
  // Helper to update both dates at once (useful for date pickers)
  const updateBookingDates = useCallback((newCheckIn: string, newCheckOut?: string) => {
    const autoCheckOut = newCheckOut || getMinCheckoutDate(newCheckIn);
    setBookingState(prev => ({
      ...prev,
      checkIn: newCheckIn,
      checkOut: autoCheckOut
    }));
  }, []);
  
  // Reset to default state
  const resetBooking = useCallback(() => {
    setBookingState(getDefaultBookingState());
  }, []);
  
  // Validation helpers
  const hasValidDates = useCallback((): boolean => {
    return Boolean(checkIn && checkOut && checkIn < checkOut && !isDateInPast(checkIn));
  }, [checkIn, checkOut]);
  
  const isValidBooking = useCallback((): boolean => {
    return hasValidDates() && Boolean(guests && parseInt(guests) > 0);
  }, [hasValidDates, guests]);
  
  const contextValue: BookingContextType = {
    checkIn,
    checkOut,
    guests,
    setCheckIn,
    setCheckOut,
    setGuests,
    updateBookingDates,
    resetBooking,
    isValidBooking,
    hasValidDates,
  };
  
  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
}

// Custom hook to use the booking context
export function useBooking(): BookingContextType {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

// Export context for testing purposes
export { BookingContext };