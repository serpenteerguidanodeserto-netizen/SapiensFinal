import { PlayerColor } from "./core-engine";

export interface MoveRecord {
  player: PlayerColor;
  from: string;
  to: string;
  action: "move" | "rotate" | "capture" | "sacrifice" | "alliance";
  value: number;
}

export type GameStatus = "waiting" | "playing" | "finished";

export interface MultiplayerGameState {
  id: string;

  players: {
    white: string | null;
    black: string | null;
  };

  usernames: {
    white: string;
    black: string;
  };

  board: any; // flattened engine board

  turn: PlayerColor;

  status: GameStatus;

  clocks: {
    white: number;
    black: number;
  };

  history: string[];

  winner: string | null;

  createdAt: number;

  // ============================================
  // SACRIFICE WINDOW
  // ============================================

  sacrificeWindow?: {
    pieceId: string;
    expiresAt: number;
  } | null;
}
