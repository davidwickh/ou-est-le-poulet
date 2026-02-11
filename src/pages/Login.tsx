import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '../hooks/useAppContext';
import './Login.css';

export const Login: React.FC = () => {
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signInWithName } = useAppAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!displayName.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);

        try {
            await signInWithName(displayName.trim());
            navigate('/role');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1 className="login-title">🐔 Où est le Poulet?</h1>
                <p className="login-subtitle">Location-based hide and seek game</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="displayName">What's your name?</label>
                        <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter your name to play"
                            autoFocus
                            maxLength={20}
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Joining...' : "Let's Play!"}
                    </button>
                </form>
            </div>
        </div>
    );
};
