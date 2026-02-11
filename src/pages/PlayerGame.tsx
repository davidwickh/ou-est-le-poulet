import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppGame } from '../hooks/useAppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { GameMap } from '../components/GameMap';
import { calculateCurrentRadius, formatTime, getTimeUntilNextShrink, getCircleCenter } from '../utils/gameHelpers';
import { Venue, fetchVenuesInRadius } from '../utils/venueSearch';
import './ChickenGame.css';

export const PlayerGame: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const {
        currentGame,
        players,
        updatePlayerLocation,
        markPlayerFoundChicken,
        leaveGame,
    } = useAppGame();
    const { location, error: locationError } = useGeolocation(true);
    const [currentRadius, setCurrentRadius] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timeToShrink, setTimeToShrink] = useState(0);
    const [hasMarkedFound, setHasMarkedFound] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);
    const gameRef = useRef(currentGame);

    useEffect(() => {
        gameRef.current = currentGame;
    }, [currentGame]);

    useEffect(() => {
        if (location && currentGame) {
            updatePlayerLocation(location);
        }
    }, [location, currentGame?.id]);

    useEffect(() => {
        if (!currentGame?.id) return;

        const interval = setInterval(() => {
            const game = gameRef.current;
            if (!game) return;

            const radius = calculateCurrentRadius(game);
            setCurrentRadius(radius);

            if (game.startTime && game.status === 'active') {
                setElapsedTime(Date.now() - game.startTime);
                setTimeToShrink(getTimeUntilNextShrink(game));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentGame?.id]);

    useEffect(() => {
        if (!currentGame?.chickenLocation || !currentGame?.circleOffset) return;

        const circleCenter = getCircleCenter(currentGame.chickenLocation, currentGame.circleOffset);
        const radius = currentGame.config.initialRadiusMeters;

        fetchVenuesInRadius(circleCenter, radius).then(setVenues);
    }, [currentGame?.chickenLocation?.lat, currentGame?.chickenLocation?.lng, currentGame?.circleOffset, currentGame?.config.initialRadiusMeters]);

    const handleFoundChicken = async () => {
        if (hasMarkedFound) return;

        try {
            await markPlayerFoundChicken();
            setHasMarkedFound(true);
        } catch (err) {
            alert('Failed to mark as found');
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
    const totalSpent = currentGame.purchases.reduce((sum, p) => sum + p.amount, 0);
    const remainingPot = currentGame.potAmount - totalSpent;
    const potPercentage = currentGame.potAmount > 0 ? (remainingPot / currentGame.potAmount) * 100 : 0;

    return (
        <div className="game-fullscreen">
            <div className="map-fullscreen">
                <GameMap
                    centerLocation={location}
                    circleCenter={
                        currentGame.chickenLocation
                            ? getCircleCenter(currentGame.chickenLocation, currentGame.circleOffset)
                            : null
                    }
                    venues={venues}
                    circleRadius={currentRadius}
                    showChicken={false}
                    showPlayers={false}
                    showCircle={true}
                    showVenues={true}
                />
            </div>

            <div className="top-bar">
                <div className="top-bar-left">
                    <span className="game-title">👤 Player</span>
                    <span className="game-code-badge">{currentGame.chickenName}</span>
                </div>
                <button onClick={handleLeaveGame} className="btn-icon" title="Leave Game">
                    ✕
                </button>
            </div>

            <div className="floating-cards">
                <div className="cards-row">
                    <div className="info-card status-card">
                        <div className="card-row">
                            <div className="stat-mini">
                                <span className="stat-icon">👥</span>
                                <div className="stat-content">
                                    <span className="stat-num">{playerCount}</span>
                                    <span className="stat-text">Players</span>
                                </div>
                            </div>
                            <div className="stat-mini">
                                <span className="stat-icon">✓</span>
                                <div className="stat-content">
                                    <span className="stat-num">{playersFoundChicken}</span>
                                    <span className="stat-text">Found</span>
                                </div>
                            </div>
                            <div className="stat-mini">
                                <span className="stat-icon">📍</span>
                                <div className="stat-content">
                                    <span className="stat-num">{Math.round(currentRadius)}m</span>
                                    <span className="stat-text">Radius</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {currentGame.status === 'active' && (
                        <div className="info-card timer-card">
                            <div className="timer-display">
                                <div className="timer-main">
                                    <span className="timer-label">Elapsed</span>
                                    <span className="timer-value">{formatTime(elapsedTime)}</span>
                                </div>
                                <div className="timer-divider"></div>
                                <div className="timer-shrink">
                                    <span className="timer-label">Next Shrink</span>
                                    <span className="timer-value shrink">{formatTime(timeToShrink)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="info-card pot-card">
                        <div className="pot-header">
                            <span className="pot-icon">💰</span>
                            <span className="pot-amount">£{remainingPot.toFixed(2)}</span>
                            <span className="pot-total">/ £{currentGame.potAmount.toFixed(2)}</span>
                        </div>
                        <div className="pot-slider-container">
                            <div
                                className="pot-slider-fill"
                                style={{
                                    width: `${potPercentage}%`,
                                    backgroundColor: potPercentage > 50 ? '#2ecc71' : potPercentage > 25 ? '#f39c12' : '#e74c3c'
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {currentGame.status === 'waiting' && (
                <div className="waiting-overlay">
                    <div className="waiting-card">
                        <h2>Waiting for Chicken</h2>
                        <p>Following: <strong>{currentGame.chickenName}</strong></p>
                        <div className="player-count-big">{playerCount} players</div>
                        <p className="waiting-hint">The chicken will start the game soon...</p>
                    </div>
                </div>
            )}

            {currentGame.status === 'active' && (
                <div className="found-button-container">
                    <button
                        onClick={handleFoundChicken}
                        className={`btn btn-found ${hasMarkedFound ? 'btn-found-success' : ''}`}
                        disabled={hasMarkedFound}
                    >
                        {hasMarkedFound ? '✓ You Found the Chicken!' : '🐔 I Found the Chicken!'}
                    </button>
                </div>
            )}
        </div>
    );
};
