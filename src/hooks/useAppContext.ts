/**
 * Adapter hooks that automatically switch between mock and real contexts.
 * Use these hooks in components to support both mock and real Firebase modes.
 * 
 * In production builds (VITE_MOCK_MODE=false), mock contexts won't be used.
 * The MockApp.tsx handles mock mode routing separately via lazy loading.
 */

import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

// In mock mode, MockApp.tsx is loaded and provides mock contexts directly
// These hooks are only used by shared components - they default to real contexts
// Mock-mode pages get their context from MockApp's providers

/**
 * Returns the auth context. In mock mode, MockApp provides MockAuthContext.
 */
export const useAppAuth = () => {
    return useAuth();
};

/**
 * Returns the game context. In mock mode, MockApp provides MockGameContext.
 */
export const useAppGame = () => {
    return useGame();
};
