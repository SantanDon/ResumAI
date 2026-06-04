import React, { useState, useEffect } from 'react';
import { puter } from '@heyputer/puter.js';

interface PuterAuthProps {
    onAuthenticated: (isAuth: boolean, username?: string) => void;
}

export const PuterAuth: React.FC<PuterAuthProps> = ({ onAuthenticated }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState<string>('');

    useEffect(() => {
        // Check if already authenticated
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const user = await puter.auth.getUser();
            if (user) {
                setIsAuthenticated(true);
                setUsername(user.username);
                onAuthenticated(true, user.username);
            }
        } catch (err) {
            setIsAuthenticated(false);
            onAuthenticated(false);
        }
    };

    const handleSignIn = async () => {
        try {
            await puter.auth.signIn();
            await checkAuth();
        } catch (err) {
            console.error('Puter sign-in failed:', err);
        }
    };

    const handleSignOut = async () => {
        try {
            await puter.auth.signOut();
            setIsAuthenticated(false);
            setUsername('');
            onAuthenticated(false);
        } catch (err) {
            console.error('Puter sign-out failed:', err);
        }
    };

    if (isAuthenticated) {
        return (
            <div className="glass-dark rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-200">Puter AI: <span className="font-semibold text-white">{username}</span></span>
                </div>
                <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-sm"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="glass-dark rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-white/70">Puter AI: Not connected</span>
            </div>
            <button
                onClick={handleSignIn}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all text-sm font-medium"
            >
                Connect Puter AI
            </button>
        </div>
    );
};
