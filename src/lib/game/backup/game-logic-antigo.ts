// ============================================
// SAPIENS - CORE GAME ENGINE
// Deterministic • Pure • Auditable
// Phase 1 Complete + Sacrifice System
// ============================================

export type PlayerColor = "white" | "black";
export type MovementMode = "rook" | "bishop";

export interface Piece {
  id: string;
  player: PlayerColor;
  value: number; // 1–6
  mode: MovementMode;
}

export type BoardState = (Piece | null)[][];

export type MoveAction =
  | "move"
  | "capture"
  | "alliance"
  | "promotion"
  | "sacrifice";

export interface MoveResult {
  board: BoardState;
  action: MoveAction;
  winner: PlayerColor | null;
  promotion?: {
    pieceId: string;
    position: [number, number];
  };
}

export interface GameEndState {
  winner: PlayerColor | null;
  draw: boolean;
}

export interface RecordedMove {
  type: "move" | "sacrifice";
  from?: [number, number];
  to?: [number, number];
  sacrificeTarget?: [number, number];
  player: PlayerColor;
}

// ============================================
// INITIAL BOARD
// ============================================

export function createInitialBoard(): BoardState {
  const board: BoardState = Array.from({ length: 8 }, () =>
    Array(8).fill(null)
  );

  const outer = [2, 3, 4, 5, 5, 4, 3, 2];

  for (let i = 0; i < 8; i++) {
    board[0][i] = { id: `b-${i}`, player: "black", value: outer[i], mode: "rook" };
    board[1][i] = { id: `b2-${i}`, player: "black", value: 1, mode: "rook" };

    board[6][i] = { id: `w2-${i}`, player: "white", value: 1, mode: "rook" };
    board[7][i] = { id: `w-${i}`, player: "white", value: outer[i], mode: "rook" };
  }

  return board;
}

// ============================================
// HELPERS
// ============================================

function inBounds(r: number, c: number) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isInEnemyTerritory(player: PlayerColor, row: number) {
  return player === "white" ? row <= 3 : row >= 4;
}

export function hashBoard(board: BoardState): string {
  let hash = "";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) hash += ".";
      else hash += `${p.player[0]}${p.value}${p.mode[0]}`;
    }
  }
  return hash;
}

// ============================================
// MOVE GENERATION
// ============================================

export function getValidMoves(
  board: BoardState,
  r: number,
  c: number
): [number, number][] {

  const piece = board[r][c];
  if (!piece) return [];

  const moves: [number, number][] = [];
  const range = piece.value;

  const rook = [[0,1],[0,-1],[1,0],[-1,0]];
  const bishop = [[1,1],[1,-1],[-1,1],[-1,-1]];
  const dirs = piece.mode === "rook" ? rook : bishop;

  for (const [dr, dc] of dirs) {
    for (let i = 1; i <= range; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;

      if (!inBounds(nr, nc)) break;

      const target = board[nr][nc];

      if (!target) {
        moves.push([nr, nc]);
      } else {

        if (target.player !== piece.player) {
          moves.push([nr, nc]);
        }
        else if (
          target.player === piece.player &&
          target.value === piece.value &&
          target.mode === piece.mode &&
          isInEnemyTerritory(piece.player, nr)
        ) {
          moves.push([nr, nc]);
        }

        break;
      }
    }
  }

  return moves;
}

// ============================================
// VALIDATION
// ============================================

export function isMoveLegal(
  board: BoardState,
  player: PlayerColor,
  from: [number, number],
  to: [number, number]
): boolean {

  if (!inBounds(from[0], from[1]) || !inBounds(to[0], to[1]))
    return false;

  const piece = board[from[0]][from[1]];
  if (!piece || piece.player !== player) return false;

  return getValidMoves(board, from[0], from[1])
    .some(([r,c]) => r === to[0] && c === to[1]);
}

// ============================================
// MOVE EXECUTION
// ============================================

export function movePiece(
  board: BoardState,
  player: PlayerColor,
  from: [number, number],
  to: [number, number]
): MoveResult {

  if (!isMoveLegal(board, player, from, to))
    throw new Error("ILLEGAL_MOVE");

  const newBoard = board.map(row => [...row]);
  const moving = { ...newBoard[from[0]][from[1]]! };
  const target = newBoard[to[0]][to[1]];

  let action: MoveAction = "move";
  let winner: PlayerColor | null = null;
  let promotion: MoveResult["promotion"] = undefined;

  const previousValue = moving.value;

  if (target) {

    // ALLIANCE
    if (
      target.player === moving.player &&
      target.value === moving.value &&
      target.mode === moving.mode &&
      isInEnemyTerritory(moving.player, to[0])
    ) {
      action = "alliance";
      moving.value = Math.min(6, moving.value + target.value);
    }

    // CAPTURE
    else if (target.player !== moving.player) {
      action = "capture";
      moving.value = Math.min(6, moving.value + 1);

      if (target.value === 6)
        winner = player;
    }
  }

  newBoard[to[0]][to[1]] = moving;
  newBoard[from[0]][from[1]] = null;

  // PROMOTION CHECK
  if (previousValue < 6 && moving.value === 6) {
    action = "promotion";
    promotion = {
      pieceId: moving.id,
      position: to
    };
  }

  return { board: newBoard, action, winner, promotion };
}

// ============================================
// SACRIFICE EXECUTION
// ============================================

export function executeSacrifice(
  board: BoardState,
  player: PlayerColor,
  promotedPosition: [number, number],
  targetPosition: [number, number]
): MoveResult {

  const newBoard = board.map(row => [...row]);

  const promoted = newBoard[promotedPosition[0]][promotedPosition[1]];
  const target = newBoard[targetPosition[0]][targetPosition[1]];

  if (!promoted || promoted.player !== player || promoted.value !== 6)
    throw new Error("INVALID_SACRIFICE");

  if (!target || target.player === player)
    throw new Error("INVALID_TARGET");

  newBoard[promotedPosition[0]][promotedPosition[1]] = null;
  newBoard[targetPosition[0]][targetPosition[1]] = null;

  return {
    board: newBoard,
    action: "sacrifice",
    winner: null
  };
}

// ============================================
// GAME END
// ============================================

export function checkGameEnd(
  board: BoardState,
  currentTurn: PlayerColor
): GameEndState {

  let white = 0;
  let black = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      if (p.player === "white") white++;
      if (p.player === "black") black++;
    }
  }

  if (white === 0) return { winner: "black", draw: false };
  if (black === 0) return { winner: "white", draw: false };

  return { winner: null, draw: false };
}

// ============================================
// REPLAY SYSTEM
// ============================================

export function replayGame(
  moves: RecordedMove[]
) {
  let board = createInitialBoard();
  let expectedTurn: PlayerColor = "white";
  let winner: PlayerColor | null = null;
  let movesWithoutCapture = 0;
  const seen = new Map<string, number>();

  for (const move of moves) {

    if (move.player !== expectedTurn)
      throw new Error("INVALID_TURN_SEQUENCE");

    let result: MoveResult;

    if (move.type === "move") {
      result = movePiece(board, move.player, move.from!, move.to!);
    } else {
      result = executeSacrifice(
        board,
        move.player,
        move.from!,
        move.sacrificeTarget!
      );
    }

    board = result.board;

    if (result.action === "capture" || result.action === "sacrifice")
      movesWithoutCapture = 0;
    else
      movesWithoutCapture++;

    if (movesWithoutCapture >= 100)
      return { finalBoard: board, winner: null };

    const hash = hashBoard(board);
    const count = (seen.get(hash) || 0) + 1;
    seen.set(hash, count);

    if (count >= 3)
      return { finalBoard: board, winner: null };

    if (result.winner) {
      winner = result.winner;
      break;
    }

    expectedTurn = expectedTurn === "white" ? "black" : "white";
  }

  return { finalBoard: board, winner };
}
