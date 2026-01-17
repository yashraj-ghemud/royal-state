import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const Auth = () => {
    const [searchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, signup, currentUser, userRole } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (searchParams.get('mode') === 'signup') {
            setIsLogin(false);
        }
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

        if (!isLogin && password !== confirmPassword) {
            return setError('Passwords do not match!');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already registered. Please login.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else if (err.code === 'auth/user-not-found') {
                setError('User not found. Please sign up.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Wrong password.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        }

        setLoading(false);
    };

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    // Intro/prologue video state: plays once then fades out to reveal auth page
    // Show proj.mp4 on desktop, phnauth.mp4 on mobile
    const [introActive, setIntroActive] = useState(true);
    const [introFading, setIntroFading] = useState(false);
    const [introSrc, setIntroSrc] = useState(window.innerWidth <= 768 ? '/phnauth.mp4' : '/proj.mp4');

    useEffect(() => {
        const handleResize = () => {
            // Only update video source if intro is still active
            if (introActive) {
                setIntroSrc(window.innerWidth <= 768 ? '/phnauth.mp4' : '/proj.mp4');
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [introActive]);

    const handleIntroEnded = () => {
        // start fade-out animation
        setIntroFading(true);
        // after fade completes remove intro overlay
        setTimeout(() => setIntroActive(false), 700);
    };

    return (
        <div className="auth-container">
            {/* Intro overlay: plays proj.mp4 once, then fades away */}
            {introActive && (
                <div className={`intro-overlay ${introFading ? 'fade-out' : ''}`}>
                    <video
                        autoPlay
                        muted
                        playsInline
                        className="intro-video"
                        onEnded={handleIntroEnded}
                    >
                        <source src={introSrc} type="video/mp4" />
                    </video>
                </div>
            )}
            {/* Auth page: local autoplaying looping background video */}
            <video
                autoPlay
                muted
                loop
                playsInline
                className="auth-video-background"
            >
                <source src="/bg.mp4" type="video/mp4" />
            </video>
            <div className="auth-video-overlay"></div>

            {/* bottom/mobile video removed (keeps left video only) */}

            <motion.div
                className={`auth-box auth-main ${introActive ? 'intro-playing' : ''}`}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
            >
                <div className="auth-header">
                    <h1>🏠 Royal Stay 1</h1>
                    <p>{isLogin ? 'Welcome Back!' : 'Create Your Account'}</p>
                </div>

                {/* Toggle Tabs */}
                <div className="auth-tabs">
                    <button
                        className={`tab-btn ${isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(true)}
                    >
                        Login
                    </button>
                    <button
                        className={`tab-btn ${!isLogin ? 'active' : ''}`}
                        onClick={() => setIsLogin(false)}
                    >
                        Sign Up
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
                    </button>
                </form>

                <div className="auth-footer">
                    <a href="/" className="back-link">← Back to Home</a>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
