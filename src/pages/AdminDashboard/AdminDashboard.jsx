import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db, cloudinaryConfig } from '../../config/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

// Toast Notification Component
const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    return (
        <motion.div
            className={`toast toast-${type}`}
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
        >
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </motion.div>
    );
};

// Cinematic Delete Confirmation Modal
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, roomTitle }) => {
    if (!isOpen) return null;

    return (
        <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="delete-modal"
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
                <div className="delete-icon-wrapper">
                    <motion.span
                        className="delete-icon-large"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                    >
                        🗑️
                    </motion.span>
                </div>
                <h3>Delete Room?</h3>
                <p>Are you sure you want to remove <strong>"{roomTitle}"</strong>?</p>
                <p className="delete-warning">This action cannot be undone.</p>

                <div className="delete-actions">
                    <motion.button
                        className="modal-btn cancel"
                        onClick={onClose}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Cancel
                    </motion.button>
                    <motion.button
                        className="modal-btn confirm"
                        onClick={onConfirm}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Yes, Delete It
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Placeholder image URL
const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300/1a1a2e/00d9ff?text=No+Image';

const AdminDashboard = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState(null);

    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
    const [eta, setEta] = useState('');

    // Refs for tracking parallel upload progress
    const fileProgressRef = useRef({ image: { loaded: 0, total: 0 }, video: { loaded: 0, total: 0 } });
    const startTimeRef = useRef(0);

    // Form states
    const [district, setDistrict] = useState('');
    const [location, setLocation] = useState('');
    const [price, setPrice] = useState('');
    const [phone, setPhone] = useState('');
    const [description, setDescription] = useState('');
    const [roomType, setRoomType] = useState('PG');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [video, setVideo] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);

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

    // Toast helper functions
    const showToast = (message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Redirect if not admin
    useEffect(() => {
        if (userRole && userRole !== 'admin') {
            navigate('/explore-rooms');
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
            showToast('Failed to load rooms. Please refresh.', 'error');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Handle image selection with validation
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast('Image size must be less than 10MB', 'warning');
                return;
            }
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showToast('Please select a valid image file', 'warning');
                return;
            }
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle video selection with validation
    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 100MB)
            if (file.size > 100 * 1024 * 1024) {
                showToast('Video size must be less than 100MB', 'warning');
                return;
            }
            // Validate file type
            if (!file.type.startsWith('video/')) {
                showToast('Please select a valid video file', 'warning');
                return;
            }
            setVideo(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const updateOverallProgress = () => {
        const { image, video } = fileProgressRef.current;
        const totalLoaded = image.loaded + video.loaded;
        const totalSize = image.total + video.total;

        if (totalSize === 0) return;

        // Cap upload progress at 90% (reserve last 10% for processing)
        const percent = Math.min(90, Math.round((totalLoaded / totalSize) * 90));
        setUploadProgress(percent);

        // Calculate ETA
        const elapsedTime = (Date.now() - startTimeRef.current) / 1000;
        if (elapsedTime > 0.5 && percent > 0) {
            const speed = totalLoaded / elapsedTime;
            const remainingBytes = totalSize - totalLoaded;
            const remainingSeconds = Math.round(remainingBytes / speed) + 2;

            if (remainingSeconds < 60) {
                setEta(`${remainingSeconds}s remaining`);
            } else {
                const mins = Math.ceil(remainingSeconds / 60);
                setEta(`${mins}m remaining`);
            }
        }
    };

    // Upload file to Cloudinary with Progress Tracking
    const uploadToCloudinary = (file, resourceType = 'image') => {
        return new Promise((resolve, reject) => {
            const fileData = new FormData();
            fileData.append('file', file);
            fileData.append('upload_preset', cloudinaryConfig.uploadPreset);

            const xhr = new XMLHttpRequest();
            const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType}/upload`;

            xhr.open('POST', url, true);

            // Initialize progress entry
            fileProgressRef.current[resourceType] = { loaded: 0, total: file.size };

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    fileProgressRef.current[resourceType].loaded = event.loaded;
                    fileProgressRef.current[resourceType].total = event.total;
                    updateOverallProgress();
                }
            };

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data.secure_url);
                } else {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        reject(new Error(errorData.error?.message || 'Upload failed'));
                    } catch (e) {
                        reject(new Error('Upload failed with status ' + xhr.status));
                    }
                }
            };

            xhr.onerror = () => {
                reject(new Error('Network error occurred during upload'));
            };

            xhr.send(fileData);
        });
    };

    // Compress Image Function
    const compressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas is empty'));
                            return;
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    // Reset form to initial state
    const resetForm = () => {
        setDistrict('');
        setLocation('');
        setPrice('');
        setPhone('');
        setDescription('');
        setRoomType('PG');
        setImage(null);
        setImagePreview(null);
        setVideo(null);
        setVideoPreview(null);
        setUploadProgress(0);
        setUploadStatus('');
        setEta('');
    };

    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!district) {
            showToast('Please select a district', 'warning');
            return;
        }
        if (!location.trim()) {
            showToast('Please enter a location address', 'warning');
            return;
        }
        if (!price || Number(price) <= 0) {
            showToast('Please enter a valid rent amount', 'warning');
            return;
        }
        if (!phone.trim() || phone.length < 10) {
            showToast('Please enter a valid phone number', 'warning');
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        const hasMedia = image || video;

        if (hasMedia) {
            setEta('Calculating...');
            setUploadStatus('Starting Uploads... 🚀');
            fileProgressRef.current = {
                image: { loaded: 0, total: image ? image.size : 0 },
                video: { loaded: 0, total: video ? video.size : 0 }
            };
            startTimeRef.current = Date.now();
        } else {
            setUploadStatus('Saving Room Details... 📝');
            setEta('');
            setUploadProgress(30);
        }

        try {
            let imageURL = null;
            let videoURL = null;

            // Upload image if provided
            if (image) {
                setUploadStatus('Optimizing Image... 🎨');
                const compressedImage = await compressImage(image);
                fileProgressRef.current.image.total = compressedImage.size;

                setUploadStatus('Uploading Image... 🖼️');
                imageURL = await uploadToCloudinary(compressedImage, 'image');
            }

            // Upload video if provided
            if (video) {
                setUploadStatus('Uploading Video... 🎬');
                videoURL = await uploadToCloudinary(video, 'video');
            }

            // Final save phase
            if (hasMedia) {
                setUploadStatus('Finalizing & Saving... ✨');
                setEta('Almost done...');
                for (let i = 91; i <= 99; i++) {
                    setUploadProgress(i);
                    await new Promise(r => setTimeout(r, 50));
                }
            } else {
                setUploadStatus('Saving to database... 💾');
                setUploadProgress(70);
            }

            // Generate title from roomType and district
            const generatedTitle = `${roomType} in ${district}`;

            // Add room to Firestore with timeout
            const roomData = {
                title: generatedTitle,
                district: district,
                location: location.trim(),
                price: Number(price),
                phone: phone.trim(),
                description: description.trim() || '',
                roomType: roomType,
                imageURL: imageURL || PLACEHOLDER_IMAGE,
                videoURL: videoURL || null,
                ownerId: currentUser?.uid || 'admin',
                ownerEmail: currentUser?.email || 'admin',
                createdAt: serverTimestamp(),
                status: 'active'
            };

            console.log('Saving room data:', roomData);
            setUploadProgress(80);
            setUploadStatus('Connecting to database... 🔗');

            // Add timeout to prevent infinite hanging
            const saveWithTimeout = async () => {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Database save timed out. Please check your connection.')), 15000)
                );
                const savePromise = addDoc(collection(db, 'rooms'), roomData);
                return Promise.race([savePromise, timeoutPromise]);
            };

            await saveWithTimeout();
            console.log('Room saved successfully!');

            setUploadProgress(100);
            setUploadStatus('Done! 🎉');

            // Reset and close form
            resetForm();
            setShowForm(false);
            showToast('Room posted successfully! 🎉', 'success');

        } catch (error) {
            console.error('Error posting room:', error);
            setUploadProgress(0);
            setUploadStatus('');
            showToast(`Error: ${error.message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    // Initiate delete (open modal)
    const handleDelete = (roomId, roomTitle) => {
        setRoomToDelete({ id: roomId, title: roomTitle });
        setShowDeleteModal(true);
    };

    // Confirm delete (execute logic)
    const confirmDelete = async () => {
        if (!roomToDelete) return;

        try {
            await deleteDoc(doc(db, 'rooms', roomToDelete.id));
            showToast('Room deleted successfully', 'success');
            setShowDeleteModal(false);
            setRoomToDelete(null);
        } catch (error) {
            console.error('Error deleting room:', error);
            showToast('Error deleting room. Please try again.', 'error');
        }
    };

    // Logout
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
            showToast('Error logging out', 'error');
        }
    };

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    const cardVariant = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <div className="admin-container">
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <DeleteConfirmationModal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={confirmDelete}
                        roomTitle={roomToDelete?.title}
                    />
                )}
            </AnimatePresence>

            {/* Toast Notifications */}
            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Header */}
            <motion.header
                className="admin-header"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div className="header-left">
                    <h1>🏠 Admin Dashboard</h1>
                    <p>Welcome back, {currentUser?.email}</p>
                </div>
                <div className="header-right">
                    <motion.button
                        className="logout-btn"
                        onClick={handleLogout}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        🚪 Logout
                    </motion.button>
                </div>
            </motion.header>

            {/* Stats */}
            <motion.div
                className="stats-container"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
            >
                <motion.div className="stat-card" variants={cardVariant}>
                    <span className="stat-icon">🏡</span>
                    <div className="stat-info">
                        <h3>{rooms.length}</h3>
                        <p>Total Rooms</p>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={cardVariant}>
                    <span className="stat-icon">✅</span>
                    <div className="stat-info">
                        <h3>{rooms.filter(r => r.status === 'active').length || rooms.length}</h3>
                        <p>Active Listings</p>
                    </div>
                </motion.div>
                <motion.div className="stat-card" variants={cardVariant}>
                    <span className="stat-icon">🎬</span>
                    <div className="stat-info">
                        <h3>{rooms.filter(r => r.videoURL).length}</h3>
                        <p>With Videos</p>
                    </div>
                </motion.div>
            </motion.div>

            {/* Add Room Button */}
            <motion.div
                className="action-bar"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <motion.button
                    className="add-room-btn"
                    onClick={() => setShowForm(!showForm)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    {showForm ? '✕ Close Form' : '✨ Add New Room'}
                </motion.button>
            </motion.div>

            {/* Add Room Form */}
            <AnimatePresence>
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
                                    <select
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        required
                                        id="district"
                                        disabled={uploading}
                                    >
                                        <option value="">Select District</option>
                                        {maharashtraDistricts.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <label htmlFor="district">District (Maharashtra)</label>
                                </div>
                                <div className="form-group">
                                    <select
                                        value={roomType}
                                        onChange={(e) => setRoomType(e.target.value)}
                                        required
                                        id="roomType"
                                        disabled={uploading}
                                    >
                                        <option value="PG">PG</option>
                                        <option value="Single Room">Single Room</option>
                                        <option value="1BHK">1BHK</option>
                                        <option value="2BHK">2BHK</option>
                                        <option value="3BHK">3BHK</option>
                                        <option value="Flat">Flat</option>
                                    </select>
                                    <label htmlFor="roomType">Room Type</label>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder=" "
                                        required
                                        id="location"
                                        disabled={uploading}
                                    />
                                    <label htmlFor="location">Address / Area</label>
                                </div>
                                <div className="form-group">
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder=" "
                                        required
                                        min="1"
                                        id="price"
                                        disabled={uploading}
                                    />
                                    <label htmlFor="price">Monthly Rent (₹)</label>
                                </div>
                            </div>

                            <div className="form-group">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder=" "
                                    required
                                    id="phone"
                                    pattern="[0-9]{10}"
                                    title="Please enter a 10-digit phone number"
                                    disabled={uploading}
                                />
                                <label htmlFor="phone">Phone Number</label>
                            </div>

                            <div className="form-group">
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder=" "
                                    rows="4"
                                    id="description"
                                    disabled={uploading}
                                />
                                <label htmlFor="description">Description (Amenities, etc.)</label>
                            </div>

                            {/* Media Uploads */}
                            <div className="media-upload-row">
                                <div className="form-group media-upload-item">
                                    <label className="simple-file-label">Room Image</label>
                                    <div className="simple-upload-box">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            id="room-image"
                                            disabled={uploading}
                                        />
                                        <label htmlFor="room-image" className="simple-upload-trigger">
                                            <span className="file-icon">🖼️</span>
                                            <span className="file-text">
                                                {image ? image.name : 'Choose Image File...'}
                                            </span>
                                            {!image && <span className="upload-badge optional">OPTIONAL</span>}
                                        </label>
                                    </div>
                                    {imagePreview && (
                                        <div className="preview-container">
                                            <img src={imagePreview} alt="Preview" className="mini-preview" />
                                            <button
                                                type="button"
                                                className="remove-media"
                                                onClick={() => { setImage(null); setImagePreview(null); }}
                                                disabled={uploading}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="form-group media-upload-item">
                                    <label className="simple-file-label">Room Video</label>
                                    <div className="simple-upload-box">
                                        <input
                                            type="file"
                                            accept="video/*"
                                            onChange={handleVideoChange}
                                            id="room-video"
                                            disabled={uploading}
                                        />
                                        <label htmlFor="room-video" className="simple-upload-trigger">
                                            <span className="file-icon">🎬</span>
                                            <span className="file-text">
                                                {video ? video.name : 'Choose Video File...'}
                                            </span>
                                            {!video && <span className="upload-badge optional">OPTIONAL</span>}
                                        </label>
                                    </div>
                                    {videoPreview && (
                                        <div className="preview-container">
                                            <video src={videoPreview} className="mini-preview" />
                                            <button
                                                type="button"
                                                className="remove-media"
                                                onClick={() => { setVideo(null); setVideoPreview(null); }}
                                                disabled={uploading}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {uploading && (
                                <div className="upload-progress-container">
                                    <div className="progress-label">
                                        <span>
                                            {uploadStatus}
                                            {eta && <span style={{ opacity: 0.7, marginLeft: '8px', fontSize: '0.85em' }}>⏱️ {eta}</span>}
                                        </span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="progress-track">
                                        <motion.div
                                            className="progress-fill"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${uploadProgress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={uploading}
                            >
                                {uploading ? 'Processing...' : '🚀 Post Room'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rooms List */}
            <div className="rooms-section">
                <h2>Your Posted Rooms</h2>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Loading rooms...</p>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="no-rooms">
                        <span className="no-rooms-icon">📭</span>
                        <p>No rooms posted yet. Click "Add New Room" to get started!</p>
                    </div>
                ) : (
                    <motion.div
                        className="rooms-grid"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="visible"
                    >
                        {rooms.map((room, index) => (
                            <motion.div
                                key={room.id}
                                className="room-card"
                                variants={cardVariant}
                            >
                                <div className="room-image">
                                    <img
                                        src={room.imageURL || PLACEHOLDER_IMAGE}
                                        alt={room.title}
                                        onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                                    />
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
                                        onClick={() => handleDelete(room.id, room.title)}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
