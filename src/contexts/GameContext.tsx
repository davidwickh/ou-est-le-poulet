import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import {
    Game,
    GameConfig,
    Player,
    Location,
} from '../types';
import { generateGameCode, mergeGameConfig } from '../utils/gameHelpers';

interface GameContextType {
    currentGame: Game | null;
    players: Map<string, Player>;
    loading: boolean;
    error: string | null;
    createGame: (config: Partial<GameConfig>) => Promise<string>;
    joinGame: (gameCode: string) => Promise<string>;
    startGame: () => Promise<void>;
    updateChickenLocation: (location: Location) => Promise<void>;
    updatePlayerLocation: (location: Location) => Promise<void>;
    markPlayerFoundChicken: () => Promise<void>;
    leaveGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within GameProvider');
    }
    return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [currentGame, setCurrentGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<Map<string, Player>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to game updates
    useEffect(() => {
        if (!currentGame?.id) return;

        const gameRef = doc(db, 'games', currentGame.id);
        const unsubscribeGame = onSnapshot(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setCurrentGame({
                    id: snapshot.id,
                    gameCode: data.gameCode,
                    chickenId: data.chickenId,
                    chickenName: data.chickenName,
                    chickenLocation: data.chickenLocation,
                    status: data.status,
                    config: data.config,
                    startTime: data.startTime,
                    currentRadius: data.currentRadius,
                    createdAt: data.createdAt,
                });
            }
        });

        // Subscribe to players
        const playersRef = collection(db, 'games', currentGame.id, 'players');
        const unsubscribePlayers = onSnapshot(playersRef, (snapshot) => {
            const newPlayers = new Map<string, Player>();
            snapshot.forEach((doc) => {
                newPlayers.set(doc.id, doc.data() as Player);
            });
            setPlayers(newPlayers);
        });

        return () => {
            unsubscribeGame();
            unsubscribePlayers();
        };
    }, [currentGame?.id]);

    const createGame = async (config: Partial<GameConfig>): Promise<string> => {
        if (!currentUser) throw new Error('Must be logged in to create a game');

        setLoading(true);
        setError(null);

        try {
            const gameCode = generateGameCode();
            const gameConfig = mergeGameConfig(config);
            const gameRef = doc(collection(db, 'games'));

            const newGame: Omit<Game, 'id'> = {
                gameCode,
                chickenId: currentUser.uid,
                chickenName: currentUser.displayName || 'Anonymous Chicken',
                chickenLocation: null,
                status: 'waiting',
                config: gameConfig,
                startTime: null,
                currentRadius: gameConfig.initialRadius,
                createdAt: Date.now(),
            };

            await setDoc(gameRef, newGame);

            setCurrentGame({ id: gameRef.id, ...newGame });
            setLoading(false);
            return gameRef.id;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create game';
            setError(message);
            setLoading(false);
            throw err;
        }
    };

    const joinGame = async (gameCode: string): Promise<string> => {
        if (!currentUser) throw new Error('Must be logged in to join a game');

        setLoading(true);
        setError(null);

        try {
            // Find game by code
            const gamesRef = collection(db, 'games');
            const q = query(gamesRef, where('gameCode', '==', gameCode));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error('Game not found. Please check the code and try again.');
            }

            const gameDoc = snapshot.docs[0];
            const gameData = gameDoc.data();

            if (gameData.status === 'ended') {
                throw new Error('This game has ended.');
            }

            // Add player to game
            const playerRef = doc(db, 'games', gameDoc.id, 'players', currentUser.uid);
            const newPlayer: Player = {
                userId: currentUser.uid,
                displayName: currentUser.displayName || 'Anonymous Player',
                location: null,
                lastUpdated: Date.now(),
                foundChicken: false,
                joinedAt: Date.now(),
            };

            await setDoc(playerRef, newPlayer);

            setCurrentGame({
                id: gameDoc.id,
                gameCode: gameData.gameCode,
                chickenId: gameData.chickenId,
                chickenName: gameData.chickenName,
                chickenLocation: gameData.chickenLocation,
                status: gameData.status,
                config: gameData.config,
                startTime: gameData.startTime,
                currentRadius: gameData.currentRadius,
                createdAt: gameData.createdAt,
            });

            setLoading(false);
            return gameDoc.id;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to join game';
            setError(message);
            setLoading(false);
            throw err;
        }
    };

    const startGame = async () => {
        if (!currentGame || !currentUser || currentGame.chickenId !== currentUser.uid) {
            throw new Error('Only the chicken can start the game');
        }

        if (!currentGame.chickenLocation) {
            throw new Error('Chicken location must be set before starting');
        }

        const gameRef = doc(db, 'games', currentGame.id);
        await updateDoc(gameRef, {
            status: 'active',
            startTime: Date.now(),
        });
    };

    const updateChickenLocation = async (location: Location) => {
        if (!currentGame || !currentUser || currentGame.chickenId !== currentUser.uid) {
            return;
        }

        const gameRef = doc(db, 'games', currentGame.id);
        await updateDoc(gameRef, {
            chickenLocation: location,
        });
    };

    const updatePlayerLocation = async (location: Location) => {
        if (!currentGame || !currentUser) return;

        const playerRef = doc(db, 'games', currentGame.id, 'players', currentUser.uid);
        await updateDoc(playerRef, {
            location,
            lastUpdated: Date.now(),
        });
    };

    const markPlayerFoundChicken = async () => {
        if (!currentGame || !currentUser) return;

        const playerRef = doc(db, 'games', currentGame.id, 'players', currentUser.uid);
        await updateDoc(playerRef, {
            foundChicken: true,
        });
    };

    const leaveGame = async () => {
        setCurrentGame(null);
        setPlayers(new Map());
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
        leaveGame,
    };

    return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
