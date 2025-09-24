import { useMotionValue, useTransform, useScroll, animate } from 'framer-motion';
import { useRef } from 'react';

interface UseParallaxOptions {
  speed?: number;
  offset?: number[];
  reverse?: boolean;
}

export function useParallax<T extends HTMLElement>(
  options: UseParallaxOptions = {}
) {
  const {
    speed = 0.5,
    offset = [0, 1],
    reverse = false
  } = options;

  const ref = useRef<T>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const direction = reverse ? -1 : 1;
  const y = useTransform(
    scrollYProgress, 
    offset, 
    [`${-100 * speed * direction}px`, `${100 * speed * direction}px`]
  );

  return { ref, y };
}

// Hook for bronze sheen animation
export function useBronzeSheen() {
  const x = useMotionValue(0);
  const opacity = useMotionValue(0);

  const triggerSheen = () => {
    // Check if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    x.set(-100);
    opacity.set(0.6);
    
    // Animate the sheen across
    const animation = animate(x, 100, {
      duration: 1.2,
      ease: "easeInOut",
    });

    // Fade out opacity at the end
    setTimeout(() => {
      animate(opacity, 0, { duration: 0.3 });
    }, 1000);

    return animation;
  };

  return { x, opacity, triggerSheen };
}