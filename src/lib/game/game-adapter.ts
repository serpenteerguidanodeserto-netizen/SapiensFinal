import {
  movePiece,
  rotatePiece,
  executeSacrifice,
  flattenBoard,
  unflattenBoard
} from "./core-engine";

import { MultiplayerGameState } from "./game-types";

export function applyMove(
  multiplayerState: MultiplayerGameState,
  move: any
): MultiplayerGameState {

  const board = unflattenBoard(multiplayerState.board);

  let result;

  /* ============================================================
     MOVE
  ============================================================ */

  if (move.type === "move") {

    result = movePiece(board, move.player, move.from, move.to);

    let sacrificeWindow = multiplayerState.sacrificeWindow ?? null;

    if (result.promotion) {
      sacrificeWindow = {
        pieceId: result.promotion.pieceId,
        expiresAt: Date.now() + 6000
      };
    }

    return {
      ...multiplayerState,
      board: flattenBoard(result.board),
      turn: move.player === "white" ? "black" : "white",
      sacrificeWindow
    };
  }

  /* ============================================================
     ROTATE
  ============================================================ */

  if (move.type === "rotate") {

    result = rotatePiece(board, move.player, move.from);

    return {
      ...multiplayerState,
      board: flattenBoard(result.board),
      turn: move.player === "white" ? "black" : "white"
    };
  }

  /* ============================================================
     SACRIFICE
  ============================================================ */

  if (!multiplayerState.sacrificeWindow) {
    throw new Error("NO_SACRIFICE_AVAILABLE");
  }

  result = executeSacrifice(
    board,
    move.player,
    move.from,
    move.sacrificeTarget,
    multiplayerState.sacrificeWindow.pieceId
  );

  return {
    ...multiplayerState,
    board: flattenBoard(result.board),
    turn: move.player === "white" ? "black" : "white",
    sacrificeWindow: null
  };
}
