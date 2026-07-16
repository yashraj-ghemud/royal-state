import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import './Auth.css';

// ============================================
// TYPING EFFECT COMPONENT
// For brand title animation
// ============================================
const TypingEffect = ({ text, speed = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span>
      {displayText}
      <span className="typing-cursor">|</span>
    </span>
  );
};

// ============================================
// PASSWORD STRENGTH INDICATOR
// ============================================
const PasswordStrengthIndicator = ({ password }) => {
  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { level: 1, label: 'Weak', color: '#EF4444' };
    if (strength <= 3) return { level: 2, label: 'Fair', color: '#F59E0B' };
    if (strength <= 4) return { level: 3, label: 'Good', color: '#D4AF37' };
    return { level: 4, label: 'Strong', color: '#10B981' };
  };

  const strength = getStrength();

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="strength-bars">
        {[1, 2, 3, 4].map((level) => (
          <motion.div
            key={level}
            className={`strength-bar ${level <= strength.level ? 'filled' : ''}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: level <= strength.level ? 1 : 0 }}
            transition={{ duration: 0.3, delay: level * 0.05 }}
            style={{ 
              backgroundColor: level <= strength.level ? strength.color : undefined,
              transformOrigin: 'left'
            }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: strength.color }}>
        {strength.label}
      </span>
    </div>
  );
};

// ============================================
// SUCCESS CHECKMARK ANIMATION
// ============================================
const SuccessCheckmark = ({ show }) => {
  if (!show) return null;

  return (
    <motion.div 
      className="success-checkmark"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <svg viewBox="0 0 52 52" className="checkmark-svg">
        <motion.circle
          cx="26"
          cy="26"
          r="25"
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.path
          fill="none"
          stroke="#10B981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l8 8 16-16"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        />
      </svg>
      <span className="success-text">Success!</span>
    </motion.div>
  );
};

// ============================================
// MAIN AUTH COMPONENT
// ============================================
const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { login, signup, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') {
      setIsLogin(false);
    }
    window.scrollTo(0, 0);
  }, [searchParams]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && userRole) {
      if (userRole === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/explore-rooms');
      }
    }
  }, [currentUser, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email.trim()) return setError('Please enter your email');
    if (!password) return setError('Please enter your password');
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setError('Please enter a valid email');

    if (!isLogin && password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    if (!isLogin && password !== confirmPassword) {
      return setError('Passwords do not match!');
    }

    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/explore-rooms');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      const errorMessages = {
        'auth/email-already-in-use': 'Email already registered. Please login.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-not-found': 'User not found. Please sign up.',
        'auth/wrong-password': 'Wrong password.',
        'auth/weak-password': 'Password is too weak.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(errorMessages[err.code] || 'Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  // Animation variants
  const slideIn = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, x: 30, transition: { duration: 0.3 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  // Shake variant for error
  const shakeVariant = {
    hidden: { x: 0 },
    shake: {
      x: [-10, 10, -10, 10, -5, 5, 0],
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      
      {/* Animated Background Gradient Mesh */}
      <div className="auth-bg-mesh">
        <div className="mesh-gradient mesh-1" />
        <div className="mesh-gradient mesh-2" />
        <div className="mesh-gradient mesh-3" />
        <div className="mesh-orb orb-1" />
        <div className="mesh-orb orb-2" />
      </div>

      <div className="auth-container">
        {/* Left Side - Branding */}
        <motion.div 
          className="auth-branding"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="branding-content">
            <Link to="/" className="brand-logo">
              <motion.span 
                className="logo-icon"
                whileHover={{ rotate: 20, scale: 1.15 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                👑
              </motion.span>
              <span className="logo-text">Royal Stay</span>
            </Link>

            <h1 className="brand-title">
              <TypingEffect text="Find Your Perfect Home Today" speed={60} />
            </h1>

            <p className="brand-description">
              Join thousands of happy tenants who found their dream rental through Maharashtra's #1 property platform.
            </p>

            <div className="brand-features">
              {[
                { icon: '✓', text: 'Verified Properties Only' },
                { icon: '✓', text: 'Video Tours Available' },
                { icon: '✓', text: 'Direct Owner Contact' },
                { icon: '✓', text: '100% Free to Use' }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="brand-feature"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <span className="feature-check">{feature.icon}</span>
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="brand-stats">
              <motion.div 
                className="brand-stat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <span className="stat-number">5000+</span>
                <span className="stat-label">Properties</span>
              </motion.div>
              <motion.div 
                className="brand-stat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <span className="stat-number">12K+</span>
                <span className="stat-label">Happy Users</span>
              </motion.div>
              <motion.div 
                className="brand-stat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
              >
                <span className="stat-number">35</span>
                <span className="stat-label">Districts</span>
              </motion.div>
            </div>

            <div className="brand-decoration">
              <div className="decoration-circle circle-1"></div>
              <div className="decoration-circle circle-2"></div>
              <div className="decoration-circle circle-3"></div>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div 
          className="auth-form-wrapper"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="auth-form-container">
            {/* Mobile Logo */}
            <Link to="/" className="mobile-logo">
              <span>👑</span>
              <span>Royal Stay</span>
            </Link>

            {/* Header */}
            <motion.div 
              className="form-header"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="wait">
                <motion.h2 key={isLogin ? 'login' : 'signup'} variants={slideIn}>
                  {isLogin ? 'Welcome Back!' : 'Create Account'}
                </motion.h2>
              </AnimatePresence>
              
              <motion.p 
                key={isLogin ? 'login-sub' : 'signup-sub'} 
                className="form-subtitle"
                variants={fadeInUp}
              >
                {isLogin 
                  ? 'Sign in to continue your journey' 
                  : 'Join us and find your perfect home'
                }
              </motion.p>
            </motion.div>

            {/* Error Message with Shake Animation */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="error-message"
                  variants={shakeVariant}
                  initial="hidden"
                  animate="shake"
                  exit={{ opacity: 0, height: 0 }}
                  key={error}
                >
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Checkmark */}
            <SuccessCheckmark show={showSuccess} />

            {/* Form */}
            {!showSuccess && (
              <form onSubmit={handleSubmit} className="auth-form">
                <motion.div 
                  className={`form-group ${focusedInput === 'email' ? 'focused' : ''} ${email ? 'has-value' : ''}`}
                  variants={fadeInUp}
                >
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Enter your email"
                    required
                  />
                  <span className="input-icon">📧</span>
                </motion.div>

                <motion.div 
                  className={`form-group ${focusedInput === 'password' ? 'focused' : ''} ${password ? 'has-value' : ''}`}
                  variants={fadeInUp}
                >
                  <label htmlFor="password">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                  
                  {/* Password Strength Indicator for Signup */}
                  {!isLogin && password && (
                    <PasswordStrengthIndicator password={password} />
                  )}
                </motion.div>

                <AnimatePresence>
                  {!isLogin && (
                    <motion.div 
                      className={`form-group ${focusedInput === 'confirm' ? 'focused' : ''} ${confirmPassword ? 'has-value' : ''}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label htmlFor="confirm">Confirm Password</label>
                      <input
                        type="password"
                        id="confirm"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedInput('confirm')}
                        onBlur={() => setFocusedInput(null)}
                        placeholder="Confirm your password"
                        required
                      />
                      <span className="input-icon">🔒</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isLogin && (
                  <motion.div 
                    className="form-options"
                    variants={fadeInUp}
                  >
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      <span className="checkmark"></span>
                      Remember me
                    </label>
                    <a href="#" className="forgot-link">Forgot password?</a>
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  className={`submit-btn ${loading ? 'loading' : ''}`}
                  disabled={loading}
                  variants={fadeInUp}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                >
                  {loading ? (
                    <>
                      <span className="gradient-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </motion.button>
              </form>
            )}

            {/* Divider */}
            {!showSuccess && (
              <div className="divider">
                <span>or continue with</span>
              </div>
            )}

            {/* Social Login - Enhanced Styling */}
            {!showSuccess && (
              <div className="social-login">
                <motion.button 
                  type="button" 
                  className="social-btn google"
                  disabled
                  whileHover={!undefined ? { scale: 1.03 } : {}}
                  whileTap={!undefined ? { scale: 0.97 } : {}}
                >
                  <span className="social-icon">🔵</span>
                  Google
                </motion.button>
                <motion.button 
                  type="button" 
                  className="social-btn facebook"
                  disabled
                  whileHover={!undefined ? { scale: 1.03 } : {}}
                  whileTap={!undefined ? { scale: 0.97 } : {}}
                >
                  <span className="social-icon">📘</span>
                  Facebook
                </motion.button>
              </div>
            )}

            {/* Toggle Login/Signup */}
            {!showSuccess && (
              <motion.p className="switch-mode" variants={fadeInUp}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="switch-link"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </motion.p>
            )}

            {/* Back to Home */}
            <Link to="/" className="back-home">
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
