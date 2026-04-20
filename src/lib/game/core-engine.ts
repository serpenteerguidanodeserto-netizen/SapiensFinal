// ============================================
// SAPIENS CORE ENGINE
// Pure • Deterministic • Auditable
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
  | "rotate"
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

export interface RecordedMove {
  type: "move" | "rotate" | "sacrifice";
  player: PlayerColor;
  from?: [number, number];
  to?: [number, number];
  sacrificeTarget?: [number, number];
}

// ============================================
// INITIAL BOARD
// ============================================

/*export function createInitialBoard(): BoardState {
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
}*/
export function createInitialBoard(): BoardState {
  const layout = [
    ["b2","b3","b4","b5","b5","b4","b3","b2"],
    ["b1","b1","b1","b1","b1","b1","b1","b1"],    
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ["w1","w1","w1","w1","w1","w1","w1","w1"],
    ["w2","w3","w4","w5","w5","w4","w3","w2"],
  ];

  const board: BoardState = layout.map((row, r) =>
    row.map((cell, c) => {
      if (!cell) return null;

      const player = cell[0] === "w" ? "white" : "black";
      const value = parseInt(cell[1]);

      return {
        id: `${cell}-${r}-${c}`,
        player,
        value,
        mode: "rook", // padrão inicial
      };
    })
  );

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

export function flattenBoard(board: BoardState) {
  return board.flat();
}

export function unflattenBoard(flat: (Piece | null)[]): BoardState {
  const board: BoardState = [];
  for (let i = 0; i < 8; i++) {
    board.push(flat.slice(i * 8, i * 8 + 8));
  }
  return board;
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

        // ALLIANCE (both pieces must be in enemy territory)
        else if (
          target.player === piece.player &&
          target.value === piece.value &&
          target.mode === piece.mode &&
          isInEnemyTerritory(piece.player, nr) &&
          isInEnemyTerritory(piece.player, r)
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
// MOVE EXECUTION
// ============================================

export function movePiece(
  board: BoardState,
  player: PlayerColor,
  from: [number, number],
  to: [number, number]
): MoveResult {

  const piece = board[from[0]][from[1]];

  if (!piece || piece.player !== player)
    throw new Error("ILLEGAL_MOVE");

  const legal = getValidMoves(board, from[0], from[1])
    .some(([r,c]) => r === to[0] && c === to[1]);

  if (!legal) throw new Error("ILLEGAL_MOVE");

  const newBoard = board.map(row => [...row]);
  const moving = { ...newBoard[from[0]][from[1]]! };
  const target = newBoard[to[0]][to[1]];

  let action: MoveAction = "move";
  let winner: PlayerColor | null = null;
  let promotion;

  const previousValue = moving.value;

  if (target) {

    // ALLIANCE
    if (
      target.player === moving.player &&
      target.value === moving.value &&
      target.mode === moving.mode &&
      isInEnemyTerritory(moving.player, to[0]) &&
      isInEnemyTerritory(moving.player, from[0])
    ) {
      action = "alliance";
      moving.value = Math.min(6, moving.value + target.value);
    }

    // CAPTURE
    else {
      action = "capture";
      moving.value = Math.min(6, moving.value + 1);

      if (target.value === 6)
        winner = player;
    }
  }

  newBoard[to[0]][to[1]] = moving;
  newBoard[from[0]][from[1]] = null;

  if (previousValue < 6 && moving.value === 6) {
    action = "promotion";
    promotion = { pieceId: moving.id, position: to };
  }

  return { board: newBoard, action, winner, promotion };
}

// ============================================
// ROTATE
// ============================================

export function rotatePiece(
  board: BoardState,
  player: PlayerColor,
  pos: [number, number]
): MoveResult {

  const piece = board[pos[0]][pos[1]];

  if (!piece || piece.player !== player)
    throw new Error("INVALID_ROTATE");

  const newBoard = board.map(row => [...row]);

  newBoard[pos[0]][pos[1]] = {
    ...piece,
    mode: piece.mode === "rook" ? "bishop" : "rook"
  };

  return { board: newBoard, action: "rotate", winner: null };
}

// ============================================
// SACRIFICE
// ============================================

export function executeSacrifice(
  board: BoardState,
  player: PlayerColor,
  promotedPos: [number, number],
  targetPos: [number, number],
  allowedPieceId: string
): MoveResult {

  const promoted = board[promotedPos[0]][promotedPos[1]];
  const target = board[targetPos[0]][targetPos[1]];

  if (!promoted || promoted.player !== player || promoted.value !== 6)
    throw new Error("INVALID_SACRIFICE");

  // only the newly promoted piece can sacrifice
  if (promoted.id !== allowedPieceId)
    throw new Error("SACRIFICE_NOT_ALLOWED");

  if (!target || target.player === player)
    throw new Error("INVALID_TARGET");

  const newBoard = board.map(row => [...row]);

  newBoard[promotedPos[0]][promotedPos[1]] = null;
  newBoard[targetPos[0]][targetPos[1]] = null;

  return { board: newBoard, action: "sacrifice", winner: null };
}

// ============================================
// NOTATION HELPERS
// ============================================

export function coordsToNotation(pos: [number, number]): string {

  const [r, c] = pos;

  const file = String.fromCharCode(97 + c); // a-h
  const rank = 8 - r; // 1-8

  return `${file}${rank}`;
}
