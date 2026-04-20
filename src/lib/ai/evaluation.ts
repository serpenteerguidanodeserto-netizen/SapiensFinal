// src/lib/ai/evaluation.ts

import {
  BoardState,
  PlayerColor,
  getValidMoves
} from "../game/core-engine"

// =====================================================
// HEATMAP CENTRAL
// =====================================================

const HEATMAP = [
  [0,0,1,2,2,1,0,0],
  [0,1,2,3,3,2,1,0],
  [1,2,3,4,4,3,2,1],
  [2,3,4,5,5,4,3,2],
  [2,3,4,5,5,4,3,2],
  [1,2,3,4,4,3,2,1],
  [0,1,2,3,3,2,1,0],
  [0,0,1,2,2,1,0,0],
]

// =====================================================
// UTIL
// =====================================================

function opponent(player: PlayerColor): PlayerColor {
  return player === "white" ? "black" : "white"
}

// =====================================================
// MATERIAL
// =====================================================

function evaluateMaterial(board: BoardState, player: PlayerColor) {

  let score = 0

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c]
      if (!piece) continue

      let value = piece.value

      // peça 6 é estruturalmente dominante
      if (piece.value === 6) {
        value = 9
      }

      if (piece.player === player) {
        score += value
      } else {
        score -= value
      }

    }
  }

  return score
}

// =====================================================
// CONTROLE DO CENTRO
// =====================================================

function evaluateCenter(board: BoardState, player: PlayerColor) {

  let score = 0

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c]
      if (!piece) continue

      const bonus = HEATMAP[r][c] * 0.2

      if (piece.player === player) {
        score += bonus
      } else {
        score -= bonus
      }

    }
  }

  return score
}

// =====================================================
// MOBILIDADE
// =====================================================

function evaluateMobility(board: BoardState, player: PlayerColor) {

  let playerMoves = 0
  let enemyMoves = 0

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c]
      if (!piece) continue

      const moves = getValidMoves(board, r, c).length

      if (piece.player === player) {
        playerMoves += moves
      } else {
        enemyMoves += moves
      }

    }
  }

  return playerMoves - enemyMoves
}

// =====================================================
// PEÇAS AVANÇADAS
// =====================================================

function evaluateAdvancedPieces(board: BoardState, player: PlayerColor) {

  let score = 0

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c]
      if (!piece) continue

      if (piece.player === "white") {
        score += piece.player === player ? (7 - r) * 0.05 : -(7 - r) * 0.05
      }

      if (piece.player === "black") {
        score += piece.player === player ? r * 0.05 : -r * 0.05
      }

    }
  }

  return score
}

// =====================================================
// AVALIAÇÃO FINAL
// =====================================================

export function evaluate(
  board: BoardState,
  player: PlayerColor
): number {

  let score = 0

  score += 10 * evaluateMaterial(board, player)
  score += 4 * evaluateCenter(board, player)
  score += 3 * evaluateMobility(board, player)
  score += 2 * evaluateAdvancedPieces(board, player)

  return score
}
