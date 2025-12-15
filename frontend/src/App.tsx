import { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { MassMailInterface } from './components/MassMailInterface';
import { MasterCVViewer } from './components/MasterCVViewer';
import { CVEditor } from './components/CVEditor';
import { EnhancedChatInterface } from './components/EnhancedChatInterface';
import { MassApplyInterface } from './components/MassApplyInterface';
import { LoginPage } from './components/LoginPage';
import { PixelBlast } from './components/reactbits/PixelBlast';

// Get Google Client ID from environment or use placeholder
// @ts-ignore - Vite env
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

type View = 'landing' | 'cvChat' | 'massMail' | 'masterCV' | 'editor' | 'enhancedChat' | 'massApply';

function AppContent() {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const [currentView, setCurrentView] = useState<View>('landing');
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

    const handleLogout = () => {
        logout();
        localStorage.removeItem('resumai_demo');
        setIsDemoMode(false);
    };

    const renderView = () => {
        switch (currentView) {
            case 'landing':
                return <LandingPage onNavigate={setCurrentView} />;
            case 'cvChat':
            case 'enhancedChat':
                return <EnhancedChatInterface onBack={() => setCurrentView('landing')} />;
            case 'massMail':
                return <MassMailInterface onBack={() => setCurrentView('landing')} />;
            case 'massApply':
                return <MassApplyInterface onBack={() => setCurrentView('landing')} />;
            case 'masterCV':
                return <MasterCVViewer />;
            case 'editor':
                return <CVEditor onBack={() => setCurrentView('landing')} />;
            default:
                return <LandingPage onNavigate={setCurrentView} />;
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* User Menu - Top Right */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
                {user && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10">
                        {user.picture && (
                            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                        )}
                        <span className="text-white text-sm">{user.name}</span>
                    </div>
                )}
                {isDemoMode && (
                    <div className="px-3 py-1 bg-yellow-500/20 rounded-full border border-yellow-500/30">
                        <span className="text-yellow-400 text-xs">Demo Mode</span>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white text-sm transition-colors border border-white/10"
                >
                    Sign Out
                </button>
            </div>

            <PixelBlast>
                <div className="relative z-10 w-full h-full overflow-y-auto">
                    {renderView()}
                </div>
            </PixelBlast>
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
