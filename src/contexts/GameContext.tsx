import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
    collection,
    doc,
    setDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    getDocs,
    deleteField,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import {
    Game,
    GameConfig,
    Player,
    Location,
    EncryptedLocation,
    GameDB,
    PlayerDB,
} from '../types';
import { generateGameCode, mergeGameConfig, generateCircleOffset } from '../utils/gameHelpers';
import { encryptLocation, decryptLocation } from '../utils/encryption';

export interface GameContextType {
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

// Export context so mock providers can use the same context
export const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within GameProvider');
    }
    return context;
};

/**
 * A provider component that manages the game state and interactions with Firestore database.
 * @param children - The child components that will have access to the game context. 
 * @returns A context provider that wraps the application and provides game-related state and functions.
 */
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [currentGame, setCurrentGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<Map<string, Player>>(new Map());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const gameCodeRef = useRef<string | null>(null);

    // Helper to decrypt chicken location from database
    const decryptChickenLocation = async (
        encryptedLocation: EncryptedLocation | null,
        gameCode: string
    ): Promise<Location | null> => {
        if (!encryptedLocation) return null;
        try {
            return await decryptLocation(encryptedLocation, gameCode);
        } catch (err) {
            console.error('Failed to decrypt chicken location:', err);
            return null;
        }
    };

    // Helper to decrypt player location from database
    const decryptPlayerLocation = async (
        encryptedLocation: EncryptedLocation | null,
        gameCode: string
    ): Promise<Location | null> => {
        if (!encryptedLocation) return null;
        try {
            return await decryptLocation(encryptedLocation, gameCode);
        } catch (err) {
            console.error('Failed to decrypt player location:', err);
            return null;
        }
    };

    // Subscribe to game updates
    useEffect(() => {
        if (!currentGame?.id || !gameCodeRef.current) return;

        const gameCode = gameCodeRef.current;
        const gameRef = doc(db, 'games', currentGame.id);
        const unsubscribeGame = onSnapshot(gameRef, async (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as GameDB;
                const chickenLocation = await decryptChickenLocation(
                    data.encryptedChickenLocation,
                    gameCode
                );
                setCurrentGame({
                    id: snapshot.id,
                    gameCode: data.gameCode,
                    chickenId: data.chickenId,
                    chickenName: data.chickenName,
                    chickenLocation,
                    circleOffset: data.circleOffset,
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
        const unsubscribePlayers = onSnapshot(playersRef, async (snapshot) => {
            const newPlayers = new Map<string, Player>();
            const decryptPromises = snapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data() as PlayerDB;
                const location = await decryptPlayerLocation(data.encryptedLocation, gameCode);
                const player: Player = {
                    userId: data.userId,
                    displayName: data.displayName,
                    location,
                    lastUpdated: data.lastUpdated,
                    foundChicken: data.foundChicken,
                    joinedAt: data.joinedAt,
                };
                return { id: docSnapshot.id, player };
            });
            const decryptedPlayers = await Promise.all(decryptPromises);
            decryptedPlayers.forEach(({ id, player }) => {
                newPlayers.set(id, player);
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

            const newGameDB: GameDB = {
                gameCode,
                chickenId: currentUser.uid,
                chickenName: currentUser.displayName || 'Anonymous Chicken',
                encryptedChickenLocation: null,
                circleOffset: generateCircleOffset(gameConfig.initialRadiusMeters),
                status: 'waiting',
                config: gameConfig,
                startTime: null,
                currentRadius: gameConfig.initialRadiusMeters,
                createdAt: Date.now(),
            };

            await setDoc(gameRef, newGameDB);

            // Store game code for encryption/decryption
            gameCodeRef.current = gameCode;

            setCurrentGame({
                id: gameRef.id,
                gameCode,
                chickenId: currentUser.uid,
                chickenName: currentUser.displayName || 'Anonymous Chicken',
                chickenLocation: null,
                circleOffset: newGameDB.circleOffset,
                status: 'waiting',
                config: gameConfig,
                startTime: null,
                currentRadius: gameConfig.initialRadiusMeters,
                createdAt: Date.now(),
            });
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
            const gameData = gameDoc.data() as GameDB;

            if (gameData.status === 'ended') {
                throw new Error('This game has ended.');
            }

            // Store game code for encryption/decryption
            gameCodeRef.current = gameCode;

            // Add player to game with encrypted location (null initially)
            const playerRef = doc(db, 'games', gameDoc.id, 'players', currentUser.uid);
            const newPlayerDB: PlayerDB = {
                userId: currentUser.uid,
                displayName: currentUser.displayName || 'Anonymous Player',
                encryptedLocation: null,
                lastUpdated: Date.now(),
                foundChicken: false,
                joinedAt: Date.now(),
            };

            await setDoc(playerRef, newPlayerDB);

            // Decrypt chicken location for local state
            const chickenLocation = await decryptChickenLocation(
                gameData.encryptedChickenLocation,
                gameCode
            );

            setCurrentGame({
                id: gameDoc.id,
                gameCode: gameData.gameCode,
                chickenId: gameData.chickenId,
                chickenName: gameData.chickenName,
                chickenLocation,
                circleOffset: gameData.circleOffset,
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

        if (!gameCodeRef.current) {
            console.error('Game code not available for encryption');
            return;
        }

        // Encrypt location before storing
        const encryptedChickenLocation = await encryptLocation(location, gameCodeRef.current);

        const gameRef = doc(db, 'games', currentGame.id);
        await updateDoc(gameRef, {
            encryptedChickenLocation,
            // Remove any old unencrypted chickenLocation field
            chickenLocation: deleteField(),
        });
    };

    const updatePlayerLocation = async (location: Location) => {
        if (!currentGame || !currentUser) return;

        if (!gameCodeRef.current) {
            console.error('Game code not available for encryption');
            return;
        }

        // Encrypt location before storing
        const encryptedLocation = await encryptLocation(location, gameCodeRef.current);

        const playerRef = doc(db, 'games', currentGame.id, 'players', currentUser.uid);
        await updateDoc(playerRef, {
            encryptedLocation,
            lastUpdated: Date.now(),
            // Remove any old unencrypted location field
            location: deleteField(),
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
        gameCodeRef.current = null;
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
