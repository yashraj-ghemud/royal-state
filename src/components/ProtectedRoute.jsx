import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, userRole, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#1a1a2e',
                color: 'white'
            }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/auth" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect based on role
        if (userRole === 'admin') {
            return <Navigate to="/admin-dashboard" replace />;
        } else {
            return <Navigate to="/explore-rooms" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
