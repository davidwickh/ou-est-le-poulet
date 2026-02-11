import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInAnonymously,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/config';

// User type with required uid and displayName for game functionality
export type AppUser = (User | (Partial<User> & { uid: string; displayName: string }));

export interface AuthContextType {
    currentUser: AppUser | null;
    loading: boolean;
    signInWithName: (displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
}

// Export context so mock providers can use the same context
export const AuthContext: React.Context<AuthContextType | undefined> = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

/**
 * A provider component that manages user authentication state and provides functions for signing up, signing in, and signing out.
 * It listens for authentication state changes and updates the current user accordingly.
 * @param children - The child components that will have access to the authentication context. 
 * @returns A context provider that wraps the application and provides authentication-related state and functions.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const signInWithName = async (displayName: string) => {
        const userCredential = await signInAnonymously(auth);
        if (userCredential.user) {
            await updateProfile(userCredential.user, { displayName });
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value: AuthContextType = {
        currentUser,
        loading,
        signInWithName,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
