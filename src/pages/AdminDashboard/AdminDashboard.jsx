import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db, cloudinaryConfig } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form states
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [price, setPrice] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [roomType, setRoomType] = useState('PG');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [video, setVideo] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);

    const { currentUser, logout, userRole } = useAuth();
    const navigate = useNavigate();

    // Redirect if not admin
    useEffect(() => {
        if (userRole && userRole !== 'admin') {
            navigate('/explore-rooms');
        }
    }, [userRole, navigate]);

    // Fetch rooms
    const fetchRooms = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const roomsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRooms(roomsData);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle video selection
    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideo(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    // Upload file to Cloudinary (FREE - No Firebase Storage needed!)
    const uploadToCloudinary = async (file, resourceType = 'image') => {
        const fileData = new FormData();
        fileData.append('file', file);
        fileData.append('upload_preset', cloudinaryConfig.uploadPreset);

        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`,
            {
                method: 'POST',
                body: fileData
            }
        );
        const data = await res.json();
        return data.secure_url;
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!image) {
            alert('Please select an image');
            return;
        }

        setUploading(true);

        try {
            // Upload image to Cloudinary
            const imageURL = await uploadToCloudinary(image, 'image');

            // Upload video to Cloudinary (if selected)
            let videoURL = null;
            if (video) {
                videoURL = await uploadToCloudinary(video, 'video');
            }

            // Add room to Firestore
            await addDoc(collection(db, 'rooms'), {
                title,
                location,
                price: Number(price),
                phone,
                description,
                roomType,
                imageURL,
                videoURL,
                ownerId: currentUser.uid,
                ownerEmail: currentUser.email,
                createdAt: serverTimestamp()
            });

            // Reset form
            setTitle('');
            setLocation('');
            setPrice('');
            setPhone('');
            setDescription('');
            setRoomType('PG');
            setImage(null);
            setImagePreview(null);
            setVideo(null);
            setVideoPreview(null);
            setShowForm(false);

            // Refresh rooms
            fetchRooms();

            alert('Room posted successfully! 🎉');
        } catch (error) {
            console.error('Error posting room:', error);
            alert('Error posting room. Please try again.');
        }

        setUploading(false);
    };

    // Delete room
    const handleDelete = async (roomId) => {
        if (window.confirm('Are you sure you want to delete this room?')) {
            try {
                await deleteDoc(doc(db, 'rooms', roomId));
                fetchRooms();
                alert('Room deleted successfully!');
            } catch (error) {
                console.error('Error deleting room:', error);
                alert('Error deleting room.');
            }
        }
    };

    // Logout
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <div className="admin-container">
            {/* Header */}
            <header className="admin-header">
                <div className="header-left">
                    <h1>🏠 Admin Dashboard</h1>
                    <p>Welcome, {currentUser?.email}</p>
                </div>
                <div className="header-right">
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Stats */}
            <motion.div
                className="stats-container"
                initial="hidden"
                animate="visible"
                variants={fadeIn}
            >
                <div className="stat-card">
                    <span className="stat-icon">🏡</span>
                    <div className="stat-info">
                        <h3>{rooms.length}</h3>
                        <p>Total Rooms Posted</p>
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-icon">📱</span>
                    <div className="stat-info">
                        <h3>Active</h3>
                        <p>Listings Status</p>
                    </div>
                </div>
            </motion.div>

            {/* Add Room Button */}
            <div className="action-bar">
                <button
                    className="add-room-btn"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✕ Close Form' : '+ Add New Room'}
                </button>
            </div>

            {/* Add Room Form */}
            {showForm && (
                <motion.div
                    className="form-container"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <form onSubmit={handleSubmit} className="room-form">
                        <h2>Post New Room</h2>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Room Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Spacious 1BHK near Metro"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Room Type</label>
                                <select
                                    value={roomType}
                                    onChange={(e) => setRoomType(e.target.value)}
                                    required
                                >
                                    <option value="PG">PG</option>
                                    <option value="Single Room">Single Room</option>
                                    <option value="1BHK">1BHK</option>
                                    <option value="2BHK">2BHK</option>
                                    <option value="3BHK">3BHK</option>
                                    <option value="Flat">Flat</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="e.g., Sector 62, Noida"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Monthly Rent (₹)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="e.g., 8000"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g., +91 9876543210"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the room, amenities, nearby places..."
                                rows="4"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Room Image</label>
                            <div className="image-upload">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    id="room-image"
                                    required
                                />
                                <label htmlFor="room-image" className="upload-label">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="image-preview" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <span>📷</span>
                                            <p>Click to upload image</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Room Video (Optional)</label>
                            <div className="image-upload">
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoChange}
                                    id="room-video"
                                />
                                <label htmlFor="room-video" className="upload-label">
                                    {videoPreview ? (
                                        <video src={videoPreview} className="video-preview" controls />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <span>🎬</span>
                                            <p>Click to upload video (optional)</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading to Cloudinary...' : '🚀 Post Room'}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Rooms List */}
            <div className="rooms-section">
                <h2>Your Posted Rooms</h2>

                {loading ? (
                    <div className="loading">Loading rooms...</div>
                ) : rooms.length === 0 ? (
                    <div className="no-rooms">
                        <p>No rooms posted yet. Click "Add New Room" to get started!</p>
                    </div>
                ) : (
                    <div className="rooms-grid">
                        {rooms.map((room, index) => (
                            <motion.div
                                key={room.id}
                                className="room-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="room-image">
                                    <img src={room.imageURL} alt={room.title} />
                                    <span className="room-type-badge">{room.roomType}</span>
                                    {room.videoURL && <span className="video-badge">🎬</span>}
                                </div>
                                <div className="room-details">
                                    <h3>{room.title}</h3>
                                    <p className="room-location">📍 {room.location}</p>
                                    <p className="room-price">₹{room.price?.toLocaleString()}/month</p>
                                    <p className="room-phone">📞 {room.phone}</p>
                                </div>
                                <div className="room-actions">
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(room.id)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
