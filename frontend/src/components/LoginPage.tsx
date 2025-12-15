import { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { Icons } from './ui/Icons';
import { AsciiText } from './reactbits/AsciiText';
import { BlurText } from './reactbits/BlurText';

// Check if Google OAuth is configured
// @ts-ignore
const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
const isGoogleConfigured = GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE';

export function LoginPage() {
    const { login, isLoading } = useAuth();
    const [showGoogleOption, setShowGoogleOption] = useState(false);

    const handleGoogleSuccess = async (response: CredentialResponse) => {
        if (response.credential) {
            const success = await login(response.credential);
            if (!success) {
                console.error('Login failed');
            }
        }
    };

    const handleGoogleError = () => {
        console.error('Google login failed');
    };

    const handleDemoMode = () => {
        localStorage.setItem('resumai_demo', 'true');
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            {/* Logo and Title */}
            <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                    <AsciiText 
                        text="RESUMAI" 
                        className="text-white text-center"
                        fps={10}
                    />
                </div>
                <BlurText
                    text="Swarm-Powered Career Tools"
                    className="text-xl text-gray-300"
                    delay={0.5}
                />
            </div>

            {/* Login Card */}
            <div className="w-full max-w-md">
                <div className="glass rounded-3xl p-8 border border-white/10 bg-black/40 backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Icons.Rocket className="text-purple-400" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Get Started</h2>
                        <p className="text-gray-400">Create professional CVs and apply to jobs</p>
                    </div>

                    {/* Primary: Quick Start Button */}
                    <button
                        onClick={handleDemoMode}
                        className="w-full py-4 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-3 mb-4"
                    >
                        <Icons.Zap size={20} />
                        Start Creating CVs
                    </button>

                    <p className="text-center text-gray-500 text-xs mb-6">
                        No account needed • All features available • Data saved locally
                    </p>

                    {/* Google Login Option (if configured) */}
                    {isGoogleConfigured && (
                        <>
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-white/10" />
                                <button 
                                    onClick={() => setShowGoogleOption(!showGoogleOption)}
                                    className="text-gray-500 text-xs hover:text-gray-400"
                                >
                                    {showGoogleOption ? 'Hide' : 'Sign in with Google'}
                                </button>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>

                            {showGoogleOption && (
                                <div className="flex justify-center mb-4">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={handleGoogleError}
                                        theme="filled_black"
                                        size="large"
                                        shape="pill"
                                        text="signin_with"
                                        width="300"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Features */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-gray-400 text-sm text-center mb-4">What's included:</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Icons.Check size={14} className="text-green-400" />
                                <span>CV Builder</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Icons.Check size={14} className="text-green-400" />
                                <span>AI Enhancement</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Icons.Check size={14} className="text-green-400" />
                                <span>Job Search</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Icons.Check size={14} className="text-green-400" />
                                <span>Mass Apply</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Icons.Check size={14} className="text-green-400" />
                                <span>Email Outreach</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Icons.Check size={14} className="text-green-400" />
                                <span>PDF Export</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
