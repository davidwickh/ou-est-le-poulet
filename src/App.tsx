import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { Login } from './pages/Login';
import { RoleSelection } from './pages/RoleSelection';
import { CreateGame } from './pages/CreateGame';
import { JoinGame } from './pages/JoinGame';
import { ChickenGame } from './pages/ChickenGame';
import { PlayerGame } from './pages/PlayerGame';
import './App.css';

// Only load mock providers in development when mock mode is enabled
// This allows Vite to tree-shake mock code from production builds
const MockApp = import.meta.env.VITE_MOCK_MODE === 'true'
    ? lazy(() => import('./MockApp'))
    : null;

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    return currentUser ? <>{children}</> : <Navigate to="/" />;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route
                path="/role"
                element={
                    <ProtectedRoute>
                        <RoleSelection />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/create"
                element={
                    <ProtectedRoute>
                        <CreateGame />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/join"
                element={
                    <ProtectedRoute>
                        <JoinGame />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/game/chicken/:gameId"
                element={
                    <ProtectedRoute>
                        <ChickenGame />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/game/player/:gameId"
                element={
                    <ProtectedRoute>
                        <PlayerGame />
                    </ProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

// Export AppRoutes for use by MockApp
export { AppRoutes };

const App: React.FC = () => {
    // Use mock app in mock mode (only loads in development)
    if (MockApp) {
        return (
            <Suspense fallback={<div>Loading...</div>}>
                <MockApp />
            </Suspense>
        );
    }

    // Production: use real Firebase providers
    return (
        <BrowserRouter>
            <AuthProvider>
                <GameProvider>
                    <AppRoutes />
                </GameProvider>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
