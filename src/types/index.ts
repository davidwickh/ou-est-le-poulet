export type UserRole = 'chicken' | 'player';

export type GameStatus = 'waiting' | 'active' | 'ended';

export interface Location {
  lat: number;
  lng: number;
}

export interface EncryptedLocation {
  encrypted: string;
  iv: string;
  salt: string;
}

export interface User {
  id: string;
  displayName: string;
  email?: string;
}

export interface GameConfig {
  initialRadiusMeters: number;
  shrinkIntervalMilliSeconds: number;
  shrinkMeters: number;
}

export interface Player {
  userId: string;
  displayName: string;
  location: Location | null;
  lastUpdated: number;
  foundChicken: boolean;
  joinedAt: number;
}

// Database version of Player with encrypted location
export interface PlayerDB {
  userId: string;
  displayName: string;
  encryptedLocation: EncryptedLocation | null;
  lastUpdated: number;
  foundChicken: boolean;
  joinedAt: number;
}

export interface Game {
  id: string;
  gameCode: string;
  chickenId: string;
  chickenName: string;
  chickenLocation: Location | null;
  circleOffset: Location; // Offset from chicken location to circle center
  status: GameStatus;
  config: GameConfig;
  startTime: number | null;
  currentRadius: number;
  createdAt: number;
}

// Database version of Game with encrypted chicken location
export interface GameDB {
  gameCode: string;
  chickenId: string;
  chickenName: string;
  encryptedChickenLocation: EncryptedLocation | null;
  circleOffset: Location; // Offset from chicken location to circle center
  status: GameStatus;
  config: GameConfig;
  startTime: number | null;
  currentRadius: number;
  createdAt: number;
}

export interface GameWithPlayers extends Game {
  players: Map<string, Player>;
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  initialRadiusMeters: 500, // 500 meters
  shrinkIntervalMilliSeconds: 5 * 60 * 1000, // 5 minutes
  shrinkMeters: 50, // 50 meters
};
