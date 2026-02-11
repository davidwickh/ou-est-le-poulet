export type UserRole = 'chicken' | 'player';

export type GameStatus = 'waiting' | 'active' | 'ended';

export interface Location {
  lat: number;
  lng: number;
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

export interface Game {
  id: string;
  gameCode: string;
  chickenId: string;
  chickenName: string;
  chickenLocation: Location | null;
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
