import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Determines if the current route is a "child" (detail) screen
const isChildRoute = (pathname) => {
  const childPatterns = [/\/artistes\/.+/, /\/actualites\/.+/];
  return childPatterns.some((p) => p.test(pathname));
};

const variants = {
  initial: (isChild) => ({ x: isChild ? '100%' : 0, opacity: isChild ? 0 : 1 }),
  animate: { x: 0, opacity: 1 },
  exit: (isChild) => ({ x: isChild ? '100%' : 0, opacity: isChild ? 0 : 1 }),
};

export default function PageTransition({ children }) {
  const location = useLocation();
  const child = isChildRoute(location.pathname);

  return (
    <motion.div
      key={location.pathname}
      custom={child}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'tween', duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.div>
  );
}