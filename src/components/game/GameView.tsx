"use client";

import React, { useEffect, useState } from "react";
import {
  createInitialBoard,
  BoardState,
  PlayerColor,
  movePiece,
  rotatePiece,
  flattenBoard,
  unflattenBoard,
} from "@/lib/game/core-engine";
import Board from "./Board";
import PlayerInfo from "./PlayerInfo";
import History from "./History";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface GameViewProps {
  room: any;
  user: any;
}

export default function GameView({ room, user }: GameViewProps) {
  const [board, setBoard] = useState<BoardState>(createInitialBoard());

  // 🔥 Atualiza board apenas quando o Firestore muda o board
  useEffect(() => {
    if (room?.gameState?.board) {
      setBoard(unflattenBoard(room.gameState.board));
    }
  }, [room?.gameState?.board]);

  if (!room || !user) return null;

  const userColor: PlayerColor =
    user.uid === room.playerOneId ? "white" : "black";

  // ===============================
  // HANDLE MOVE
  // ===============================

  const handleMove = async (
    from: [number, number],
    to: [number, number]
  ) => {
    try {
      const result = movePiece(board, userColor, from, to);
      const newBoard = result.board;

      // ❗ NÃO usamos setBoard aqui
      // O listener do Firestore vai atualizar o estado

      await updateDoc(doc(db, "rooms", room.id), {
        "gameState.board": flattenBoard(newBoard),
        "gameState.turn": userColor === "white" ? "black" : "white",
      });

    } catch (err) {
      console.error("Movimento inválido", err);
    }
  };

  // ===============================
  // HANDLE ROTATE
  // ===============================

  const handleRotate = async (pos: [number, number]) => {
    try {
      const result = rotatePiece(board, userColor, pos);
      const newBoard = result.board;

      await updateDoc(doc(db, "rooms", room.id), {
        "gameState.board": flattenBoard(newBoard),
        "gameState.turn": userColor === "white" ? "black" : "white",
      });

    } catch (err) {
      console.error("Rotação inválida", err);
    }
  };

  // ===============================
  // RENDER
  // ===============================

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Opponent */}
      <PlayerInfo
        name={room.playerTwoUsername || "Aguardando..."}
        color={userColor === "white" ? "black" : "white"}
        time={room.timeRemaining?.black ?? 0}
        isActive={room.gameState?.turn !== userColor}
        align="top"
      />

      {/* Board */}
      <Board
        board={board}
        turn={room.gameState?.turn}
        onMove={handleMove}
        onRotate={handleRotate}
      />

      {/* Current Player */}
      <PlayerInfo
        name={room.playerOneUsername}
        color={userColor}
        time={room.timeRemaining?.white ?? 0}
        isActive={room.gameState?.turn === userColor}
        align="bottom"
      />

      {/* History */}
      <History history={room.history || []} />

    </div>
  );
}
