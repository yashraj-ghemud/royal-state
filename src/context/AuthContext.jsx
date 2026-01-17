import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

const AuthContext = createContext();

// Hardcoded Admin Credentials
const ADMIN_EMAIL = 'admin';
const ADMIN_PASSWORD = 'dusing@2007';

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    // Signup function - All signups are customers
    const signup = async (email, password) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Save user role in Firestore - Always customer
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            role: 'customer',
            createdAt: new Date().toISOString()
        });
        setUserRole('customer');
        return userCredential;
    };

    // Login function with hardcoded admin check
    const login = async (email, password) => {
        // Check for hardcoded admin credentials
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            // Set admin user locally (no Firebase auth for admin)
            setCurrentUser({ email: ADMIN_EMAIL, uid: 'admin-local' });
            setUserRole('admin');
            return { user: { email: ADMIN_EMAIL, uid: 'admin-local' } };
        }

        // Regular Firebase login for customers
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Fetch user role
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
        } else {
            setUserRole('customer');
        }
        return userCredential;
    };

    // Logout function
    const logout = async () => {
        setUserRole(null);
        setCurrentUser(null);
        // Only sign out if it's a Firebase user
        if (auth.currentUser) {
            return signOut(auth);
        }
    };

    // Get user role
    const getUserRole = async (uid) => {
        if (uid === 'admin-local') return 'admin';
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data().role;
        }
        return 'customer';
    };

    useEffect(() => {
        console.log('AuthProvider initializing, auth object:', auth);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('onAuthStateChanged fired, user:', user);
            try {
                if (user) {
                    setCurrentUser(user);
                    const role = await getUserRole(user.uid);
                    setUserRole(role);
                } else if (!currentUser) {
                    setCurrentUser(null);
                    setUserRole(null);
                }
            } catch (err) {
                console.error('Error in auth state handler:', err);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        signup,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {/* DEBUG: render children regardless of loading to avoid blank page during auth init */}
            {children}
        </AuthContext.Provider>
    );
};
