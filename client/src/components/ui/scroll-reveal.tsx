import { motion } from 'framer-motion';
import { useScrollReveal, useStaggeredReveal } from '@/hooks/use-scroll-reveal';
import { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  threshold?: number;
  as?: keyof typeof motion;
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  distance = 50,
  direction = 'up',
  threshold = 0.1,
  as = 'div'
}: ScrollRevealProps) {
  const { ref, animate, variants, initial } = useScrollReveal({
    delay,
    distance,
    direction,
    threshold,
    rootMargin: '0px 0px -50px 0px',
  });

  const MotionComponent = motion[as] as any;

  return (
    <MotionComponent
      ref={ref}
      className={className}
      initial={initial}
      animate={animate}
      variants={variants}
      viewport={{ once: true, amount: 0.2 }}
    >
      {children}
    </MotionComponent>
  );
}

interface StaggeredRevealProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  distance?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  threshold?: number;
  itemClassName?: string;
  as?: keyof typeof motion;
  itemAs?: keyof typeof motion;
}

export function StaggeredReveal({
  children,
  className = '',
  staggerDelay = 0.1,
  distance = 50,
  direction = 'up',
  threshold = 0.1,
  itemClassName = '',
  as = 'div',
  itemAs = 'div'
}: StaggeredRevealProps) {
  const { 
    ref, 
    containerVariants, 
    itemVariants, 
    animate, 
    initial 
  } = useStaggeredReveal(children.length, {
    staggerDelay,
    distance,
    direction,
    threshold,
    rootMargin: '0px 0px -50px 0px',
  });

  const MotionContainer = motion[as] as any;
  const MotionItem = motion[itemAs] as any;

  return (
    <MotionContainer
      ref={ref}
      className={className}
      initial={initial}
      animate={animate}
      variants={containerVariants}
      viewport={{ once: true, amount: 0.2 }}
    >
      {children.map((child, index) => (
        <MotionItem
          key={index}
          className={itemClassName}
          variants={itemVariants}
        >
          {child}
        </MotionItem>
      ))}
    </MotionContainer>
  );
}