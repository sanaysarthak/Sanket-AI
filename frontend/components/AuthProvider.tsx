"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getUserFromStorage, saveUserToStorage, clearUserFromStorage, authenticate } from '@/lib/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = getUserFromStorage();
        if (storedUser) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = (username: string, password: string): { success: boolean; error?: string } => {
        const authenticatedUser = authenticate(username, password);
        if (authenticatedUser) {
            setUser(authenticatedUser);
            saveUserToStorage(authenticatedUser);
            return { success: true };
        }
        return { success: false, error: 'Invalid credentials. Please check your username and password.' };
    };

    const logout = () => {
        setUser(null);
        clearUserFromStorage();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
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
