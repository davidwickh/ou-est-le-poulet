import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import './JoinGame.css';

export const JoinGame: React.FC = () => {
    const navigate = useNavigate();
    const { joinGame, loading, error } = useGame();
    const [gameCode, setGameCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const gameId = await joinGame(gameCode.trim());
            navigate(`/game/player/${gameId}`);
        } catch (err) {
            console.error('Failed to join game:', err);
        }
    };

    return (
        <div className="join-container">
            <div className="join-card">
                <h1 className="join-title">👤 Join Game</h1>
                <p className="join-subtitle">Enter the 6-digit game code from the chicken</p>

                <form onSubmit={handleSubmit} className="join-form">
                    <div className="form-group">
                        <label htmlFor="gameCode">Game Code</label>
                        <input
                            id="gameCode"
                            type="text"
                            value={gameCode}
                            onChange={(e) => setGameCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            required
                            maxLength={6}
                            className="game-code-input"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || gameCode.length !== 6}
                    >
                        {loading ? 'Joining...' : 'Join Game'}
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
