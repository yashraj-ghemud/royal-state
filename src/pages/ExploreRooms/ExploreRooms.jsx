import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import './ExploreRooms.css';

// Placeholder image URL
const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/1a1a2e/00d9ff?text=No+Image';

const ExploreRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [filterType, setFilterType] = useState('All');
    const [filterDistrict, setFilterDistrict] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    // Maharashtra Districts
    const maharashtraDistricts = [
        'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
        'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
        'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban',
        'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar',
        'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara',
        'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
    ];

    const { currentUser, logout, userRole } = useAuth();
    const navigate = useNavigate();

    // Redirect if admin
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
            setFilteredRooms(roomsData);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching rooms:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter rooms
    useEffect(() => {
        let filtered = rooms;

        // Filter by type
        if (filterType !== 'All') {
            filtered = filtered.filter(room => room.roomType === filterType);
        }

        // Filter by district
        if (filterDistrict !== 'All') {
            filtered = filtered.filter(room => room.district === filterDistrict);
        }

        // Filter by price range (manual min/max)
        const min = minPrice ? Number(minPrice) : 0;
        const max = maxPrice ? Number(maxPrice) : Infinity;
        if (minPrice || maxPrice) {
            filtered = filtered.filter(room => {
                const price = room.price || 0;
                return price >= min && price <= max;
            });
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(room =>
                room.title?.toLowerCase().includes(query) ||
                room.location?.toLowerCase().includes(query) ||
                room.description?.toLowerCase().includes(query) ||
                room.district?.toLowerCase().includes(query)
            );
        }

        setFilteredRooms(filtered);
    }, [filterType, filterDistrict, searchQuery, minPrice, maxPrice, rooms]);

    // Logout
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const roomTypes = ['All', 'PG', 'Single Room', '1BHK', '2BHK', '3BHK', 'Flat'];

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariant = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    return (
        <div className="explore-container">
            {/* Header */}
            <header className="explore-header">
                <div className="header-left">
                    <h1>🏠 Royal Stay 1</h1>
                    <p>Find your perfect room</p>
                </div>
                <div className="header-right">
                    {currentUser ? (
                        <>
                            <span className="user-email">{currentUser.email}</span>
                            <button className="logout-btn cursor-target" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <button className="login-btn cursor-target" onClick={() => navigate('/auth')}>
                            Login
                        </button>
                    )}
                </div>
            </header>

            {/* Search & Filters */}
            <motion.div
                className="filters-section"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
            >
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by location, title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="filter-tabs">
                    {roomTypes.map(type => (
                        <button
                            key={type}
                            className={`filter-tab cursor-target ${filterType === type ? 'active' : ''}`}
                            onClick={() => setFilterType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="price-filter">
                    <span className="price-label">₹</span>
                    <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="price-input cursor-target"
                        min="0"
                    />
                    <span className="price-separator">-</span>
                    <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="price-input cursor-target"
                        min="0"
                    />
                    {(minPrice || maxPrice) && (
                        <button
                            className="clear-price cursor-target"
                            onClick={() => { setMinPrice(''); setMaxPrice(''); }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="district-filter">
                    <select
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        className="district-select cursor-target"
                    >
                        <option value="All">All Districts</option>
                        {maharashtraDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>
            </motion.div>

            {/* Results Count */}
            <div className="results-info">
                <p>
                    Showing <span className="count">{filteredRooms.length}</span> rooms
                    {filterType !== 'All' && <span className="filter-tag">{filterType}</span>}
                    {filterDistrict !== 'All' && <span className="filter-tag">{filterDistrict}</span>}
                    {(minPrice || maxPrice) && <span className="filter-tag">₹ {minPrice || '0'} - {maxPrice || '∞'}</span>}
                </p>
            </div>

            {/* Rooms Grid */}
            <motion.div
                className="rooms-grid"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading rooms...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="no-rooms">
                        <span className="no-rooms-icon">🏠</span>
                        <p>No rooms found. Try different filters!</p>
                        {(filterType !== 'All' || priceRange !== 'All' || searchQuery) && (
                            <button
                                className="clear-filters-btn"
                                onClick={() => {
                                    setFilterType('All');
                                    setPriceRange('All');
                                    setSearchQuery('');
                                }}
                            >
                                Clear All Filters
                            </button>
                        )}
                    </div>
                ) : (
                    filteredRooms.map((room) => (
                        <motion.div
                            key={room.id}
                            className="room-card cursor-target"
                            variants={cardVariant}
                            onClick={() => setSelectedRoom(room)}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                        >
                            <div className="room-image">
                                <img
                                    src={room.imageURL || PLACEHOLDER_IMAGE}
                                    alt={room.title}
                                    onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                                    loading="lazy"
                                />
                                <span className="room-type-badge">{room.roomType}</span>
                                {room.videoURL && <span className="video-indicator">🎬</span>}
                            </div>
                            <div className="room-info">
                                <h3>{room.title}</h3>
                                <p className="room-location">📍 {room.location}</p>
                                <p className="room-price">₹{room.price?.toLocaleString()}<span>/month</span></p>
                            </div>
                            <div className="room-actions">
                                <a
                                    href={`tel:${room.phone}`}
                                    className="call-btn cursor-target"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    📞 Call Owner
                                </a>
                            </div>
                        </motion.div>
                    ))
                )}
            </motion.div>

            {/* Room Detail Modal */}
            <AnimatePresence>
                {selectedRoom && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedRoom(null)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="modal-close"
                                onClick={() => setSelectedRoom(null)}
                            >
                                ✕
                            </button>

                            <div className="modal-image">
                                <img
                                    src={selectedRoom.imageURL || PLACEHOLDER_IMAGE}
                                    alt={selectedRoom.title}
                                    onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                                />
                                <span className="room-type-badge">{selectedRoom.roomType}</span>
                            </div>

                            {/* Video Section (if available) */}
                            {selectedRoom.videoURL && (
                                <div className="modal-video">
                                    <h4>🎬 Room Video Tour</h4>
                                    <video
                                        src={selectedRoom.videoURL}
                                        controls
                                        className="room-video-player"
                                        poster={selectedRoom.imageURL || PLACEHOLDER_IMAGE}
                                    />
                                </div>
                            )}

                            <div className="modal-details">
                                <h2>{selectedRoom.title}</h2>
                                <p className="modal-location">📍 {selectedRoom.location}</p>
                                <p className="modal-price">
                                    ₹{selectedRoom.price?.toLocaleString()}
                                    <span className="price-suffix">/month</span>
                                </p>

                                <div className="modal-description">
                                    <h4>📝 Description</h4>
                                    <p>{selectedRoom.description || 'No description provided.'}</p>
                                </div>

                                <div className="modal-contact">
                                    <h4>📞 Contact Owner</h4>
                                    <p className="owner-phone">{selectedRoom.phone}</p>
                                    <a
                                        href={`tel:${selectedRoom.phone}`}
                                        className="call-btn large cursor-target"
                                    >
                                        📞 Call Now
                                    </a>
                                    <a
                                        href={`https://wa.me/91${selectedRoom.phone}?text=Hi, I'm interested in your room listing: ${selectedRoom.title}`}
                                        className="whatsapp-btn cursor-target"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        💬 WhatsApp
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ExploreRooms;
