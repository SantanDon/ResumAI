import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  sequential?: boolean;
  revealDirection?: 'start' | 'end' | 'center';
  useOriginalCharsOnly?: boolean;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover';
}

export const DecryptedText = ({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'hover',
}: DecryptedTextProps) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const revealedIndices = useRef(new Set<number>());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';

  const scramble = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsScrambling(true);
    let iteration = 0;

    intervalRef.current = setInterval(() => {
      const scrambled = text
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          if (revealedIndices.current.has(index) || iteration >= maxIterations) {
            return char;
          }
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      setDisplayText(scrambled);
      iteration++;

      if (iteration > maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsScrambling(false);
        setDisplayText(text);
      }
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      scramble();
    }
  }, [animateOn]);

  const handleMouseEnter = () => {
    if (animateOn === 'hover' && !isScrambling) {
      setIsHovering(true);
      scramble();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <span
      className={`inline-block whitespace-nowrap ${parentClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className={className}>{displayText}</span>
    </span>
  );
};
