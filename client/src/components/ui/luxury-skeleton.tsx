import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useMotionPreferences } from "@/hooks/use-motion-preferences";

interface LuxurySkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "shimmer" | "pulse" | "wave";
  speed?: "slow" | "normal" | "fast";
}

interface SkeletonImageProps extends LuxurySkeletonProps {
  aspectRatio?: "1/1" | "3/2" | "4/3" | "16/9" | "21/9";
  width?: string;
  height?: string;
}

interface SkeletonTextProps extends LuxurySkeletonProps {
  lines?: number;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
}

interface SkeletonCardProps extends LuxurySkeletonProps {
  hasImage?: boolean;
  hasAvatar?: boolean;
  textLines?: number;
}

// Base skeleton component
const LuxurySkeleton = ({
  className,
  variant = "shimmer",
  speed = "normal",
  ...props
}: LuxurySkeletonProps) => {
  const { preferReducedMotion } = useMotionPreferences();
  
  const speedConfig = {
    slow: "2.5s",
    normal: "1.5s",
    fast: "1s"
  };

  // Use static variant for reduced motion
  const actualVariant = preferReducedMotion ? "default" : variant;
  
  const baseClass = cn(
    "bg-gradient-to-r from-bronze-100 via-bronze-200 to-bronze-100",
    "dark:from-bronze-800 dark:via-bronze-700 dark:to-bronze-800",
    "rounded-xl",
    actualVariant === "shimmer" && "animate-shimmer bg-[length:200%_100%]",
    actualVariant === "pulse" && "animate-pulse",
    actualVariant === "wave" && "animate-pulse",
    className
  );

  const style = actualVariant === "shimmer" && !preferReducedMotion ? {
    animationDuration: speedConfig[speed]
  } : {};

  if (actualVariant === "wave" && !preferReducedMotion) {
    return (
      <motion.div
        className={baseClass}
        initial={{ opacity: 0.3, scaleX: 0.8 }}
        animate={{ 
          opacity: [0.3, 0.8, 0.3],
          scaleX: [0.8, 1, 0.8]
        }}
        transition={{
          duration: parseFloat(speedConfig[speed]),
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={style}
        data-motion-safe
        {...props}
      />
    );
  }

  return (
    <div 
      className={baseClass} 
      style={style} 
      data-motion-preference={preferReducedMotion ? "reduce" : "allow"}
      {...props} 
    />
  );
};

// Skeleton for images with luxury shimmer effect
const SkeletonImage = ({
  aspectRatio = "16/9",
  width,
  height,
  className,
  variant = "shimmer",
  speed = "normal",
  ...props
}: SkeletonImageProps) => {
  const { preferReducedMotion } = useMotionPreferences();
  const aspectClass = `aspect-${aspectRatio}`;
  
  return (
    <div className={cn("relative overflow-hidden", className)} {...props}>
      <LuxurySkeleton
        variant={variant}
        speed={speed}
        className={cn(
          "w-full",
          width ? `w-${width}` : "w-full",
          height ? `h-${height}` : aspectClass,
          "rounded-2xl shadow-lg"
        )}
      />
      
      {/* Luxury highlight overlay - motion-aware */}
      {!preferReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
          data-motion-safe
        />
      )}
      
      {/* Bronze accent in corner */}
      <div className="absolute top-4 right-4 w-3 h-3 bg-bronze-300 rounded-full opacity-50" />
    </div>
  );
};

// Skeleton for text with luxury typography feel
const SkeletonText = ({
  lines = 3,
  size = "base",
  className,
  variant = "shimmer",
  speed = "normal",
  ...props
}: SkeletonTextProps) => {
  const sizeConfig = {
    xs: "h-3",
    sm: "h-4",
    base: "h-4",
    lg: "h-5",
    xl: "h-6",
    "2xl": "h-7",
    "3xl": "h-8",
    "4xl": "h-10"
  };

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => {
        const widthVariations = ["w-full", "w-5/6", "w-4/5", "w-3/4", "w-2/3"];
        const isLastLine = i === lines - 1;
        const width = isLastLine && lines > 1 ? widthVariations[Math.min(i + 1, widthVariations.length - 1)] : "w-full";
        
        return (
          <LuxurySkeleton
            key={i}
            variant={variant}
            speed={speed}
            className={cn(
              sizeConfig[size],
              width,
              "rounded-lg"
            )}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        );
      })}
    </div>
  );
};

// Skeleton for cards with luxury design elements
const SkeletonCard = ({
  hasImage = true,
  hasAvatar = false,
  textLines = 3,
  className,
  variant = "shimmer",
  speed = "normal",
  ...props
}: SkeletonCardProps) => {
  return (
    <div 
      className={cn(
        "relative p-6 rounded-3xl border border-bronze-200/20",
        "bg-gradient-to-br from-white/80 via-white/60 to-white/40",
        "dark:from-bronze-950/80 dark:via-bronze-900/60 dark:to-bronze-800/40",
        "dark:border-bronze-700/20 shadow-xl backdrop-blur-sm",
        className
      )} 
      {...props}
    >
      {/* Luxury border accent */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-bronze-200/20 via-transparent to-bronze-300/20 p-px">
        <div className="w-full h-full rounded-3xl bg-gradient-to-br from-white/90 to-white/60 dark:from-bronze-950/90 dark:to-bronze-900/60" />
      </div>
      
      <div className="relative space-y-4">
        {hasImage && (
          <SkeletonImage
            aspectRatio="16/9"
            variant={variant}
            speed={speed}
            className="rounded-2xl"
          />
        )}
        
        <div className="space-y-4">
          {hasAvatar && (
            <div className="flex items-center space-x-4">
              <LuxurySkeleton
                variant={variant}
                speed={speed}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1 space-y-2">
                <LuxurySkeleton
                  variant={variant}
                  speed={speed}
                  className="h-4 w-1/3 rounded-lg"
                />
                <LuxurySkeleton
                  variant={variant}
                  speed={speed}
                  className="h-3 w-1/4 rounded-lg"
                />
              </div>
            </div>
          )}
          
          <SkeletonText
            lines={textLines}
            variant={variant}
            speed={speed}
          />
        </div>
      </div>
    </div>
  );
};

// Gallery skeleton with luxury grid
const SkeletonGallery = ({
  items = 6,
  className,
  variant = "shimmer",
  speed = "normal",
  ...props
}: LuxurySkeletonProps & { items?: number }) => {
  const { preferReducedMotion } = useMotionPreferences();
  
  return (
    <div 
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )} 
      {...props}
    >
      {Array.from({ length: items }).map((_, i) => {
        const isFeatured = i === 0;
        const MotionWrapper = preferReducedMotion ? 'div' : motion.div;
        const motionProps = preferReducedMotion ? {} : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: i * 0.1, duration: 0.6 }
        };
        
        return (
          <MotionWrapper
            key={i}
            {...motionProps}
            className={cn(
              "relative",
              isFeatured && "md:col-span-2 lg:row-span-2"
            )}
            data-motion-preference={preferReducedMotion ? "reduce" : "allow"}
          >
            <SkeletonImage
              aspectRatio={isFeatured ? "4/3" : "3/2"}
              variant={variant}
              speed={speed}
              className="w-full h-full min-h-[200px]"
            />
          </MotionWrapper>
        );
      })}
    </div>
  );
};

// Progressive loading wrapper
interface ProgressiveLoaderProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const ProgressiveLoader = ({
  isLoading,
  skeleton,
  children,
  delay = 0,
  className
}: ProgressiveLoaderProps) => {
  const { preferReducedMotion } = useMotionPreferences();
  
  if (preferReducedMotion) {
    return (
      <div 
        className={className}
        data-motion-preference="reduce"
      >
        {isLoading ? skeleton : children}
      </div>
    );
  }
  
  return (
    <motion.div 
      className={className}
      initial={false}
      animate={isLoading ? "loading" : "loaded"}
      variants={{
        loading: { opacity: 1 },
        loaded: { opacity: 1 }
      }}
      transition={{ delay, duration: 0.4 }}
      data-motion-safe
    >
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
};

export {
  LuxurySkeleton,
  SkeletonImage,
  SkeletonText,
  SkeletonCard,
  SkeletonGallery,
  ProgressiveLoader
};