import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const RevealText = ({ text, delay = 0, className = '' }) => {
  // Split text into words, then characters
  const words = text.split(" ");

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.03, delayChildren: delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      style={{ overflow: "hidden", display: "flex", flexWrap: "wrap" }}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span key={index} style={{ marginRight: "0.25em", whiteSpace: "nowrap" }}>
          {word.split("").map((char, index) => (
            <motion.span
              style={{ display: "inline-block" }}
              variants={child}
              key={index}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      ))}
    </motion.div>
  );
};

export default RevealText;
