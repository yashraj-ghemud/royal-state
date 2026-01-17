import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import './ExploreRooms.css';

const ExploreRooms = () => {
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [filterType, setFilterType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

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

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(room =>
                room.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredRooms(filtered);
    }, [filterType, searchQuery, rooms]);

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

    return (
        <div className="explore-container">
            {/* Header */}
            <header className="explore-header">
                <div className="header-left">
                    <h1>🏠 RentEasy</h1>
                    <p>Find your perfect room</p>
                </div>
                <div className="header-right">
                    <span className="user-email">{currentUser?.email}</span>
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
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
                </div>

                <div className="filter-tabs">
                    {roomTypes.map(type => (
                        <button
                            key={type}
                            className={`filter-tab ${filterType === type ? 'active' : ''}`}
                            onClick={() => setFilterType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Results Count */}
            <div className="results-info">
                <p>Showing {filteredRooms.length} rooms</p>
            </div>

            {/* Rooms Grid */}
            <div className="rooms-grid">
                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading rooms...</p>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="no-rooms">
                        <span>🏠</span>
                        <p>No rooms found. Try different filters!</p>
                    </div>
                ) : (
                    filteredRooms.map((room, index) => (
                        <motion.div
                            key={room.id}
                            className="room-card"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedRoom(room)}
                        >
                            <div className="room-image">
                                <img src={room.imageURL} alt={room.title} />
                                <span className="room-type-badge">{room.roomType}</span>
                            </div>
                            <div className="room-info">
                                <h3>{room.title}</h3>
                                <p className="room-location">📍 {room.location}</p>
                                <p className="room-price">₹{room.price?.toLocaleString()}/month</p>
                            </div>
                            <div className="room-actions">
                                <a
                                    href={`tel:${room.phone}`}
                                    className="call-btn"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    📞 Call Owner
                                </a>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

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
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="modal-close"
                                onClick={() => setSelectedRoom(null)}
                            >
                                ✕
                            </button>

                            <div className="modal-image">
                                <img src={selectedRoom.imageURL} alt={selectedRoom.title} />
                                <span className="room-type-badge">{selectedRoom.roomType}</span>
                            </div>

                            {/* Video Section (if available) */}
                            {selectedRoom.videoURL && (
                                <div className="modal-video">
                                    <h4>🎬 Room Video</h4>
                                    <video
                                        src={selectedRoom.videoURL}
                                        controls
                                        className="room-video-player"
                                    />
                                </div>
                            )}

                            <div className="modal-details">
                                <h2>{selectedRoom.title}</h2>
                                <p className="modal-location">📍 {selectedRoom.location}</p>
                                <p className="modal-price">₹{selectedRoom.price?.toLocaleString()}/month</p>

                                <div className="modal-description">
                                    <h4>Description</h4>
                                    <p>{selectedRoom.description}</p>
                                </div>

                                <div className="modal-contact">
                                    <h4>Contact Owner</h4>
                                    <p className="owner-phone">📞 {selectedRoom.phone}</p>
                                    <a
                                        href={`tel:${selectedRoom.phone}`}
                                        className="call-btn large"
                                    >
                                        📞 Call Now
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
