export interface Position {
  row: number;
  col: number;
}

export interface Wall {
  row: number;
  col: number;
  orientation: "horizontal" | "vertical";
  owner?: 0 | 1;
}

export interface PlayerState {
  position: Position;
  wallsRemaining: number;
  name: string;
  color: string;
  goalRow: number;
}

export interface GameState {
  players: [PlayerState, PlayerState];
  currentPlayer: 0 | 1;
  walls: Wall[];
  moveCount: [number, number];
  wallsPlaced: [number, number];
  gameOver: boolean;
  winner: number | null;
  startTime: number;
}

export type GameMode = "ai" | "local";
export type AIDifficulty = "easy" | "medium" | "hard";
export type ActionMode = "move" | "wall";

export interface MoveAction {
  type: "move";
  player: number;
  from: Position;
  to: Position;
}

export interface WallAction {
  type: "wall";
  player: number;
  wall: Wall;
}

export type GameAction = MoveAction | WallAction;

export interface GameStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  bestStreak: number;
  totalWallsPlaced: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  isPremium: boolean;
}
