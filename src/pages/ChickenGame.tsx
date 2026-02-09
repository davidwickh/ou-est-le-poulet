import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { GameMap } from '../components/GameMap';
import { calculateCurrentRadius, formatTime } from '../utils/gameHelpers';
import './ChickenGame.css';

export const ChickenGame: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { currentGame, players, startGame, updateChickenLocation, leaveGame } = useGame();
    const { location, error: locationError } = useGeolocation(true);
    const [currentRadius, setCurrentRadius] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Update chicken location
    useEffect(() => {
        if (location && currentGame) {
            updateChickenLocation(location);
        }
    }, [location, currentGame?.id]);

    // Update current radius every second
    useEffect(() => {
        if (!currentGame) return;

        const interval = setInterval(() => {
            const radius = calculateCurrentRadius(currentGame);
            setCurrentRadius(radius);

            if (currentGame.startTime) {
                setElapsedTime(Date.now() - currentGame.startTime);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentGame]);

    const handleStartGame = async () => {
        try {
            await startGame();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to start game');
        }
    };

    const handleLeaveGame = async () => {
        await leaveGame();
        navigate('/role');
    };

    if (!currentGame || !gameId) {
        return <div className="loading">Loading game...</div>;
    }

    if (locationError) {
        return (
            <div className="error-container">
                <h2>Location Required</h2>
                <p>{locationError}</p>
                <button onClick={handleLeaveGame} className="btn btn-secondary">
                    Back
                </button>
            </div>
        );
    }

    if (!location) {
        return <div className="loading">Getting your location...</div>;
    }

    const playerCount = players.size;
    const playersFoundChicken = Array.from(players.values()).filter(p => p.foundChicken).length;

    return (
        <div className="chicken-game-container">
            <div className="game-header">
                <div className="game-info">
                    <h1>🐔 Chicken View</h1>
                    <div className="game-code">
                        Game Code: <span className="code-display">{currentGame.gameCode}</span>
                    </div>
                </div>

                <button onClick={handleLeaveGame} className="btn btn-small">
                    Leave Game
                </button>
            </div>

            <div className="game-stats">
                <div className="stat">
                    <span className="stat-label">Players:</span>
                    <span className="stat-value">{playerCount}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Found Chicken:</span>
                    <span className="stat-value">{playersFoundChicken}</span>
                </div>
                <div className="stat">
                    <span className="stat-label">Search Radius:</span>
                    <span className="stat-value">{Math.round(currentRadius)}m</span>
                </div>
                {currentGame.status === 'active' && (
                    <div className="stat">
                        <span className="stat-label">Time Elapsed:</span>
                        <span className="stat-value">{formatTime(elapsedTime)}</span>
                    </div>
                )}
            </div>

            {currentGame.status === 'waiting' && (
                <div className="waiting-area">
                    <p className="waiting-message">
                        Waiting for players to join... Share the game code with your friends!
                    </p>
                    <button
                        onClick={handleStartGame}
                        className="btn btn-primary btn-large"
                        disabled={playerCount === 0 || !location}
                    >
                        {playerCount === 0
                            ? 'Waiting for players...'
                            : 'Start Game'}
                    </button>
                </div>
            )}

            <div className="map-container">
                <GameMap
                    centerLocation={location}
                    chickenLocation={location}
                    playerLocations={players}
                    circleRadius={currentRadius}
                    showChicken={true}
                    showPlayers={true}
                    showCircle={true}
                />
            </div>

            {playerCount > 0 && (
                <div className="players-list">
                    <h3>Players ({playerCount})</h3>
                    <ul>
                        {Array.from(players.values()).map((player) => (
                            <li key={player.userId} className={player.foundChicken ? 'found' : ''}>
                                <span>{player.displayName}</span>
                                {player.foundChicken && <span className="badge">✓ Found</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
