import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './BackToTop.css';

/**
 * BackToTop Component
 * 
 * A floating button that appears after scrolling 300px.
 * Features:
 * - Smooth scroll to top on click
 * - Rotation animation on appearance
 * - Pulse effect when idle
 * - Gradient background with glow
 */
const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Show button after scrolling 300px
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className={`back-to-top ${isHovered ? 'hovered' : ''}`}
          onClick={scrollToTop}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          initial={{ opacity: 0, y: 20, scale: 0.8, rotate: -180 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.8, rotate: 180 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.4
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Back to top"
          title="Back to top"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
          
          {/* Pulse ring effect */}
          <span className="back-to-top-pulse" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default BackToTop;
