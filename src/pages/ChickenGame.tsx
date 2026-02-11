import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppGame } from '../hooks/useAppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { GameMap } from '../components/GameMap';
import { calculateCurrentRadius, formatTime, getCircleCenter, getTimeUntilNextShrink } from '../utils/gameHelpers';
import { Venue, fetchVenuesInRadius } from '../utils/venueSearch';
import './ChickenGame.css';

export const ChickenGame: React.FC = () => {
    const { gameId } = useParams<{ gameId: string }>();
    const navigate = useNavigate();
    const { currentGame, players, startGame, updateChickenLocation, leaveGame, addPurchase } = useAppGame();
    const { location, error: locationError } = useGeolocation(true);
    const [currentRadius, setCurrentRadius] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [timeToShrink, setTimeToShrink] = useState(0);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [purchaseAmount, setPurchaseAmount] = useState('');
    const [purchaseDescription, setPurchaseDescription] = useState('');
    const [showPurchasePanel, setShowPurchasePanel] = useState(false);
    const [showPlayersPanel, setShowPlayersPanel] = useState(false);
    const gameRef = useRef(currentGame);

    // Keep ref updated with latest game data
    useEffect(() => {
        gameRef.current = currentGame;
    }, [currentGame]);

    useEffect(() => {
        if (location && currentGame) {
            updateChickenLocation(location);
        }
    }, [location, currentGame?.id]);

    // Timer effect - uses ref to avoid resetting interval
    useEffect(() => {
        if (!currentGame?.id) return;

        const interval = setInterval(() => {
            const game = gameRef.current;
            if (!game) return;

            const radius = calculateCurrentRadius(game);
            setCurrentRadius(radius);

            if (game.startTime) {
                setElapsedTime(Date.now() - game.startTime);
                setTimeToShrink(getTimeUntilNextShrink(game));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentGame?.id]);

    useEffect(() => {
        if (!location || !currentGame?.circleOffset) return;

        const circleCenter = getCircleCenter(location, currentGame.circleOffset);
        const radius = currentGame.config.initialRadiusMeters;

        fetchVenuesInRadius(circleCenter, radius).then(setVenues);
    }, [location?.lat, location?.lng, currentGame?.circleOffset, currentGame?.config.initialRadiusMeters]);

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

    const handleAddPurchase = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(purchaseAmount);
        if (isNaN(amount) || amount <= 0) return;

        try {
            await addPurchase(amount, purchaseDescription || 'Drink');
            setPurchaseAmount('');
            setPurchaseDescription('');
            setShowPurchasePanel(false);
        } catch (err) {
            alert('Failed to add purchase');
        }
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
                    chickenLocation={location}
                    circleCenter={
                        currentGame.circleOffset
                            ? getCircleCenter(location, currentGame.circleOffset)
                            : location
                    }
                    playerLocations={players}
                    venues={venues}
                    circleRadius={currentRadius}
                    showChicken={true}
                    showPlayers={true}
                    showCircle={true}
                    showVenues={true}
                />
            </div>

            <div className="top-bar">
                <div className="top-bar-left">
                    <span className="game-title">🐔 Chicken</span>
                    <span className="game-code-badge">{currentGame.gameCode}</span>
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

                    <div className="info-card pot-card" onClick={() => currentGame.status === 'active' && setShowPurchasePanel(!showPurchasePanel)}>
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
                        {currentGame.status === 'active' && (
                            <span className="pot-tap-hint">Tap to log purchase</span>
                        )}
                    </div>

                    {playerCount > 0 && (
                        <div className="players-card-wrapper">
                            <div
                                className={`info-card players-card ${showPlayersPanel ? 'expanded' : ''}`}
                                onClick={() => setShowPlayersPanel(!showPlayersPanel)}
                            >
                                <div className="players-header">
                                    <span>Players ({playerCount})</span>
                                    <span className="expand-icon">{showPlayersPanel ? '▼' : '▶'}</span>
                                </div>
                            </div>
                            {showPlayersPanel && (
                                <ul className="players-dropdown">
                                    {Array.from(players.values()).map((player) => (
                                        <li key={player.userId} className={player.foundChicken ? 'found' : ''}>
                                            <span>{player.displayName}</span>
                                            {player.foundChicken && <span className="found-badge">✓</span>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {currentGame.status === 'waiting' && (
                <div className="waiting-overlay">
                    <div className="waiting-card">
                        <h2>Waiting for Players</h2>
                        <p>Share code: <strong>{currentGame.gameCode}</strong></p>
                        <div className="player-count-big">{playerCount} joined</div>
                        <button
                            onClick={handleStartGame}
                            className="btn btn-primary btn-large"
                            disabled={playerCount === 0 || !location}
                        >
                            {playerCount === 0 ? 'Waiting for players...' : '🎮 Start Game'}
                        </button>
                    </div>
                </div>
            )}

            {showPurchasePanel && currentGame.status === 'active' && (
                <div className="panel-overlay" onClick={() => setShowPurchasePanel(false)}>
                    <div className="purchase-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="panel-header">
                            <h3>🍺 Log Purchase</h3>
                            <button className="btn-icon" onClick={() => setShowPurchasePanel(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddPurchase} className="purchase-form-modern">
                            <div className="input-group">
                                <label>Amount</label>
                                <div className="input-with-prefix">
                                    <span className="prefix">£</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={purchaseAmount}
                                        onChange={(e) => setPurchaseAmount(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Pint of vodmon"
                                    value={purchaseDescription}
                                    onChange={(e) => setPurchaseDescription(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full">
                                Add Purchase
                            </button>
                        </form>
                        {currentGame.purchases.length > 0 && (
                            <div className="recent-purchases">
                                <h4>Recent</h4>
                                <ul>
                                    {currentGame.purchases.slice(-3).reverse().map((purchase) => (
                                        <li key={purchase.id}>
                                            <span>£{purchase.amount.toFixed(2)}</span>
                                            <span className="desc">{purchase.description}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
