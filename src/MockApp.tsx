/**
 * MockApp - Development-only component that wraps the app with mock providers.
 * This file is only loaded when VITE_MOCK_MODE=true (via dynamic import in App.tsx).
 * It will be tree-shaken from production builds.
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MockAuthProvider, useMockAuth } from './contexts/MockAuthContext';
import { MockGameProvider } from './contexts/MockGameContext';
import { Login } from './pages/Login';
import { RoleSelection } from './pages/RoleSelection';
import { CreateGame } from './pages/CreateGame';
import { JoinGame } from './pages/JoinGame';
import { ChickenGame } from './pages/ChickenGame';
import { PlayerGame } from './pages/PlayerGame';

const MockProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useMockAuth();
    return currentUser ? <>{children}</> : <Navigate to="/" />;
};

const MockAppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route
                path="/role"
                element={
                    <MockProtectedRoute>
                        <RoleSelection />
                    </MockProtectedRoute>
                }
            />
            <Route
                path="/create"
                element={
                    <MockProtectedRoute>
                        <CreateGame />
                    </MockProtectedRoute>
                }
            />
            <Route
                path="/join"
                element={
                    <MockProtectedRoute>
                        <JoinGame />
                    </MockProtectedRoute>
                }
            />
            <Route
                path="/game/chicken/:gameId"
                element={
                    <MockProtectedRoute>
                        <ChickenGame />
                    </MockProtectedRoute>
                }
            />
            <Route
                path="/game/player/:gameId"
                element={
                    <MockProtectedRoute>
                        <PlayerGame />
                    </MockProtectedRoute>
                }
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

const MockApp: React.FC = () => {
    return (
        <BrowserRouter>
            <MockAuthProvider>
                <MockGameProvider>
                    <MockAppRoutes />
                </MockGameProvider>
            </MockAuthProvider>
        </BrowserRouter>
    );
};

export default MockApp;
