import { motion, useAnimation, Variants, useReducedMotion } from 'framer-motion';
import { useIntersectionObserver } from './use-intersection-observer';
import { useEffect, useMemo } from 'react';

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  duration?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

// Legacy function for backward compatibility - now using framer-motion's useReducedMotion
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Animation variants for different reveal directions with accessibility support
const createRevealVariants = (
  distance: number = 50,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  reducedMotion: boolean = false
): Variants => {
  const getInitialTransform = () => {
    switch (direction) {
      case 'up':
        return { y: distance };
      case 'down':
        return { y: -distance };
      case 'left':
        return { x: distance };
      case 'right':
        return { x: -distance };
      default:
        return { y: distance };
    }
  };

  return {
    hidden: {
      opacity: 0,
      ...(!reducedMotion ? getInitialTransform() : {}),
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: reducedMotion ? {
        duration: 0.01, // Nearly instant for reduced motion
        ease: 'easeOut'
      } : {
        type: 'spring',
        stiffness: 100,
        damping: 20,
        mass: 1,
        duration: 0.6
      }
    }
  };
};

export function useScrollReveal<T extends HTMLElement>(
  options: UseScrollRevealOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    delay = 0,
    distance = 50,
    direction = 'up'
  } = options;

  const controls = useAnimation();
  const reducedMotion = useReducedMotion();
  const { elementRef, isIntersecting, hasIntersected } = useIntersectionObserver<T>({
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  const variants = createRevealVariants(distance, direction, reducedMotion);

  useEffect(() => {
    if (hasIntersected) {
      const timeout = reducedMotion ? 0 : delay;
      const timer = setTimeout(() => {
        controls.start('visible');
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [controls, hasIntersected, delay, reducedMotion]);

  return {
    ref: elementRef,
    animate: controls,
    variants,
    initial: 'hidden',
    isIntersecting,
    hasIntersected
  };
}

// Staggered children reveal hook
export function useStaggeredReveal<T extends HTMLElement>(
  itemCount: number,
  options: UseScrollRevealOptions & { staggerDelay?: number } = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    staggerDelay = 0.1,
    distance = 50,
    direction = 'up'
  } = options;

  const { elementRef, hasIntersected } = useIntersectionObserver<T>({
    threshold,
    rootMargin,
    freezeOnceVisible: true,
  });

  const reducedMotion = useReducedMotion();
  
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: reducedMotion ? 0 : staggerDelay,
      }
    }
  };

  const itemVariants = createRevealVariants(distance, direction, reducedMotion);

  return {
    ref: elementRef,
    containerVariants,
    itemVariants,
    animate: hasIntersected ? 'visible' : 'hidden',
    initial: 'hidden'
  };
}