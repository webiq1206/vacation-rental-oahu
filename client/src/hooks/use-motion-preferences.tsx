import { useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';

interface MotionPreferences {
  preferReducedMotion: boolean;
  userOverride: boolean | null; // null = follow system, true = reduce, false = allow
  setUserOverride: (override: boolean | null) => void;
  toggleMotion: () => void;
}

const MOTION_PREFERENCE_KEY = 'motion-preference';

export function useMotionPreferences(): MotionPreferences {
  const systemPreference = useReducedMotion();
  const [userOverride, setUserOverrideState] = useState<boolean | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MOTION_PREFERENCE_KEY);
    if (stored) {
      try {
        const preference = JSON.parse(stored);
        if (preference === null || typeof preference === 'boolean') {
          setUserOverrideState(preference);
        }
      } catch (error) {
        console.warn('Invalid motion preference in localStorage, using system default');
      }
    }
  }, []);

  // Apply motion preference to document
  useEffect(() => {
    const shouldReduceMotion = userOverride !== null ? userOverride : systemPreference;
    
    if (shouldReduceMotion) {
      document.documentElement.setAttribute('data-motion-preference', 'reduce');
    } else {
      document.documentElement.removeAttribute('data-motion-preference');
    }

    // Update CSS custom property for JavaScript access
    document.documentElement.style.setProperty(
      '--reduced-motion', 
      shouldReduceMotion ? '1' : '0'
    );
  }, [userOverride, systemPreference]);

  const setUserOverride = useCallback((override: boolean | null) => {
    setUserOverrideState(override);
    try {
      if (override === null) {
        localStorage.removeItem(MOTION_PREFERENCE_KEY);
      } else {
        localStorage.setItem(MOTION_PREFERENCE_KEY, JSON.stringify(override));
      }
    } catch (error) {
      console.warn('Failed to save motion preference to localStorage');
    }
  }, []);

  const toggleMotion = useCallback(() => {
    const currentPreference = userOverride !== null ? userOverride : systemPreference;
    setUserOverride(!currentPreference);
  }, [userOverride, systemPreference, setUserOverride]);

  return {
    preferReducedMotion: userOverride !== null ? userOverride : systemPreference,
    userOverride,
    setUserOverride,
    toggleMotion
  };
}