// src/lib/ai/zobrist.ts

import { BoardState } from "../game/core-engine"

const BOARD_SIZE = 8
const PIECE_TYPES = 6

const random64 = () =>
  BigInt.asUintN(
    64,
    BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
  )

let zobristTable: bigint[][][] = []

export function initZobrist() {

  zobristTable = []

  for (let r = 0; r < BOARD_SIZE; r++) {

    zobristTable[r] = []

    for (let c = 0; c < BOARD_SIZE; c++) {

      zobristTable[r][c] = []

      for (let p = 0; p < PIECE_TYPES * 2; p++) {
        zobristTable[r][c][p] = random64()
      }
    }
  }
}

export function computeHash(board: BoardState): bigint {

  let hash = 0n

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {

      const piece = board[r][c]
      if (!piece) continue

      const pieceIndex =
        (piece.player === "white" ? 0 : PIECE_TYPES) +
        (piece.value - 1)

      hash ^= zobristTable[r][c][pieceIndex]
    }
  }

  return hash
}
