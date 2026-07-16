import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, userRole } = useAuth();
  const searchInputRef = useRef(null);

  // Handle scroll effects - hide on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Set scrolled state for background blur
      setIsScrolled(currentScrollY > 50);
      
      // Hide/show navbar based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      
      setPrevScrollY(currentScrollY);
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore-rooms?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  // Navigation items
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/explore-rooms', label: 'Explore', icon: '🔍' },
  ];

  // Add admin link if user is admin
  if (userRole === 'admin') {
    navItems.push({ path: '/admin-dashboard', label: 'Dashboard', icon: '⚙️' });
  }

  return (
    <motion.nav
      className={`navbar ${isScrolled ? 'navbar-scrolled' : ''} ${isHidden ? 'navbar-hidden' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: isHidden ? -100 : 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar-container">
        {/* Logo with gradient animation on hover */}
        <Link to="/" className="navbar-logo">
          <motion.span 
            className="logo-icon"
            whileHover={{ rotate: 20, scale: 1.15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            👑
          </motion.span>
          <span className="logo-text">
            Royal <span className="logo-highlight">Stay</span>
          </span>
        </Link>

        {/* Desktop Navigation with sliding indicator */}
        <div className="navbar-links">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {location.pathname === item.path && (
                <motion.div
                  className="nav-indicator"
                  layoutId="navbar-indicator"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="navbar-actions">
          {/* Search Icon - Expands on Click */}
          <motion.div 
            className={`search-wrapper ${isSearchOpen ? 'open' : ''}`}
            initial={false}
          >
            <AnimatePresence mode="wait">
              {!isSearchOpen ? (
                <motion.button
                  key="search-btn"
                  className="search-toggle"
                  onClick={() => setIsSearchOpen(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Search"
                >
                  🔍
                </motion.button>
              ) : (
                <motion.form
                  key="search-form"
                  onSubmit={handleSearch}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="search-form"
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setIsSearchOpen(false)}
                    className="navbar-search-input"
                  />
                  <button 
                    type="submit" 
                    className="search-submit"
                    aria-label="Submit search"
                  >
                    →
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Notification Bell with Badge */}
          <motion.button
            className="notification-bell"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Notifications"
          >
            🔔
            <span className="notification-badge">3</span>
          </motion.button>

          {currentUser ? (
            <div className="profile-wrapper">
              <button
                className="profile-button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                onBlur={() => setTimeout(() => setIsProfileOpen(false), 200)}
              >
                <div className="avatar">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
                <span className="profile-email">{currentUser.email?.split('@')[0]}</span>
                <motion.span
                  className="dropdown-arrow"
                  animate={{ rotate: isProfileOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    className="profile-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {currentUser.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="dropdown-info">
                        <p className="dropdown-email">{currentUser.email}</p>
                        <p className="dropdown-role">
                          {userRole === 'admin' ? '⭐ Admin' : '👤 User'}
                        </p>
                      </div>
                    </div>
                    <div className="dropdown-divider" />
                    
                    {/* Staggered dropdown items */}
                    {[
                      { icon: '🏠', label: 'My Bookings', link: '/explore-rooms' },
                      { icon: '❤️', label: 'Saved Rooms', link: '/explore-rooms' },
                      { icon: '⚙️', label: 'Settings', link: '#' }
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index + 0.1 }}
                      >
                        <Link
                          to={item.link}
                          className="dropdown-item"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          {item.icon} {item.label}
                        </Link>
                      </motion.div>
                    ))}
                    
                    <div className="dropdown-divider" />
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <button onClick={handleLogout} className="dropdown-item logout">
                        🚪 Logout
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/auth" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/auth?mode=signup" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle - Enhanced Animation */}
          <button
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu with Enhanced Animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mobile-menu-content">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.08, type: "spring", damping: 20 }}
                >
                  <Link
                    to={item.path}
                    className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Search in Menu */}
              <div className="mobile-search-box">
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mobile-search-input"
                  />
                </form>
              </div>

              {!currentUser && (
                <>
                  <div className="mobile-divider" />
                  <div className="mobile-auth-buttons">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Link
                        to="/auth"
                        className="btn btn-ghost mobile-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                    </motion.div>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                    >
                      <Link
                        to="/auth?mode=signup"
                        className="btn btn-primary mobile-btn"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </motion.div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
