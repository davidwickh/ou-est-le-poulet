import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppGame } from '../hooks/useAppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { GameMap } from '../components/GameMap';
import { calculateCurrentRadius, formatTime, getTimeUntilNextShrink, getCircleCenter } from '../utils/gameHelpers';
import { Venue, fetchVenuesInRadius } from '../utils/venueSearch';
import './PlayerGame.css';

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

    // Keep ref updated with latest game data
    useEffect(() => {
        gameRef.current = currentGame;
    }, [currentGame]);

    // Update player location
    useEffect(() => {
        if (location && currentGame) {
            updatePlayerLocation(location);
        }
    }, [location, currentGame?.id]);

    // Update radius and timers every second - uses ref to avoid resetting interval
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

    // Fetch venues when we have circle center
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

    return (
        <div className="player-game-container">
            <div className="game-header">
                <div className="game-info">
                    <h1>👤 Player View</h1>
                    <div className="game-code">
                        Chicken: <span className="chicken-name">{currentGame.chickenName}</span>
                    </div>
                </div>

                <button onClick={handleLeaveGame} className="btn btn-small">
                    Leave Game
                </button>
            </div>

            <div className="game-stats">
                <div className="stat">
                    <span className="stat-label">Search Radius:</span>
                    <span className="stat-value">{Math.round(currentRadius)}m</span>
                </div>
                {currentGame.status === 'active' && (
                    <>
                        <div className="stat">
                            <span className="stat-label">Time Elapsed:</span>
                            <span className="stat-value">{formatTime(elapsedTime)}</span>
                        </div>
                        <div className="stat">
                            <span className="stat-label">Next Shrink:</span>
                            <span className="stat-value">{formatTime(timeToShrink)}</span>
                        </div>
                    </>
                )}
                <div className="stat">
                    <span className="stat-label">Found:</span>
                    <span className="stat-value">{playersFoundChicken}/{playerCount}</span>
                </div>
                <div className="stat pot-stat">
                    <span className="stat-label">💰 Pot Remaining:</span>
                    <span className="stat-value">£{remainingPot.toFixed(2)}</span>
                </div>
            </div>

            {currentGame.status === 'waiting' && (
                <div className="waiting-area">
                    <p className="waiting-message">
                        Waiting for chicken to start the game...
                    </p>
                </div>
            )}

            {currentGame.status === 'active' && (
                <div className="action-area">
                    <button
                        onClick={handleFoundChicken}
                        className={`btn btn-primary btn-large ${hasMarkedFound ? 'btn-success' : ''}`}
                        disabled={hasMarkedFound}
                    >
                        {hasMarkedFound ? '✓ You Found the Chicken!' : 'I Found the Chicken!'}
                    </button>
                </div>
            )}

            <div className="map-container">
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

            <div className="game-hint">
                <p>
                    🎯 The chicken is somewhere within the red circle.
                    The circle shrinks every {currentGame.config.shrinkIntervalMilliSeconds / 60000} minutes!
                </p>
            </div>
        </div>
    );
};
