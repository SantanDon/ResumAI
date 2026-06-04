import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { JobHunterDashboard } from './components/JobHunterDashboard';

// Get Google Client ID from environment or use placeholder
// @ts-ignore - Vite env
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
    const { isAuthenticated, isLoading } = useAuth();
    const [isDemoMode, setIsDemoMode] = useState(false);

    // Check for demo mode
    useEffect(() => {
        const demo = localStorage.getItem('resumai_demo');
        if (demo === 'true') {
            setIsDemoMode(true);
        }
    }, []);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Show login if not authenticated and not in demo mode
    if (!isAuthenticated && !isDemoMode) {
        return <LoginPage />;
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            <JobHunterDashboard />
        </div>
    );
}

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
