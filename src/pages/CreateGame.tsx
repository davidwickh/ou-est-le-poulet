import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { GameConfig, DEFAULT_GAME_CONFIG } from '../types';
import './CreateGame.css';

export const CreateGame: React.FC = () => {
    const navigate = useNavigate();
    const { createGame, loading, error } = useGame();

    const [config, setConfig] = useState<Partial<GameConfig>>({
        initialRadiusMeters: DEFAULT_GAME_CONFIG.initialRadiusMeters,
        shrinkIntervalMilliSeconds: DEFAULT_GAME_CONFIG.shrinkIntervalMilliSeconds / 60000, // Convert to minutes for UI
        shrinkMeters: DEFAULT_GAME_CONFIG.shrinkMeters,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Convert minutes back to milliseconds
            const gameConfig: Partial<GameConfig> = {
                ...config,
                shrinkIntervalMilliSeconds: (config.shrinkIntervalMilliSeconds || 5) * 60000,
            };

            const gameId = await createGame(gameConfig);
            navigate(`/game/chicken/${gameId}`);
        } catch (err) {
            console.error('Failed to create game:', err);
        }
    };

    return (
        <div className="create-container">
            <div className="create-card">
                <h1 className="create-title">🐔 Create Game</h1>
                <p className="create-subtitle">Set up your game parameters</p>

                <form onSubmit={handleSubmit} className="create-form">
                    <div className="form-group">
                        <label htmlFor="initialRadius">
                            Initial Search Radius (meters)
                            <span className="label-hint">Area where chicken is hidden</span>
                        </label>
                        <input
                            id="initialRadius"
                            type="number"
                            min="50"
                            max="5000"
                            step="50"
                            value={config.initialRadiusMeters}
                            onChange={(e) =>
                                setConfig({ ...config, initialRadiusMeters: Number(e.target.value) })
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="shrinkInterval">
                            Shrink Interval (minutes)
                            <span className="label-hint">How often the circle shrinks</span>
                        </label>
                        <input
                            id="shrinkInterval"
                            type="number"
                            min="1"
                            max="60"
                            step="1"
                            value={config.shrinkIntervalMilliSeconds}
                            onChange={(e) =>
                                setConfig({ ...config, shrinkIntervalMilliSeconds: Number(e.target.value) })
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="shrinkMeters">
                            Shrink Amount (meters)
                            <span className="label-hint">How much the circle shrinks each time</span>
                        </label>
                        <input
                            id="shrinkMeters"
                            type="number"
                            min="10"
                            max="500"
                            step="10"
                            value={config.shrinkMeters}
                            onChange={(e) =>
                                setConfig({ ...config, shrinkMeters: Number(e.target.value) })
                            }
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Game'}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate('/role')}
                        className="btn btn-secondary"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};
