// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
    apiKey: "T7t5Au63UpH5Y9xKSK889a7jNbKVESjB2mYD7VdZ",
    authDomain: "royal-stay-1.firebaseapp.com",
    databaseURL: "https://royal-stay-1-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "royal-stay-1",
    storageBucket: "royal-stay-1.appspot.com",
    messagingSenderId: "",
    appId: ""
};

// Cloudinary Configuration
export const cloudinaryConfig = {
    cloudName: "dnamqbz74",
    uploadPreset: "pg_upload_preset"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
