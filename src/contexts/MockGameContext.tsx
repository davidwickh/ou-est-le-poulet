import React, { useContext, useState, useEffect } from 'react';
import { Game, GameConfig, Player, Location } from '../types';
import { generateGameCode, mergeGameConfig, calculateCurrentRadius, generateCircleOffset } from '../utils/gameHelpers';
import { GameContext, GameContextType } from './GameContext';

/**
 * Mock GameContext for local development and testing.
 * Does not connect to Firebase - uses in-memory data only.
 * Uses the same GameContext so useGame() works with MockGameProvider.
 */

// For backward compatibility - uses the shared GameContext
export const useMockGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useMockGame must be used within MockGameProvider');
    }
    return context;
};

// Default mock location (London)
const DEFAULT_LOCATION: Location = {
    lat: 51.5074,
    lng: -0.1278,
};

// Generate mock players
const generateMockPlayers = (count: number, chickenLocation: Location): Map<string, Player> => {
    const players = new Map<string, Player>();
    for (let i = 1; i <= count; i++) {
        // Scatter players around the chicken location
        const offsetLat = (Math.random() - 0.5) * 0.01;
        const offsetLng = (Math.random() - 0.5) * 0.01;
        players.set(`mock-player-${i}`, {
            userId: `mock-player-${i}`,
            displayName: `Player ${i}`,
            location: {
                lat: chickenLocation.lat + offsetLat,
                lng: chickenLocation.lng + offsetLng,
            },
            lastUpdated: Date.now(),
            foundChicken: i === 1, // First player has found the chicken
            joinedAt: Date.now() - i * 60000,
        });
    }
    return players;
};

export const MockGameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentGame, setCurrentGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<Map<string, Player>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, _setError] = useState<string | null>(null);

    // Simulate radius shrinking over time
    useEffect(() => {
        if (!currentGame || currentGame.status !== 'active') return;

        const interval = setInterval(() => {
            const newRadius = calculateCurrentRadius(currentGame);
            setCurrentGame(prev => prev ? { ...prev, currentRadius: newRadius } : null);
        }, 1000);

        return () => clearInterval(interval);
    }, [currentGame?.status, currentGame?.startTime]);

    const createGame = async (config: Partial<GameConfig>, potAmount: number = 0): Promise<string> => {
        setLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const gameCode = generateGameCode();
        const gameConfig = mergeGameConfig(config);
        const gameId = `mock-game-${Date.now()}`;

        const newGame: Game = {
            id: gameId,
            gameCode,
            chickenId: 'mock-chicken-user',
            chickenName: 'Mock Chicken',
            chickenLocation: DEFAULT_LOCATION,
            circleOffset: generateCircleOffset(gameConfig.initialRadiusMeters),
            status: 'waiting',
            config: gameConfig,
            startTime: null,
            currentRadius: gameConfig.initialRadiusMeters,
            createdAt: Date.now(),
            potAmount,
            purchases: [],
        };

        setCurrentGame(newGame);
        // Add some mock players
        setPlayers(generateMockPlayers(3, DEFAULT_LOCATION));
        setLoading(false);

        console.log('[MockGame] Created game:', gameCode);
        return gameId;
    };

    const joinGame = async (gameCode: string): Promise<string> => {
        setLoading(true);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Always succeed with a mock game
        const gameId = `mock-game-${Date.now()}`;
        const gameConfig = mergeGameConfig({});

        const mockGame: Game = {
            id: gameId,
            gameCode: gameCode.toUpperCase(),
            chickenId: 'mock-chicken-user',
            chickenName: 'Mock Chicken',
            chickenLocation: DEFAULT_LOCATION,
            circleOffset: generateCircleOffset(gameConfig.initialRadiusMeters),
            status: 'waiting',
            config: gameConfig,
            startTime: null,
            currentRadius: gameConfig.initialRadiusMeters,
            createdAt: Date.now(),
            potAmount: 50, // Default mock pot amount
            purchases: [],
        };

        setCurrentGame(mockGame);
        setPlayers(generateMockPlayers(2, DEFAULT_LOCATION));
        setLoading(false);

        console.log('[MockGame] Joined game:', gameCode);
        return gameId;
    };

    const startGame = async () => {
        if (!currentGame) throw new Error('No game to start');

        await new Promise(resolve => setTimeout(resolve, 300));

        setCurrentGame({
            ...currentGame,
            status: 'active',
            startTime: Date.now(),
        });

        console.log('[MockGame] Game started');
    };

    const updateChickenLocation = async (location: Location) => {
        if (!currentGame) return;

        setCurrentGame({
            ...currentGame,
            chickenLocation: location,
        });

        console.log('[MockGame] Chicken location updated:', location);
    };

    const updatePlayerLocation = async (location: Location) => {
        // In mock mode, update a mock player's location
        console.log('[MockGame] Player location updated:', location);
    };

    const markPlayerFoundChicken = async () => {
        console.log('[MockGame] Player marked as found chicken');
    };

    const leaveGame = async () => {
        setCurrentGame(null);
        setPlayers(new Map());
        console.log('[MockGame] Left game');
    };

    const addPurchase = async (amount: number, description: string) => {
        if (!currentGame) throw new Error('No game active');

        const newPurchase = {
            id: `purchase-${Date.now()}`,
            amount,
            description,
            timestamp: Date.now(),
        };

        setCurrentGame({
            ...currentGame,
            purchases: [...currentGame.purchases, newPurchase],
        });

        console.log('[MockGame] Added purchase:', amount, description);
    };

    const value: GameContextType = {
        currentGame,
        players,
        loading,
        error,
        createGame,
        joinGame,
        startGame,
        updateChickenLocation,
        updatePlayerLocation,
        markPlayerFoundChicken,
        addPurchase,
        leaveGame,
    };

    // Use the shared GameContext so useGame() works
    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
