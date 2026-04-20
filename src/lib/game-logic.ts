
export type PlayerColor = 'white' | 'black';

export type GameStatus = 'waiting' | 'playing' | 'finished';

export type PieceValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface GamePiece {
  id: string;
  color: PlayerColor;
  value: PieceValue;
  position: { r: number; c: number };
}

export interface GameState {
  id: string;
  players: {
    white: string | null;
    black: string | null;
  };
  usernames: {
    white: string;
    black: string;
  };
  board: (GamePiece | null)[][];
  turn: PlayerColor;
  status: GameStatus;
  clocks: {
    white: number; // seconds
    black: number; // seconds
  };
  history: string[];
  winner: string | null;
  createdAt: number;
}

export const BOARD_SIZE = 8;
export const INITIAL_TIME = 600; // 10 minutes in seconds

export function createInitialBoard(): (GamePiece | null)[][] {
  const board: (GamePiece | null)[][] = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  // Example initial setup (this is a custom strategy board game)
  // White pieces at bottom
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (c % 2 === 0) {
      board[7][c] = {
        id: `w-${7}-${c}`,
        color: 'white',
        value: (c % 6 + 1) as PieceValue,
        position: { r: 7, c }
      };
    }
  }

  // Black pieces at top
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (c % 2 !== 0) {
      board[0][c] = {
        id: `b-${0}-${c}`,
        color: 'black',
        value: (c % 6 + 1) as PieceValue,
        position: { r: 0, c }
      };
    }
  }

  return board;
}

export function isValidMove(
  board: (GamePiece | null)[][],
  piece: GamePiece,
  toR: number,
  toC: number,
  turn: PlayerColor
): boolean {
  if (piece.color !== turn) return false;
  if (toR < 0 || toR >= BOARD_SIZE || toC < 0 || toC >= BOARD_SIZE) return false;
  
  const target = board[toR][toC];
  if (target && target.color === piece.color) return false;

  // Simple move logic: Move distance based on piece value
  const dr = Math.abs(toR - piece.position.r);
  const dc = Math.abs(toC - piece.position.c);
  
  // Minimalist rule: Can move up to [value] squares orthogonally or diagonally
  if (dr > piece.value || dc > piece.value) return false;
  if (dr === 0 && dc === 0) return false;

  return true;
}
