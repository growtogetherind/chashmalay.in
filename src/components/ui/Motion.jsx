import React from 'react';
import { motion } from 'framer-motion';

// Luxury Easing Curves
export const TRANSITIONS = {
  cinema: { ease: [0.25, 1, 0.5, 1], duration: 0.8 },
  cinemaIn: { ease: [0.22, 1, 0.36, 1], duration: 0.6 },
  spring: { type: "spring", bounce: 0.15, duration: 0.6 }
};

export const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ ...TRANSITIONS.cinema, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerContainer = ({ children, className = "" }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className = "" }) => {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: TRANSITIONS.cinema }
  };

  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
};

export const RevealText = ({ text, delay = 0, className = "" }) => {
  return (
    <span className={`inline-block overflow-hidden ${className}`}>
      <motion.span
        className="inline-block"
        initial={{ y: "100%", opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ ...TRANSITIONS.cinema, delay }}
      >
        {text}
      </motion.span>
    </span>
  );
};
