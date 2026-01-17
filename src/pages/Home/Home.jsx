import { useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const currentTimeRef = useRef(0);
    const targetTimeRef = useRef(0);
    const rafRef = useRef(null);
    const isPlayingRef = useRef(false);

    // Framer Motion scroll progress
    const { scrollYProgress } = useScroll();

    // Super smooth spring for scroll progress
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    // Linear interpolation function for ultra-smooth transitions
    const lerp = useCallback((start, end, factor) => {
        return start + (end - start) * factor;
    }, []);

    // Easing function for natural motion
    const easeOutCubic = useCallback((t) => {
        return 1 - Math.pow(1 - t, 3);
    }, []);

    // Easing function for smooth acceleration
    const easeInOutQuad = useCallback((t) => {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }, []);

    // Clamp function
    const clamp = useCallback((value, min, max) => {
        return Math.min(Math.max(value, min), max);
    }, []);

    // Ultra-smooth scroll-based video playback with requestAnimationFrame
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Smoothness configuration
        const LERP_FACTOR = 0.08; // Lower = smoother but slower response (0.05-0.15 recommended)
        const FRAME_RATE = 60;
        const FRAME_DURATION = 1000 / FRAME_RATE;

        let lastFrameTime = 0;

        // Animation loop for buttery smooth video scrubbing
        const animate = (timestamp) => {
            if (!lastFrameTime) lastFrameTime = timestamp;
            const deltaTime = timestamp - lastFrameTime;

            // Only update at consistent frame rate
            if (deltaTime >= FRAME_DURATION * 0.5) {
                lastFrameTime = timestamp;

                if (video.duration && !isNaN(video.duration)) {
                    // Smooth interpolation towards target time
                    const diff = Math.abs(targetTimeRef.current - currentTimeRef.current);

                    // Adaptive lerp factor based on distance
                    const adaptiveLerp = diff > 1 ? LERP_FACTOR * 2 : LERP_FACTOR;

                    // Apply lerp for smooth transition
                    currentTimeRef.current = lerp(
                        currentTimeRef.current,
                        targetTimeRef.current,
                        adaptiveLerp
                    );

                    // Clamp to valid range
                    currentTimeRef.current = clamp(currentTimeRef.current, 0, video.duration);

                    // Only update video if there's a meaningful change
                    if (Math.abs(video.currentTime - currentTimeRef.current) > 0.001) {
                        video.currentTime = currentTimeRef.current;
                    }
                }
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        // Scroll handler - sets target time
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = clamp(scrollTop / maxScroll, 0, 1);

            if (video.duration && !isNaN(video.duration)) {
                // Apply easing to scroll percentage for smoother feel
                const easedPercent = easeInOutQuad(scrollPercent);
                targetTimeRef.current = easedPercent * video.duration;
            }
        };

        // Initialize video
        const handleLoadedMetadata = () => {
            video.pause();
            video.muted = true;
            currentTimeRef.current = 0;
            targetTimeRef.current = 0;
            video.currentTime = 0;

            // Start animation loop
            if (!isPlayingRef.current) {
                isPlayingRef.current = true;
                rafRef.current = requestAnimationFrame(animate);
            }

            // Trigger initial scroll calculation
            handleScroll();
        };

        // Handle video errors gracefully
        const handleError = (e) => {
            console.log('Video loading issue, continuing without video:', e);
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', handleError);
        window.addEventListener('scroll', handleScroll, { passive: true });

        // If video already loaded
        if (video.readyState >= 1) {
            handleLoadedMetadata();
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('error', handleError);
            window.removeEventListener('scroll', handleScroll);
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            isPlayingRef.current = false;
        };
    }, [lerp, clamp, easeInOutQuad]);

    // Enhanced Animation variants with detailed keyframes
    const fadeInUp = {
        hidden: {
            opacity: 0,
            y: 80,
            scale: 0.95,
            filter: "blur(10px)"
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            transition: {
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier
                opacity: { duration: 0.8, ease: "easeOut" },
                y: { duration: 1, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 1.1, ease: "easeOut" },
                filter: { duration: 0.6, ease: "easeOut" }
            }
        }
    };

    const fadeIn = {
        hidden: {
            opacity: 0,
            scale: 0.98
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 1.4,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    // New: Slide in from left
    const slideInLeft = {
        hidden: {
            opacity: 0,
            x: -100,
            rotateY: -15
        },
        visible: {
            opacity: 1,
            x: 0,
            rotateY: 0,
            transition: {
                duration: 1,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    // New: Slide in from right
    const slideInRight = {
        hidden: {
            opacity: 0,
            x: 100,
            rotateY: 15
        },
        visible: {
            opacity: 1,
            x: 0,
            rotateY: 0,
            transition: {
                duration: 1,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    // New: Scale up with bounce
    const scaleUp = {
        hidden: {
            opacity: 0,
            scale: 0.5,
            y: 50
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1], // Bounce effect
                scale: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }
            }
        }
    };

    // New: Float animation for icons
    const floatAnimation = {
        hidden: {
            opacity: 0,
            y: 40,
            scale: 0.8
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        },
        hover: {
            y: -10,
            scale: 1.1,
            transition: {
                duration: 0.4,
                ease: "easeInOut",
                yoyo: Infinity,
                repeatType: "reverse"
            }
        }
    };

    // New: Card entrance animation
    const cardAnimation = {
        hidden: {
            opacity: 0,
            y: 60,
            scale: 0.9,
            rotateX: 15
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            rotateX: 0,
            transition: {
                duration: 0.9,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        }
    };

    // New: Text reveal animation
    const textReveal = {
        hidden: {
            opacity: 0,
            y: 30,
            clipPath: "inset(100% 0 0 0)"
        },
        visible: {
            opacity: 1,
            y: 0,
            clipPath: "inset(0% 0 0 0)",
            transition: {
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    };

    // Parallax transform values using smooth scroll
    const heroY = useTransform(smoothProgress, [0, 0.3], [0, -100]);
    const heroOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0.3]);
    const heroScale = useTransform(smoothProgress, [0, 0.3], [1, 0.95]);

    return (
        <div className="home-container" ref={containerRef}>
            {/* VideoBackground is rendered at the app root to avoid clipping by transforms */}

            {/* Content */}
            <div className="home-content">
                {/* Section 1: Hero with Parallax */}
                <motion.section
                    className="hero-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeIn}
                    style={{ y: heroY, opacity: heroOpacity, scale: heroScale }}
                >
                    <motion.h1
                        className="hero-title"
                        variants={textReveal}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.3 }}
                    >
                        🏠 RentEasy
                    </motion.h1>
                    <motion.p
                        className="hero-tagline"
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.5 }}
                    >
                        Apna Perfect Room Dhundhein - PG, Flats & Rooms
                    </motion.p>
                    <motion.div
                        className="hero-cta"
                        variants={scaleUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.8 }}
                    >
                        <Link to="/auth" className="cta-button primary">
                            Get Started
                        </Link>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        className="scroll-indicator"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.8 }}
                    >
                        <motion.div
                            className="scroll-mouse"
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <span className="scroll-wheel"></span>
                        </motion.div>
                        <span className="scroll-text">Scroll to Explore</span>
                    </motion.div>
                </motion.section>

                {/* Section 2: About with Enhanced Animations */}
                <motion.section
                    className="about-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={staggerContainer}
                >
                    <motion.h2
                        className="section-title"
                        variants={textReveal}
                    >
                        Hamari Services
                    </motion.h2>

                    <motion.div
                        className="services-grid"
                        variants={staggerContainer}
                    >
                        <motion.div
                            className="service-card"
                            variants={cardAnimation}
                            whileHover={{
                                y: -15,
                                scale: 1.03,
                                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)",
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                        >
                            <motion.div
                                className="service-icon"
                                whileHover={{ scale: 1.2, rotate: 10 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                🛏️
                            </motion.div>
                            <h3>PG Rooms</h3>
                            <p>Fully furnished PG rooms with all amenities. Food, WiFi, aur security sab included.</p>
                        </motion.div>

                        <motion.div
                            className="service-card"
                            variants={cardAnimation}
                            whileHover={{
                                y: -15,
                                scale: 1.03,
                                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)",
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                        >
                            <motion.div
                                className="service-icon"
                                whileHover={{ scale: 1.2, rotate: -10 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                🏢
                            </motion.div>
                            <h3>Single Rooms</h3>
                            <p>Affordable single rooms for students and working professionals.</p>
                        </motion.div>

                        <motion.div
                            className="service-card"
                            variants={cardAnimation}
                            whileHover={{
                                y: -15,
                                scale: 1.03,
                                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)",
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                        >
                            <motion.div
                                className="service-icon"
                                whileHover={{ scale: 1.2, rotate: 10 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                🏡
                            </motion.div>
                            <h3>Flats & Apartments</h3>
                            <p>1BHK, 2BHK aur 3BHK flats available. Family friendly options.</p>
                        </motion.div>

                        <motion.div
                            className="service-card"
                            variants={cardAnimation}
                            whileHover={{
                                y: -15,
                                scale: 1.03,
                                boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4)",
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                        >
                            <motion.div
                                className="service-icon"
                                whileHover={{ scale: 1.2, rotate: -10 }}
                                transition={{ type: "spring", stiffness: 400 }}
                            >
                                📞
                            </motion.div>
                            <h3>Direct Contact</h3>
                            <p>Owners se directly baat karein. No middleman, no brokerage!</p>
                        </motion.div>
                    </motion.div>
                </motion.section>

                {/* Section 3: Features with Slide Animations */}
                <motion.section
                    className="features-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={staggerContainer}
                >
                    <motion.h2
                        className="section-title"
                        variants={textReveal}
                    >
                        Kyun Choose Karein RentEasy?
                    </motion.h2>

                    <motion.div className="features-list" variants={staggerContainer}>
                        <motion.div
                            className="feature-item"
                            variants={slideInLeft}
                            whileHover={{
                                x: 10,
                                scale: 1.02,
                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                                transition: { duration: 0.2 }
                            }}
                        >
                            <motion.span
                                className="feature-check"
                                initial={{ scale: 0, rotate: -180 }}
                                whileInView={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            >
                                ✓
                            </motion.span>
                            <span>Verified Listings Only</span>
                        </motion.div>
                        <motion.div
                            className="feature-item"
                            variants={slideInRight}
                            whileHover={{
                                x: -10,
                                scale: 1.02,
                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                                transition: { duration: 0.2 }
                            }}
                        >
                            <motion.span
                                className="feature-check"
                                initial={{ scale: 0, rotate: -180 }}
                                whileInView={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                            >
                                ✓
                            </motion.span>
                            <span>Real Photos & Videos</span>
                        </motion.div>
                        <motion.div
                            className="feature-item"
                            variants={slideInLeft}
                            whileHover={{
                                x: 10,
                                scale: 1.02,
                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                                transition: { duration: 0.2 }
                            }}
                        >
                            <motion.span
                                className="feature-check"
                                initial={{ scale: 0, rotate: -180 }}
                                whileInView={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                            >
                                ✓
                            </motion.span>
                            <span>Zero Brokerage</span>
                        </motion.div>
                        <motion.div
                            className="feature-item"
                            variants={slideInRight}
                            whileHover={{
                                x: -10,
                                scale: 1.02,
                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                                transition: { duration: 0.2 }
                            }}
                        >
                            <motion.span
                                className="feature-check"
                                initial={{ scale: 0, rotate: -180 }}
                                whileInView={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                            >
                                ✓
                            </motion.span>
                            <span>24/7 Support</span>
                        </motion.div>
                    </motion.div>
                </motion.section>

                {/* Section 4: Login/Signup CTA with Scale Animation */}
                <motion.section
                    className="auth-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={staggerContainer}
                >
                    <motion.div
                        className="auth-card"
                        variants={scaleUp}
                        whileHover={{
                            scale: 1.02,
                            boxShadow: "0 30px 60px rgba(0, 0, 0, 0.4)",
                            transition: { duration: 0.3 }
                        }}
                    >
                        <motion.h2 variants={textReveal}>
                            Ready to Find Your Perfect Space?
                        </motion.h2>
                        <motion.p variants={fadeInUp}>
                            Sign up karein aur apna dream room dhundhna shuru karein!
                        </motion.p>
                        <motion.div
                            className="auth-buttons"
                            variants={staggerContainer}
                        >
                            <motion.div variants={slideInLeft}>
                                <Link to="/auth" className="cta-button primary">
                                    Sign In
                                </Link>
                            </motion.div>
                            <motion.div variants={slideInRight}>
                                <Link to="/auth?mode=signup" className="cta-button secondary">
                                    Create Account
                                </Link>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.section>

                {/* Footer with Fade In */}
                <motion.footer
                    className="home-footer"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                >
                    <p>© 2026 RentEasy. Made with ❤️ for you.</p>
                </motion.footer>
            </div>
        </div>
    );
};

export default Home;
