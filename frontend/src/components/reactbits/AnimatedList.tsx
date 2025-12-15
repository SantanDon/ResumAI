import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedList = ({ children, className = '', delay = 0 }: AnimatedListProps) => {
  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {React.Children.map(children, (child, index) => (
          <motion.div
            key={(child as React.ReactElement).key || index}
            initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
            transition={{
              duration: 0.3,
              delay: delay + index * 0.1,
              type: 'spring',
              damping: 20,
              stiffness: 100
            }}
            layout
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
