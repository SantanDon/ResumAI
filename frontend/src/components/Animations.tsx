import { motion } from 'framer-motion';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

// Animated Background Component (adapted from ReactBits)
export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  );
}

// Morphing Shapes Component (for CV template flips)
export function MorphingShape({ isCircle }: { isCircle: boolean }) {
  return (
    <motion.div
      layoutId="morph-shape"
      className={`w-20 h-20 ${isCircle ? 'rounded-full' : 'rounded-none'} bg-gradient-to-r from-purple-500 to-pink-500`}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    />
  );
}

// Loading Skeleton Component
export function LoadingSkeleton({ count = 3 }: { count?: number }) {
  return (
    <SkeletonTheme baseColor="#374151" highlightColor="#4b5563">
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} height={60} className="rounded-xl" />
        ))}
      </div>
    </SkeletonTheme>
  );
}