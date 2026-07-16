import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import ScrollProgress from '../../components/ScrollProgress/ScrollProgress';
import BackToTop from '../../components/BackToTop/BackToTop';
import PropertyMap from '../../components/PropertyMap/PropertyMap';
import CompareModal from '../../components/CompareModal/CompareModal';
import './ExploreRooms.css';

// Placeholder image URL
const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/1a1a2e/D4AF37?text=No+Image';

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Format timestamp helper
const formatPostTime = (timestamp) => {
  if (!timestamp) return '';
  const now = new Date();
  const postDate = timestamp.toDate();
  const diffInSeconds = Math.floor((now - postDate) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return postDate.toLocaleDateString();
};

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const cardVariant = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

// ============================================
// ENHANCED SKELETON LOADER COMPONENT
// With shimmer effect
// ============================================
const RoomCardSkeleton = () => (
  <div className="room-card skeleton">
    <div className="skeleton-image-wrapper">
      <div className="skeleton-image"></div>
      <div className="skeleton-shimmer" />
    </div>
    <div className="skeleton-content">
      <div className="skeleton-line title"></div>
      <div className="skeleton-line location"></div>
      <div className="skeleton-line price"></div>
      <div className="skeleton-line meta"></div>
    </div>
  </div>
);

// ============================================
// IMAGE GALLERY COMPONENT FOR MODAL
// ============================================
const ImageGallery = ({ images, mainImage }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const allImages = images && images.length > 0 
    ? [mainImage, ...images].filter(Boolean)
    : [mainImage];

  return (
    <div className="image-gallery">
      <div className="gallery-main">
        <img src={allImages[currentIndex] || PLACEHOLDER_IMAGE} alt="Property" />
        {allImages.length > 1 && (
          <>
            <button 
              className="gallery-btn prev" 
              onClick={() => setCurrentIndex(i => i === 0 ? allImages.length - 1 : i - 1)}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button 
              className="gallery-btn next"
              onClick={() => setCurrentIndex(i => i === allImages.length - 1 ? 0 : i + 1)}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        )}
      </div>
      {allImages.length > 1 && (
        <div className="gallery-thumbs">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              className={`thumb ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
            >
              <img src={img || PLACEHOLDER_IMAGE} alt={`View ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// EMPTY STATE ILLUSTRATION COMPONENT
// ============================================
const EmptyState = ({ onClearFilters }) => (
  <motion.div 
    className="empty-state enhanced"
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <div className="empty-illustration">
      <motion.div 
        className="empty-house"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        🏠
      </motion.div>
      <motion.div 
        className="empty-search"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        🔍
      </motion.div>
    </div>
    <h3>No properties found</h3>
    <p>Try adjusting your filters or search terms to find more results</p>
    {onClearFilters && (
      <motion.button 
        className="btn btn-primary"
        onClick={onClearFilters}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Clear All Filters
      </motion.button>
    )}
  </motion.div>
);

// ============================================
// MAIN EXPLORE ROOMS COMPONENT
// ============================================
const ExploreRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filterType, setFilterType] = useState('All');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list or map
  const [sortBy, setSortBy] = useState('newest'); // newest, priceLow, priceHigh, popular
  const [showFilters, setShowFilters] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const [copiedLink, setCopiedLink] = useState(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Debounce search and price inputs
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedMinPrice = useDebounce(minPrice, 300);
  const debouncedMaxPrice = useDebounce(maxPrice, 300);

  // Maharashtra Districts
  const maharashtraDistricts = [
    'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
    'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
    'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban',
    'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar',
    'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara',
    'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
  ];

  const roomTypes = ['All', 'PG', 'Single Room', '1BHK', '2BHK', '3BHK', 'Flat', 'Row House', 'Shop', 'Plot'];

  const { currentUser, logout, userRole } = useAuth();
  const navigate = useNavigate();

  // Redirect admin to dashboard
  useEffect(() => {
    if (userRole === 'admin') {
      navigate('/admin-dashboard');
    }
  }, [userRole, navigate]);

  // Real-time listener for rooms
  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRooms(roomsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching rooms:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort rooms
  const filteredRooms = useMemo(() => {
    let filtered = [...rooms];

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(room => room.roomType === filterType);
    }

    // Filter by district
    if (filterDistrict !== 'All') {
      filtered = filtered.filter(room => room.district === filterDistrict);
    }

    // Filter by price range
    const min = debouncedMinPrice ? Number(debouncedMinPrice) : 0;
    const max = debouncedMaxPrice ? Number(debouncedMaxPrice) : Infinity;
    if (debouncedMinPrice || debouncedMaxPrice) {
      filtered = filtered.filter(room => {
        const price = room.price || 0;
        return price >= min && price <= max;
      });
    }

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(room =>
        room.title?.toLowerCase().includes(query) ||
        room.location?.toLowerCase().includes(query) ||
        room.description?.toLowerCase().includes(query) ||
        room.district?.toLowerCase().includes(query)
      );
    }

    // Sort rooms
    switch (sortBy) {
      case 'priceLow':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'priceHigh':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default: // newest
        // Already sorted by createdAt desc
        break;
    }

    return filtered;
  }, [filterType, filterDistrict, debouncedSearch, debouncedMinPrice, debouncedMaxPrice, rooms, sortBy]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle like/favorite
  const handleLike = async (room, e) => {
    e.stopPropagation();
    
    if (!currentUser) {
      alert('Please login to save properties!');
      return;
    }

    const roomRef = doc(db, 'rooms', room.id);
    const isLiked = room.likedBy?.includes(currentUser.uid);

    try {
      if (isLiked) {
        await updateDoc(roomRef, {
          likes: increment(-1),
          likedBy: arrayRemove(currentUser.uid),
          likedByEmails: arrayRemove(currentUser.email)
        });
      } else {
        await updateDoc(roomRef, {
          likes: increment(1),
          likedBy: arrayUnion(currentUser.uid),
          likedByEmails: arrayUnion(currentUser.email)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  // Handle compare toggle
  const handleCompareToggle = (room, e) => {
    e.stopPropagation();
    if (compareList.find(r => r.id === room.id)) {
      setCompareList(compareList.filter(r => r.id !== room.id));
    } else {
      if (compareList.length < 3) {
        setCompareList([...compareList, room]);
      } else {
        alert('You can compare up to 3 properties at a time');
      }
    }
  };

  // Handle share property
  const handleShare = async (room, e) => {
    e.stopPropagation();
    const link = `${window.location.origin}/explore-rooms?id=${room.id}`;
    
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(room.id);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Open compare modal
  const handleOpenCompare = () => {
    if (compareList.length > 0) {
      setShowCompareModal(true);
    }
  };

  // Remove from compare list
  const handleRemoveFromCompare = (room) => {
    setCompareList(compareList.filter(r => r.id !== room.id));
  };

  // Handle room selection from map or compare
  const handleSelectRoomFromCompare = (room) => {
    setSelectedRoom(room);
    setShowCompareModal(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterType('All');
    setFilterDistrict('All');
    setMinPrice('');
    setMaxPrice('');
    setSearchQuery('');
  };

  // Remove specific filter tag
  const removeFilterTag = (type) => {
    switch(type) {
      case 'type':
        setFilterType('All');
        break;
      case 'district':
        setFilterDistrict('All');
        break;
      case 'price':
        setMinPrice('');
        setMaxPrice('');
        break;
      case 'search':
        setSearchQuery('');
        break;
    }
  };

  const hasActiveFilters = filterType !== 'All' || filterDistrict !== 'All' || minPrice || maxPrice || searchQuery;

  return (
    <div className="explore-page">
      <ScrollProgress />
      <Navbar />
      
      {/* Header */}
      <header className="explore-header">
        <div className="header-content">
          <div className="header-left">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              🔍 Explore Properties
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Find your perfect home across Maharashtra
            </motion.p>
          </div>

          <div className="header-right">
            {/* View Mode Toggles */}
            <div className="view-mode-toggle">
              <button 
                className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                title="Grid View"
              >
                ▦
              </button>
              <button 
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
                title="List View"
              >
                ☰
              </button>
              <button 
                className={`view-mode-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                aria-label="Map view"
                title="Interactive Map View"
              >
                🗺️
              </button>
            </div>

            {currentUser ? (
              <>
                <span className="user-badge">
                  👤 {currentUser.email?.split('@')[0]}
                </span>
                <button className="btn btn-outline" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <motion.section 
        className={`filters-section ${showFilters ? 'expanded' : ''}`}
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <div className="filters-container">
          {/* Search Bar */}
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by location, title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <button 
            className="mobile-filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            🎛️ Filters
            {hasActiveFilters && <span className="filter-count-badge">{filteredRooms.length}</span>}
          </button>

          {/* Desktop Filters */}
          <div className="filters-row">
            {/* Type Filter */}
            <div className="filter-group">
              <label>Type</label>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                {roomTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div className="filter-group">
              <label>District</label>
              <select 
                value={filterDistrict} 
                onChange={(e) => setFilterDistrict(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Districts</option>
                {maharashtraDistricts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group price-range">
              <label>Price Range</label>
              <div className="price-inputs">
                <span className="currency">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="price-input"
                />
                <span className="separator">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="price-input"
                />
              </div>
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label>Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearAllFilters}>
                Clear All ✕
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Results Bar */}
      <div className="results-bar">
        <p className="results-count">
          Showing <strong>{filteredRooms.length}</strong> properties
        </p>

        {/* Compare Button */}
        {compareList.length > 0 && (
          <motion.button 
            className="compare-bar-btn"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleOpenCompare}
          >
            ⚖️ Compare ({compareList.length})
          </motion.button>
        )}

        <div className="view-toggle">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            ▦
          </button>
          <button 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Active Filters Tags - Removable */}
      {hasActiveFilters && (
        <motion.div 
          className="active-filters"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {filterType !== 'All' && (
            <motion.span 
              className="filter-tag removable"
              whileHover={{ scale: 1.05 }}
              onClick={() => removeFilterTag('type')}
            >
              {filterType} <span className="tag-remove">×</span>
            </motion.span>
          )}
          {filterDistrict !== 'All' && (
            <motion.span 
              className="filter-tag removable"
              whileHover={{ scale: 1.05 }}
              onClick={() => removeFilterTag('district')}
            >
              📍 {filterDistrict} <span className="tag-remove">×</span>
            </motion.span>
          )}
          {(minPrice || maxPrice) && (
            <motion.span 
              className="filter-tag removable"
              whileHover={{ scale: 1.05 }}
              onClick={() => removeFilterTag('price')}
            >
              💰 ₹{minPrice || '0'} - ₹{maxPrice || '∞'} <span className="tag-remove">×</span>
            </motion.span>
          )}
          {debouncedSearch && (
            <motion.span 
              className="filter-tag removable"
              whileHover={{ scale: 1.05 }}
              onClick={() => removeFilterTag('search')}
            >
              "{debouncedSearch}" <span className="tag-remove">×</span>
            </motion.span>
          )}
        </motion.div>
      )}

      {/* Real Map View with Leaflet.js */}
      {viewMode === 'map' ? (
        <PropertyMap 
          rooms={rooms}
          filteredRooms={filteredRooms}
          selectedRoom={selectedRoom}
          onSelectRoom={(room) => setSelectedRoom(room)}
          className="main-map-view"
        />
      ) : (
        /* Rooms Grid/List */
        <main className={`rooms-container ${viewMode}`}>
          <motion.div 
            className={`rooms-${viewMode}`}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              // Loading skeletons with shimmer effect
              Array.from({ length: 6 }).map((_, i) => (
                <RoomCardSkeleton key={i} />
              ))
            ) : filteredRooms.length === 0 ? (
              // Enhanced empty state
              <EmptyState onClearFilters={hasActiveFilters ? clearAllFilters : null} />
            ) : (
              // Room cards with enhanced features
              filteredRooms.map((room) => (
                <motion.div
                  key={room.id}
                  className={`room-card ${viewMode === 'list' ? 'list-view' : ''}`}
                  variants={cardVariant}
                  onClick={() => setSelectedRoom(room)}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35), 0 0 30px rgba(212, 175, 55, 0.1)'
                  }}
                  layout
                >
                  <div className="room-image">
                    <img
                      src={room.imageURL || PLACEHOLDER_IMAGE}
                      alt={room.title}
                      onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                      loading="lazy"
                    />
                    
                    {/* Gradient Price Tag */}
                    <div className="gradient-price-tag">
                      <span className="price-value">₹{room.price?.toLocaleString()}</span>
                      <span className="price-period">/mo</span>
                    </div>
                    
                    <div className="image-overlay">
                      <div className="overlay-actions">
                        <button 
                          className={`favorite-btn ${room.likedBy?.includes(currentUser?.uid) ? 'favorited' : ''}`}
                          onClick={(e) => handleLike(room, e)}
                          aria-label="Save property"
                        >
                          {room.likedBy?.includes(currentUser?.uid) ? '❤️' : '🤍'}
                        </button>
                        
                        {/* Share Button */}
                        <button 
                          className={`share-btn ${copiedLink === room.id ? 'copied' : ''}`}
                          onClick={(e) => handleShare(room, e)}
                          aria-label="Share property"
                        >
                          {copiedLink === room.id ? '✓' : '🔗'}
                        </button>
                        
                        {/* Compare Checkbox */}
                        <button 
                          className={`compare-checkbox ${compareList.find(r => r.id === room.id) ? 'checked' : ''}`}
                          onClick={(e) => handleCompareToggle(room, e)}
                          aria-label="Add to compare"
                        >
                          ⚖️
                        </button>
                      </div>
                    </div>
                    
                    {/* Room Type Badge */}
                    <span className="room-type-badge">{room.roomType}</span>
                    
                    {/* Verified Badge with Animation */}
                    {room.isVerified && (
                      <motion.span 
                        className="verified-badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        ✓ Verified
                      </motion.span>
                    )}
                    
                    {room.videoURL && <span className="video-badge">🎬 Video</span>}
                  </div>

                  <div className="room-details">
                    <h3 className="room-title">{room.title}</h3>
                    <p className="room-location">📍 {room.location}{room.district && `, ${room.district}`}</p>
                    
                    {/* Price row (hidden in grid mode since we have the tag) */}
                    {viewMode === 'list' && (
                      <div className="room-price-row">
                        <span className="room-price">₹{room.price?.toLocaleString()}</span>
                        <span className="price-period">/month</span>
                      </div>
                    )}

                    <div className="room-meta">
                      <span className="post-time">{formatPostTime(room.createdAt)}</span>
                      <span className="likes-count">
                        ❤️ {room.likes || 0}
                      </span>
                    </div>
                  </div>

                  {viewMode === 'list' && (
                    <div className="room-actions">
                      <a href={`tel:${room.phone}`} className="btn btn-primary btn-sm" onClick={(e) => e.stopPropagation()}>
                        📞 Call Owner
                      </a>
                      <a 
                        href={`https://wa.me/91${room.phone}?text=Hi, I'm interested in your property: ${room.title}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm whatsapp-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
          
          {/* Load More Button (for future pagination) */}
          {!loading && filteredRooms.length > 0 && (
            <div className="load-more-container">
              <motion.button 
                className="load-more-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {/* Load more logic */}}
              >
                Load More Properties
              </motion.button>
            </div>
          )}
        </main>
      )}

      {/* Room Detail Modal with Image Gallery */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedRoom(null)}
          >
            <motion.div
              className="modal-container"
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedRoom(null)}>
                ✕
              </button>

              {/* Image Gallery Section */}
              <div className="modal-image-section">
                <ImageGallery 
                  images={selectedRoom.images || []} 
                  mainImage={selectedRoom.imageURL || PLACEHOLDER_IMAGE}
                />
                
                <div className="modal-badges">
                  <span className="modal-type-badge">{selectedRoom.roomType}</span>
                  {selectedRoom.isVerified && (
                    <span className="verified-badge modal-verified">✓ Verified</span>
                  )}
                </div>
              </div>

              {selectedRoom.videoURL && (
                <div className="modal-video-section">
                  <h4>🎬 Property Video Tour</h4>
                  <video controls poster={selectedRoom.imageURL || PLACEHOLDER_IMAGE}>
                    <source src={selectedRoom.videoURL} type="video/mp4" />
                  </video>
                </div>
              )}

              <div className="modal-content-section">
                <h2>{selectedRoom.title}</h2>
                
                <div className="modal-location">
                  📍 {selectedRoom.location}{selectedRoom.district && `, ${selectedRoom.district}`}
                </div>

                <div className="modal-price">
                  ₹{selectedRoom.price?.toLocaleString()}
                  <span>/month</span>
                </div>

                <div className="modal-description">
                  <h4>Description</h4>
                  <p>{selectedRoom.description || 'No description provided for this property.'}</p>
                </div>

                <div className="modal-contact-section">
                  <h4>Contact Owner</h4>
                  <p className="owner-phone">📞 {selectedRoom.phone}</p>
                  
                  <div className="modal-actions">
                    <a href={`tel:${selectedRoom.phone}`} className="btn btn-primary btn-lg">
                      📞 Call Now
                    </a>
                    <a 
                      href={`https://wa.me/91${selectedRoom.phone}?text=Hi, I'm interested in your property: ${selectedRoom.title}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-whatsapp btn-lg"
                    >
                      💬 WhatsApp
                    </a>
                    <button 
                      className="btn btn-outline btn-lg share-modal-btn"
                      onClick={(e) => handleShare(selectedRoom, e)}
                    >
                      {copiedLink === selectedRoom.id ? '✓ Copied!' : '🔗 Share'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <BackToTop />

      {/* Compare Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <CompareModal
            compareList={compareList}
            onClose={() => setShowCompareModal(false)}
            onRemoveFromCompare={handleRemoveFromCompare}
            onSelectRoom={handleSelectRoomFromCompare}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExploreRooms;
