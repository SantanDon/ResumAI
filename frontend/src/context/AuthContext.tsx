import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
    picture: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credential: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:3001';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('resumai_token');
        if (savedToken) {
            verifyToken(savedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const verifyToken = async (savedToken: string) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${savedToken}` }
            });
            const data = await res.json();
            
            if (data.success && data.user) {
                setUser(data.user);
                setToken(savedToken);
            } else {
                localStorage.removeItem('resumai_token');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('resumai_token');
        }
        setIsLoading(false);
    };

    const login = async (credential: string): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/api/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential })
            });
            const data = await res.json();

            if (data.success && data.user && data.token) {
                setUser(data.user);
                setToken(data.token);
                localStorage.setItem('resumai_token', data.token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('resumai_token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            isLoading,
            login,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
