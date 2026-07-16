import { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import './ScrollProgress.css';

/**
 * ScrollProgress Component
 * 
 * A thin gradient progress bar at the top of the page showing scroll position.
 * Features:
 * - Gold to purple gradient color
 * - Smooth spring animation
 * - Auto-hide when at top of page
 * - Subtle glow effect
 */
const ScrollProgress = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  
  // Spring physics for smooth animation
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Show/hide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div 
      className={`scroll-progress ${isVisible ? 'visible' : ''}`}
      style={{ scaleX }}
      aria-hidden="true"
    >
      <div className="scroll-progress-glow" />
    </motion.div>
  );
};

export default ScrollProgress;
