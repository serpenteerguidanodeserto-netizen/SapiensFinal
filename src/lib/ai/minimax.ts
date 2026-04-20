// src/lib/ai/minimax.ts

import {
  BoardState,
  PlayerColor,
  getValidMoves,
  movePiece,
  rotatePiece,
  executeSacrifice,
} from "../game/core-engine"

// =====================================================
// TIPOS
// =====================================================

export type AIAction =
  | { type: "move"; from: [number, number]; to: [number, number] }
  | { type: "rotate"; at: [number, number] }
  | { type: "sacrifice"; from: [number, number]; to: [number, number] }

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
// EVALUATION
// =====================================================

function evaluate(board: BoardState, player: PlayerColor): number {

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

      const centerBonus = HEATMAP[r][c] * 0.1
      const mobility = getValidMoves(board, r, c).length * 0.05

      const pieceScore = value + centerBonus + mobility

      if (piece.player === player) {
        score += pieceScore
      } else {
        score -= pieceScore
      }
    }
  }

  return score
}

// =====================================================
// GERAR AÇÕES
// =====================================================

function generateActions(
  board: BoardState,
  player: PlayerColor
): AIAction[] {

  const actions: AIAction[] = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c]
      if (!piece || piece.player !== player) continue

      // MOVES
      const moves = getValidMoves(board, r, c)

      for (const [nr, nc] of moves) {
        actions.push({
          type: "move",
          from: [r, c],
          to: [nr, nc],
        })
      }

      // ROTATE
      actions.push({
        type: "rotate",
        at: [r, c],
      })

      // SACRIFICE
      if (piece.value === 6) {

        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {

            const target = board[tr][tc]

            if (target && target.player !== player) {
              actions.push({
                type: "sacrifice",
                from: [r, c],
                to: [tr, tc],
              })
            }

          }
        }
      }

    }
  }

  return actions
}

// =====================================================
// APLICAR AÇÃO
// =====================================================

function applyAction(
  board: BoardState,
  player: PlayerColor,
  action: AIAction
) {

  try {

    switch (action.type) {

      case "move":
        return movePiece(board, player, action.from, action.to)

      case "rotate":
        return rotatePiece(board, player, action.at)

      case "sacrifice": {

        const piece = board[action.from[0]][action.from[1]]
        if (!piece) return null

        return executeSacrifice(
          board,
          player,
          action.from,
          action.to,
          piece.id
        )
      }

    }

  } catch {
    return null
  }
}

// =====================================================
// UTIL
// =====================================================

function opponent(p: PlayerColor): PlayerColor {
  return p === "white" ? "black" : "white"
}

// =====================================================
// MINIMAX
// =====================================================

function minimax(
  board: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  player: PlayerColor
): number {

  if (depth === 0) {
    return evaluate(board, player)
  }

  const current = maximizing ? player : opponent(player)
  const actions = generateActions(board, current)

  if (actions.length === 0) {
    return evaluate(board, player)
  }

  if (maximizing) {

    let maxEval = -Infinity

    for (const action of actions) {

      const result = applyAction(board, current, action)
      if (!result) continue

      const evalScore = minimax(
        result.board,
        depth - 1,
        alpha,
        beta,
        false,
        player
      )

      maxEval = Math.max(maxEval, evalScore)
      alpha = Math.max(alpha, evalScore)

      if (beta <= alpha) break
    }

    return maxEval

  } else {

    let minEval = Infinity

    for (const action of actions) {

      const result = applyAction(board, current, action)
      if (!result) continue

      const evalScore = minimax(
        result.board,
        depth - 1,
        alpha,
        beta,
        true,
        player
      )

      minEval = Math.min(minEval, evalScore)
      beta = Math.min(beta, evalScore)

      if (beta <= alpha) break
    }

    return minEval
  }
}

// =====================================================
// MELHOR AÇÃO
// =====================================================

export function getBestAction(
  board: BoardState,
  depth: number,
  player: PlayerColor
): AIAction | null {

  let bestAction: AIAction | null = null
  let bestScore = -Infinity

  const actions = generateActions(board, player)

  for (const action of actions) {

    const result = applyAction(board, player, action)
    if (!result) continue

    const score = minimax(
      result.board,
      depth - 1,
      -Infinity,
      Infinity,
      false,
      player
    )

    if (score > bestScore) {
      bestScore = score
      bestAction = action
    }

  }

  return bestAction
}
