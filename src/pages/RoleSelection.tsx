import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './RoleSelection.css';

export const RoleSelection: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser, signOut } = useAuth();

    return (
        <div className="role-container">
            <div className="role-card">
                <h1 className="role-title">Welcome, {currentUser?.displayName}!</h1>
                <p className="role-subtitle">Choose your role</p>

                <div className="role-buttons">
                    <button
                        onClick={() => navigate('/create')}
                        className="role-btn chicken-btn"
                    >
                        <div className="role-icon">🐔</div>
                        <div className="role-label">Be the Chicken</div>
                        <div className="role-description">Hide and create a new game</div>
                    </button>

                    <button
                        onClick={() => navigate('/join')}
                        className="role-btn player-btn"
                    >
                        <div className="role-icon">👤</div>
                        <div className="role-label">Join as Player</div>
                        <div className="role-description">Find the hidden chicken</div>
                    </button>
                </div>

                <button onClick={signOut} className="btn btn-text">
                    Sign Out
                </button>
            </div>
        </div>
    );
};
