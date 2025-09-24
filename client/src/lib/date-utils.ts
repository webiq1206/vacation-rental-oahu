import { format, parseISO, differenceInDays, addDays } from 'date-fns';

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
}

export function formatDateInput(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  return format(dateObj, 'yyyy-MM-dd');
}

export function calculateNights(startDate: string, endDate: string): number {
  return differenceInDays(parseISO(endDate), parseISO(startDate));
}

export function getTomorrowDate(): string {
  return formatDateInput(addDays(new Date(), 1));
}

export function getMinCheckoutDate(checkInDate: string): string {
  if (!checkInDate) return getTomorrowDate();
  const checkInDateObj = parseISO(checkInDate);
  if (isNaN(checkInDateObj.getTime())) return getTomorrowDate();
  return formatDateInput(addDays(checkInDateObj, 1));
}

export function isDateInPast(date: string): boolean {
  return parseISO(date) < new Date();
}
