import React, { useContext, useState } from 'react';
import { User } from 'firebase/auth';
import { AuthContext, AuthContextType, AppUser } from './AuthContext';

/**
 * Mock AuthContext for local development and testing.
 * Does not connect to Firebase Auth - uses mock user data.
 * Uses the same AuthContext so useAuth() works with MockAuthProvider.
 */

// Create a mock user object that matches Firebase User interface (partially)
const createMockUser = (displayName: string): Partial<User> & { uid: string; displayName: string } => ({
    uid: `mock-user-${Date.now()}`,
    displayName,
    email: `${displayName.toLowerCase().replace(/\s/g, '')}@mock.local`,
    emailVerified: true,
    isAnonymous: true,
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => { },
    getIdToken: async () => 'mock-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => { },
    toJSON: () => ({}),
    phoneNumber: null,
    photoURL: null,
    providerId: 'anonymous',
});

// For backward compatibility - uses the shared AuthContext
export const useMockAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useMockAuth must be used within MockAuthProvider');
    }
    return context;
};

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(false);

    const signInWithName = async (displayName: string) => {
        setLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const mockUser = createMockUser(displayName);
        setCurrentUser(mockUser);
        setLoading(false);

        console.log('[MockAuth] Signed in as:', displayName);
    };

    const signOut = async () => {
        setCurrentUser(null);
        console.log('[MockAuth] Signed out');
    };

    const value: AuthContextType = {
        currentUser,
        loading,
        signInWithName,
        signOut,
    };

    // Use the shared AuthContext so useAuth() works
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
