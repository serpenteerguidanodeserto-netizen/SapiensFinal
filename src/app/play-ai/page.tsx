"use client";

import React, { useEffect, useState, useRef } from "react";
import Board from "@/components/game/Board";
import PlayerInfo from "@/components/game/PlayerInfo";
import History from "@/components/game/History";
import { getBestAction } from "@/lib/ai/minimax";

import {
  BoardState,
  PlayerColor,
  createInitialBoard,
  movePiece,
  rotatePiece,
  executeSacrifice,
  coordsToNotation,
} from "@/lib/game/core-engine";

import { MoveRecord } from "@/lib/game/game-types";

export default function PlayAIPage() {

  const [board, setBoard] = useState<BoardState>(() => createInitialBoard());
  const [turn, setTurn] = useState<PlayerColor>("white");
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const [sacrificeWindow, setSacrificeWindow] = useState<{
    pieceId: string;
    pos: [number, number];
  } | null>(null);

  const sacrificeTimer = useRef<NodeJS.Timeout | null>(null);

  const aiColor: PlayerColor = "black";
  const humanColor: PlayerColor = "white";

  /* ============================================================
     MOVIMENTO HUMANO
  ============================================================ */

  const handleMove = (from: [number, number], to: [number, number]) => {

    if (turn !== humanColor || isThinking) return;

    /* ============================================================
       SACRIFÍCIO
    ============================================================ */

    if (sacrificeWindow) {

      const clickedPiece = board[to[0]][to[1]];

      // cancelar sacrifício
      if (
        to[0] === sacrificeWindow.pos[0] &&
        to[1] === sacrificeWindow.pos[1]
      ) {

        if (sacrificeTimer.current) {
          clearTimeout(sacrificeTimer.current);
        }

        setSacrificeWindow(null);
        setTurn(aiColor);
        return;
      }

      // executar sacrifício
      if (clickedPiece && clickedPiece.player !== humanColor) {

        try {

          const result = executeSacrifice(
            board,
            humanColor,
            sacrificeWindow.pos,
            to,
            sacrificeWindow.pieceId
          );

          if (sacrificeTimer.current) {
            clearTimeout(sacrificeTimer.current);
          }

          setBoard(result.board);

          setHistory((prev) => [
            ...prev,
            {
              player: humanColor,
              from: coordsToNotation(sacrificeWindow.pos),
              to: coordsToNotation(to),
              action: "sacrifice",
              value: 0,
            },
          ]);

          setSacrificeWindow(null);
          setTurn(aiColor);
          return;

        } catch (err) {
          console.error("Sacrifice failed:", err);
        }
      }

      return;
    }

    /* ============================================================
       MOVIMENTO NORMAL
    ============================================================ */

    try {

      const result = movePiece(board, humanColor, from, to);

      setBoard(result.board);

      setHistory((prev) => [
        ...prev,
        {
          player: humanColor,
          from: coordsToNotation(from),
          to: coordsToNotation(to),
          action:
            result.action === "promotion"
              ? "move"
              : result.action,
          value: result.board[to[0]][to[1]]?.value ?? 0,
        },
      ]);

      /* ============================================================
         PROMOÇÃO → ABRIR SACRIFÍCIO
      ============================================================ */

      if (result.promotion) {

        const pos = result.promotion.position;

        setSacrificeWindow({
          pieceId: result.promotion.pieceId,
          pos
        });

        sacrificeTimer.current = setTimeout(() => {
          setSacrificeWindow(null);
          setTurn(aiColor);
        }, 6000);

        return;
      }

      setTurn(aiColor);

    } catch (err) {
      console.log("Illegal move");
    }
  };

  /* ============================================================
     ROTATE HUMANO
  ============================================================ */

  const handleRotate = (pos: [number, number]) => {

    if (turn !== humanColor || isThinking) return;

    try {

      const result = rotatePiece(board, humanColor, pos);

      setBoard(result.board);

      setHistory((prev) => [
        ...prev,
        {
          player: humanColor,
          from: coordsToNotation(pos),
          to: coordsToNotation(pos),
          action: "rotate",
          value: result.board[pos[0]][pos[1]]?.value ?? 0,
        },
      ]);

      setTurn(aiColor);

    } catch {}
  };

  /* ============================================================
     IA
  ============================================================ */

   useEffect(() => {

    if (turn !== aiColor) return;

    setIsThinking(true);

    const delay = 700 + Math.random() * 800;

    const timeout = setTimeout(() => {

      const action = getBestAction(board, 3, aiColor);

      if (!action) {
        setIsThinking(false);
        return;
      }

      try {

        let result;

        switch (action.type) {

          case "move":
            result = movePiece(board, aiColor, action.from, action.to);
            break;

          case "rotate":
            result = rotatePiece(board, aiColor, action.at);
            break;

          case "sacrifice":
            result = executeSacrifice(
              board,
              aiColor,
              action.from,
              action.to,
              board[action.from[0]][action.from[1]]!.id
            );
            break;
        }

        if (!result) {
          setIsThinking(false);
          return;
        }

        setBoard(result.board);

        if (action.type === "move" || action.type === "sacrifice") {

          setHistory((prev) => [
            ...prev,
            {
              player: aiColor,
              from: coordsToNotation(action.from),
              to: coordsToNotation(action.to),
              action:
                result.action === "promotion"
                  ? "move"
                  : result.action,
              value:
                result.board[action.to[0]][action.to[1]]?.value ?? 0,
            },
          ]);
        }

        if (action.type === "rotate") {

          setHistory((prev) => [
            ...prev,
            {
              player: aiColor,
              from: coordsToNotation(action.at),
              to: coordsToNotation(action.at),
              action: "rotate",
              value:
                result.board[action.at[0]][action.at[1]]?.value ?? 0,
            },
          ]);
        }

        setTurn(humanColor);

      } catch (err) {
        console.error("AI error:", err);
      }

      setIsThinking(false);

    }, delay);

    return () => clearTimeout(timeout);

  }, [turn, board]);

  /* ============================================================
     UI
  ============================================================ */

  return (

    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-6">

      <PlayerInfo
        color={aiColor}
        name={isThinking ? "Sapiens AI (pensando...)" : "Sapiens AI"}
        time={0}
        isActive={turn === aiColor}
      />

      <Board
        board={board}
        turn={turn}
        onMove={handleMove}
        onRotate={handleRotate}
        sacrificeWindow={sacrificeWindow}
      />

      <PlayerInfo
        color={humanColor}
        name="Você"
        time={0}
        isActive={turn === humanColor}
      />

      <History history={history} />

    </div>
  );
}
