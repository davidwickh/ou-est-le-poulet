/**
 * Mock mode configuration.
 * When VITE_MOCK_MODE is 'true', the app uses mock providers instead of Firebase.
 * This is useful for local development and testing without Firebase connection.
 */

export const isMockMode = (): boolean => {
    return import.meta.env.VITE_MOCK_MODE === 'true';
};

// Log mock mode status on load
if (isMockMode()) {
    console.log('🔧 Running in MOCK MODE - Firebase is disabled');
    console.log('   To disable mock mode, set VITE_MOCK_MODE=false in .env.development');
} else {
    console.log('🔥 Running with Firebase');
}
