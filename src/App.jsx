import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home/Home';
import Auth from './pages/Auth/Auth';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import ExploreRooms from './pages/ExploreRooms/ExploreRooms';
import './App.css';
import VideoBackground from './components/VideoBackground';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <VideoBackground />
        <div className="app">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected Routes - Admin Only */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected Routes - Customer Only */}
            <Route
              path="/explore-rooms"
              element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <ExploreRooms />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
