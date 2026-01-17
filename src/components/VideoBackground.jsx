import React, { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './VideoBackground.css';

const VideoBackground = ({ src = '/bg.mp4' }) => {
    const videoRef = useRef(null);
    const rafRef = useRef(null);
    const currentTimeRef = useRef(0);
    const targetTimeRef = useRef(0);

    const location = useLocation();

    useEffect(() => {
        // if we're on the auth page, let that page render its own autoplaying looped video
        if (location && location.pathname && location.pathname.startsWith('/auth')) return;
        const video = videoRef.current;
        if (!video) return;

        let isPlaying = false;
        const LERP = 0.08;
        const FRAME_RATE = 60;
        const FRAME_DURATION = 1000 / FRAME_RATE;
        let last = 0;

        const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

        const lerp = (s, e, f) => s + (e - s) * f;

        const animate = (t) => {
            if (!last) last = t;
            const dt = t - last;
            if (dt >= FRAME_DURATION * 0.5) {
                last = t;
                if (video.duration && !isNaN(video.duration)) {
                    const diff = Math.abs(targetTimeRef.current - currentTimeRef.current);
                    const adaptive = diff > 1 ? LERP * 2 : LERP;
                    currentTimeRef.current = clamp(lerp(currentTimeRef.current, targetTimeRef.current, adaptive), 0, video.duration);
                    if (Math.abs(video.currentTime - currentTimeRef.current) > 0.001) video.currentTime = currentTimeRef.current;
                }
            }
            rafRef.current = requestAnimationFrame(animate);
        };

        const onLoaded = () => {
            video.pause();
            video.muted = true;
            currentTimeRef.current = 0;
            targetTimeRef.current = 0;
            video.currentTime = 0;
            if (!isPlaying) {
                isPlaying = true;
                rafRef.current = requestAnimationFrame(animate);
            }
            // set initial target based on scroll
            const scrollTop = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const pct = clamp(scrollTop / Math.max(1, maxScroll), 0, 1);
            targetTimeRef.current = pct * (video.duration || 0);
        };

        const onScroll = () => {
            const scrollTop = window.scrollY;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const pct = clamp(scrollTop / Math.max(1, maxScroll), 0, 1);
            // ease in/out (simple)
            const eased = pct < 0.5 ? 2 * pct * pct : 1 - Math.pow(-2 * pct + 2, 2) / 2;
            targetTimeRef.current = eased * (video.duration || 0);
        };

        video.addEventListener('loadedmetadata', onLoaded);
        window.addEventListener('scroll', onScroll, { passive: true });
        if (video.readyState >= 1) onLoaded();

        return () => {
            video.removeEventListener('loadedmetadata', onLoaded);
            window.removeEventListener('scroll', onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <>
            <video
                ref={videoRef}
                className="video-background"
                muted
                playsInline
                preload="auto"
            >
                <source src={src} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="video-overlay" aria-hidden="true" />
        </>
    );
};

export default VideoBackground;
