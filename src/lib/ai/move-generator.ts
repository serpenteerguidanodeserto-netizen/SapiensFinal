// src/lib/ai/move-generator.ts

import {
  BoardState,
  PlayerColor,
  getValidMoves
} from "../game/core-engine"

export type AIAction =
  | { type: "move"; from: [number, number]; to: [number, number] }
  | { type: "rotate"; at: [number, number] }
  | { type: "sacrifice"; from: [number, number]; to: [number, number] }

export function generateMoves(
  board: BoardState,
  player: PlayerColor
): AIAction[] {

  const actions: AIAction[] = []

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c]

      if (!piece || piece.player !== player) continue

      // movimentos normais
      const moves = getValidMoves(board, r, c)

      for (const [nr, nc] of moves) {
        actions.push({
          type: "move",
          from: [r, c],
          to: [nr, nc]
        })
      }

      // rotação
      actions.push({
        type: "rotate",
        at: [r, c]
      })

      // sacrifício
      if (piece.value === 6) {

        for (let tr = 0; tr < 8; tr++) {
          for (let tc = 0; tc < 8; tc++) {

            const target = board[tr][tc]

            if (target && target.player !== player) {
              actions.push({
                type: "sacrifice",
                from: [r, c],
                to: [tr, tc]
              })
            }

          }
        }

      }

    }
  }

  return actions
}
