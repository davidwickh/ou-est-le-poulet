import { Game, GameConfig, Location, DEFAULT_GAME_CONFIG } from '../types';

/**
 * Generate a random 6-digit game code
 */
export const generateGameCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate the current radius based on game configuration and elapsed time
 */
export const calculateCurrentRadius = (
  game: Game
): number => {
  if (!game.startTime || game.status !== 'active') {
    return game.config.initialRadiusMeters;
  }

  const elapsed = Date.now() - game.startTime;
  const intervals = Math.floor(elapsed / game.config.shrinkIntervalMilliSeconds);
  const shrinkAmount = intervals * game.config.shrinkMeters;
  const currentRadius = Math.max(0, game.config.initialRadiusMeters - shrinkAmount);

  return currentRadius;
};

/**
 * Calculate distance between two locations in meters using Haversine formula
 */
export const calculateDistance = (
  loc1: Location,
  loc2: Location
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (loc1.lat * Math.PI) / 180;
  const φ2 = (loc2.lat * Math.PI) / 180;
  const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Format time in MM:SS format
 */
export const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get time until next shrink
 */
export const getTimeUntilNextShrink = (game: Game): number => {
  if (!game.startTime || game.status !== 'active') {
    return 0;
  }

  const elapsed = Date.now() - game.startTime;
  const timeSinceLastShrink = elapsed % game.config.shrinkIntervalMilliSeconds;
  return game.config.shrinkIntervalMilliSeconds - timeSinceLastShrink;
};

/**
 * Validate game configuration
 */
export const validateGameConfig = (config: Partial<GameConfig>): boolean => {
  if (config.initialRadiusMeters && (config.initialRadiusMeters < 50 || config.initialRadiusMeters > 5000)) {
    return false;
  }
  if (config.shrinkIntervalMilliSeconds && (config.shrinkIntervalMilliSeconds < 30000 || config.shrinkIntervalMilliSeconds > 3600000)) {
    return false;
  }
  if (config.shrinkMeters && (config.shrinkMeters < 10 || config.shrinkMeters > 500)) {
    return false;
  }
  return true;
};

/**
 * Merge user config with defaults
 */
export const mergeGameConfig = (userConfig: Partial<GameConfig>): GameConfig => {
  return {
    ...DEFAULT_GAME_CONFIG,
    ...userConfig,
  };
};

/**
 * Generate a random circle offset so the chicken is inside the circle but not at the center.
 * Each axis (lat/lng) is independently randomized between -radius and +radius.
 * Returns the offset in lat/lng degrees.
 */
export const generateCircleOffset = (radiusMeters: number): Location => {
  // Convert meters to approximate degrees
  // 1 degree latitude ~ 111,320 meters
  // 1 degree longitude varies by latitude, but we use a rough approximation
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos(51.5 * Math.PI / 180); // Use London latitude as approximation
  
  // Random offset for each axis independently: between -radius and +radius
  const latOffsetMeters = (Math.random() * 2 - 1) * radiusMeters; // -radius to +radius
  const lngOffsetMeters = (Math.random() * 2 - 1) * radiusMeters; // -radius to +radius
  
  return {
    lat: latOffsetMeters / metersPerDegreeLat,
    lng: lngOffsetMeters / metersPerDegreeLng,
  };
};

/**
 * Get the circle center location (chicken location + offset)
 */
export const getCircleCenter = (chickenLocation: Location, circleOffset: Location): Location => {
  return {
    lat: chickenLocation.lat + circleOffset.lat,
    lng: chickenLocation.lng + circleOffset.lng,
  };
};
