import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Smoothly scrolls to the top of the page
 * @param behavior - The scroll behavior ('smooth' or 'instant')
 */
export function scrollToTop(behavior: ScrollBehavior = 'instant') {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior
  });
}

/**
 * Checks if the current URL contains a hash that should prevent scroll-to-top
 * @param pathname - The current pathname
 * @returns true if scroll-to-top should be prevented
 */
export function shouldPreventScrollToTop(pathname: string): boolean {
  // Allow hash navigation for same-page anchors
  return window.location.hash.length > 0 && window.location.pathname === pathname;
}
