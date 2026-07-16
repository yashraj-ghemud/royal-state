import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import ScrollProgress from '../../components/ScrollProgress/ScrollProgress';
import BackToTop from '../../components/BackToTop/BackToTop';
import './Home.css';

// ============================================
// ENHANCED ANIMATED COUNTER COMPONENT
// With easeOutElastic, comma separator, prefix/suffix support
// ============================================
const AnimatedCounter = ({ end, duration = 2, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    let startTime;
    let animationFrame;
    
    // Ease out elastic function for bouncy feel
    const easeOutElastic = (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    };
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easedProgress = easeOutElastic(progress);
      setCount(Math.floor(easedProgress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// ============================================
// TEXT REVEAL ANIMATION COMPONENT
// Character-by-character reveal with blur
// ============================================
const TextReveal = ({ text, className = '', delay = 0 }) => {
  const words = text.split(' ');
  
  const container = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: delay
      }
    }
  };
  
  const child = {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(4px)',
      rotateX: -90
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      rotateX: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      className={`text-reveal-container ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
      style={{ perspective: '500px' }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="word-wrapper" style={{ display: 'inline-block', marginRight: '0.35em' }}>
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={`${wordIndex}-${charIndex}`}
              variants={child}
              style={{ display: 'inline-block' }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.div>
  );
};

// ============================================
// MAGNETIC BUTTON COMPONENT
// Interactive hover effect that follows cursor
// ============================================
const MagneticButton = ({ children, className = '', ...props }) => {
  const ref = useRef(null);
  const position = useMotionValue({ x: 0, y: 0 });
  
  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    position.set({ x: x * 0.2, y: y * 0.2 });
  };
  
  const handleMouseLeave = () => {
    position.set({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      className={`magnetic-btn ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: position.x, y: position.y }}
    >
      {children}
    </motion.div>
  );
};

// ============================================
// TESTIMONIALS DATA
// ============================================
const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    role: "Student",
    content: "Found my perfect PG room in just 2 days! The platform is so easy to use and the listings are verified.",
    rating: 5,
    avatar: "👩‍💼"
  },
  {
    id: 2,
    name: "Rahul Patel",
    role: "IT Professional",
    content: "Best rental platform in Maharashtra. Saved me hours of searching. Highly recommended!",
    rating: 5,
    avatar: "👨‍💻"
  },
  {
    id: 3,
    name: "Anita Deshmukh",
    role: "Business Owner",
    content: "The video tours helped me choose the right flat without visiting multiple locations.",
    rating: 4,
    avatar: "👩‍💼"
  },
  {
    id: 4,
    name: "Vikram Singh",
    role: "Software Engineer",
    content: "Amazing experience! The customer support team was very helpful throughout the process.",
    rating: 5,
    avatar: "👨‍💼"
  },
  {
    id: 5,
    name: "Sneha Joshi",
    role: "Designer",
    content: "Beautiful properties at great prices. I found my dream apartment within budget!",
    rating: 5,
    avatar: "👩‍🎨"
  }
];

// ============================================
// FEATURES DATA
// ============================================
const features = [
  {
    icon: "✅",
    title: "Verified Listings",
    description: "Every property is verified by our team for your safety and peace of mind."
  },
  {
    icon: "📹",
    title: "Video Tours",
    description: "Take virtual tours of properties from the comfort of your home."
  },
  {
    icon: "🔒",
    title: "Secure Booking",
    description: "Your transactions are protected with our secure payment gateway."
  },
  {
    icon: "💬",
    title: "24/7 Support",
    description: "Our dedicated support team is always ready to help you."
  },
  {
    icon: "📍",
    title: "Location Based",
    description: "Find properties near your workplace, college, or preferred location."
  },
  {
    icon: "💰",
    title: "Best Prices",
    description: "Compare prices and find the best deals that fit your budget."
  }
];

// ============================================
// SERVICES DATA
// ============================================
const services = [
  {
    icon: "🛏️",
    title: "PG Rooms",
    description: "Fully furnished PG rooms with food, WiFi & security included",
    color: "#667eea"
  },
  {
    icon: "🏠",
    title: "1BHK / 2BHK / 3BHK",
    description: "Spacious flats for families, couples & sharing options",
    color: "#D4AF37"
  },
  {
    icon: "🏢",
    title: "Apartments",
    description: "Premium apartments with modern amenities & facilities",
    color: "#10B981"
  },
  {
    icon: "🏡",
    title: "Villas & Bungalows",
    description: "Luxury independent houses for those who love space",
    color: "#EF4444"
  }
];

// ============================================
// PARTICLE CONFIGURATION
// Varied colors for enhanced visuals
// ============================================
const particleColors = [
  'rgba(212, 175, 55, 0.6)',   // Gold
  'rgba(212, 175, 55, 0.4)',   // Light Gold
  'rgba(102, 126, 234, 0.5)',  // Purple
  'rgba(255, 255, 255, 0.6)',  // White
  'rgba(102, 126, 234, 0.3)',  // Light Purple
  'rgba(244, 228, 188, 0.5)'   // Cream
];

// ============================================
// HOME PAGE MAIN COMPONENT
// ============================================
const Home = () => {
  const containerRef = useRef(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  // Scroll animations for parallax
  const { scrollY } = useScroll();
  const parallaxY1 = useTransform(scrollY, [0, 1000], [0, -150]);
  const parallaxY2 = useTransform(scrollY, [0, 1000], [0, -300]);
  const parallaxOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  
  // Smooth spring progress
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Auto-swipe testimonials every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
    }
  };
  
  // Section entrance variant
  const sectionEntrance = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="home-page" ref={containerRef}>
      <ScrollProgress />
      <Navbar />
      
      {/* ============================================ */}
      {/* HERO SECTION WITH PARALLAX */}
      {/* ============================================ */}
      <section className="hero-section">
        <motion.div 
          className="hero-background"
          style={{ y: parallaxY1 }}
        >
          <div className="hero-gradient"></div>
          
          {/* Enhanced Particle System with varied colors/sizes */}
          <div className="hero-particles">
            {[...Array(35)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 8 + 2}px`,
                  height: `${Math.random() * 8 + 2}px`,
                  background: particleColors[i % particleColors.length],
                  boxShadow: i % 3 === 0 ? `0 0 ${Math.random() * 10 + 5}px ${particleColors[i % particleColors.length]}` : 'none'
                }}
                animate={{
                  y: [0, -(Math.random() * 40 + 20), 0],
                  x: [0, (Math.random() - 0.5) * 30, 0],
                  opacity: [0.2, 1, 0.2],
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: Math.random() * 4 + 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          {/* Animated gradient orbs */}
          <motion.div 
            className="gradient-orb orb-1"
            animate={{ 
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="gradient-orb orb-2"
            animate={{ 
              x: [0, -40, 0],
              y: [0, 40, 0],
              scale: [1, 1.15, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
        
        <div className="hero-container">
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="hero-badge" variants={fadeInUp}>
              <span className="badge-icon">⭐</span>
              <span>Maharashtra's #1 Rental Platform</span>
            </motion.div>

            {/* Hero Title with Text Reveal Animation */}
            <motion.h1 className="hero-title" variants={fadeInUp}>
              Find Your Perfect
              <br />
              <span className="title-highlight">Royal Stay</span>
            </motion.h1>

            <motion.p className="hero-subtitle" variants={fadeInUp}>
              Discover premium PGs, flats & apartments across Maharashtra. 
              Verified listings, video tours & instant booking.
            </motion.p>

            <motion.div className="hero-search" variants={scaleIn}>
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search by location, property type..."
                  className="search-input"
                />
                <Link to="/explore-rooms" className="search-btn">
                  Search
                </Link>
              </div>
            </motion.div>

            <motion.div className="hero-stats" variants={staggerContainer}>
              <div className="stat-item">
                <span className="stat-number"><AnimatedCounter end={5000} suffix="+" /></span>
                <span className="stat-label">Properties</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number"><AnimatedCounter end={12000} suffix="+" /></span>
                <span className="stat-label">Happy Users</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number"><AnimatedCounter end={35} /></span>
                <span className="stat-label">Districts</span>
              </div>
            </motion.div>

            {/* Hero CTA with Magnetic Effect */}
            <motion.div className="hero-cta" variants={fadeInUp}>
              <MagneticButton>
                <Link to="/explore-rooms" className="btn btn-primary btn-lg magnetic-target">
                  Explore Properties
                  <span className="btn-arrow">→</span>
                </Link>
              </MagneticButton>
              <MagneticButton>
                <Link to="/auth?mode=signup" className="btn btn-outline btn-lg magnetic-target">
                  List Your Property
                </Link>
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* ============================================ */}
          {/* HERO VISUAL CARDS - Now Visible on Desktop! */}
          {/* ============================================ */}
          <motion.div 
            className="hero-visual"
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ y: parallaxY2 }}
          >
            <motion.div 
              className="visual-card card-1"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 25px 50px rgba(212, 175, 55, 0.3)',
                y: -10
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <span className="card-icon">🏠</span>
              <span className="card-text">Premium Flats</span>
              <div className="card-glow" />
            </motion.div>
            
            <motion.div 
              className="visual-card card-2"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 25px 50px rgba(102, 126, 234, 0.3)',
                y: -10
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <span className="card-icon">🛏️</span>
              <span className="card-text">Luxury PGs</span>
              <div className="card-glow" />
            </motion.div>
            
            <motion.div 
              className="visual-card card-3"
              whileHover={{ 
                scale: 1.05, 
                boxShadow: '0 25px 50px rgba(16, 185, 129, 0.3)',
                y: -10
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <span className="card-icon">🏢</span>
              <span className="card-text">Apartments</span>
              <div className="card-glow" />
            </motion.div>
            
            <motion.div 
              className="floating-badge"
              animate={{ 
                y: [0, -12, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <span className="badge-rating">⭐ 4.9</span>
              <span>User Rating</span>
            </motion.div>
            
            {/* Decorative elements */}
            <div className="visual-decoration dot-1" />
            <div className="visual-decoration dot-2" />
            <div className="visual-decoration dot-3" />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{ opacity: parallaxOpacity }}
        >
          <motion.div
            className="scroll-mouse"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="scroll-wheel"></div>
          </motion.div>
          <span>Scroll to explore</span>
        </motion.div>
      </section>

      {/* ============================================ */}
      {/* SERVICES SECTION - With Gradient Border Hover */}
      {/* ============================================ */}
      <section className="services-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionEntrance}
          >
            <span className="section-tag">What We Offer</span>
            <h2 className="section-title">Premium Rental Services</h2>
            <p className="section-description">
              From cozy PG rooms to spacious apartments, we have everything you need
            </p>
          </motion.div>

          <motion.div
            className="services-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {services.map((service, index) => (
              <motion.div
                key={index}
                className="service-card"
                variants={scaleIn}
                whileHover={{ 
                  y: -12, 
                  transition: { duration: 0.3, type: "spring", stiffness: 300 }
                }}
              >
                {/* Gradient border on hover */}
                <div className="service-card-border" />
                
                <div 
                  className="service-icon-wrapper"
                  style={{ background: `linear-gradient(135deg, ${service.color}20, ${service.color}10)` }}
                >
                  <span className="service-icon">{service.icon}</span>
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <Link to="/explore-rooms" className="service-link">
                  Explore <span>→</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEATURES SECTION - With Glow Hover Effects */}
      {/* ============================================ */}
      <section className="features-section">
        <div className="container">
          <motion.div
            className="features-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`feature-card ${index % 2 === 0 ? 'feature-left' : 'feature-right'}`}
                variants={fadeInUp}
                whileHover={{ 
                  x: 8, 
                  transition: { duration: 0.2 },
                  boxShadow: '0 10px 40px rgba(212, 175, 55, 0.15)'
                }}
              >
                <span className="feature-icon">{feature.icon}</span>
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <div className="feature-glow" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TESTIMONIALS SECTION - Auto-Swiping Carousel */}
      {/* ============================================ */}
      <section className="testimonials-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={sectionEntrance}
          >
            <span className="section-tag">Testimonials</span>
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-description">
              Join thousands of happy customers who found their perfect home through us
            </p>
          </motion.div>

          {/* Testimonial Carousel */}
          <div className="testimonials-carousel">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                className="testimonial-card active-testimonial"
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="testimonial-header">
                  <span className="testimonial-avatar">{testimonials[currentTestimonial].avatar}</span>
                  <div className="testimonial-info">
                    <h4>{testimonials[currentTestimonial].name}</h4>
                    <p>{testimonials[currentTestimonial].role}</p>
                  </div>
                  <div className="testimonial-rating">
                    {'⭐'.repeat(testimonials[currentTestimonial].rating)}
                  </div>
                </div>
                <p className="testimonial-content">"{testimonials[currentTestimonial].content}"</p>
              </motion.div>
            </AnimatePresence>
            
            {/* Carousel Indicators */}
            <div className="carousel-indicators">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`indicator-dot ${index === currentTestimonial ? 'active' : ''}`}
                  onClick={() => setCurrentTestimonial(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION */}
      {/* ============================================ */}
      <section className="cta-section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={scaleIn}
          >
            <div className="cta-content">
              <h2>Ready to Find Your Dream Home?</h2>
              <p>Join thousands who've already found their perfect stay with Royal Stay</p>
              <div className="cta-buttons">
                <MagneticButton>
                  <Link to="/auth?mode=signup" className="btn btn-primary btn-lg">
                    Get Started Free
                    <span className="btn-arrow">→</span>
                  </Link>
                </MagneticButton>
                <MagneticButton>
                  <Link to="/explore-rooms" className="btn btn-white btn-lg">
                    Browse Properties
                  </Link>
                </MagneticButton>
              </div>
            </div>
            <div className="cta-decoration">
              <div className="decoration-circle circle-1"></div>
              <div className="decoration-circle circle-2"></div>
              <div className="decoration-circle circle-3"></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="footer-logo">
                <span>👑</span>
                <span>Royal Stay</span>
              </Link>
              <p>Maharashtra's most trusted rental platform for students, professionals & families.</p>
            </div>
            
            <div className="footer-links">
              <h4>Quick Links</h4>
              <Link to="/">Home</Link>
              <Link to="/explore-rooms">Explore</Link>
              <Link to="/auth">Login</Link>
              <Link to="/auth?mode=signup">Sign Up</Link>
            </div>
            
            <div className="footer-links">
              <h4>Property Types</h4>
              <Link to="/explore-rooms?type=PG">PG Rooms</Link>
              <Link to="/explore-rooms?type=1BHK">1BHK Flats</Link>
              <Link to="/explore-rooms?type=2BHK">2BHK Flats</Link>
              <Link to="/explore-rooms?type=Apartment">Apartments</Link>
            </div>
            
            <div className="footer-contact">
              <h4>Contact Us</h4>
              <p>📧 support@royalstay.com</p>
              <p>📞 +91 98765 43210</p>
              <p>📍 Maharashtra, India</p>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2026 Royal Stay. All rights reserved.</p>
            <div className="footer-social">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Instagram">📸</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="LinkedIn">💼</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Back to Top Button */}
      <BackToTop />
    </div>
  );
};

export default Home;
