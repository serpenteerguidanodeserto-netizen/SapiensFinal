"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BoardState,
  PlayerColor,
  getValidMoves,
} from "@/lib/game/core-engine";
import Die from "./Die";

interface BoardProps {
  board: BoardState;
  turn: PlayerColor;
  onMove: (from: [number, number], to: [number, number]) => void;
  onRotate: (pos: [number, number]) => void;

  // 🔥 NOVO
  sacrificeWindow: {
    pieceId: string;
    pos: [number, number];
  } | null;
}

export default function Board({
  board,
  turn,
  onMove,
  onRotate,
  sacrificeWindow,
}: BoardProps) {
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);

  const handleSquareClick = (r: number, c: number) => {
    const piece = board[r][c];

    if (selected) {
      const isValidMove = validMoves.some(
        ([vr, vc]) => vr === r && vc === c
      );

      const target = board[r][c];

      if (isValidMove) {
        onMove(selected, [r, c]);
        setSelected(null);
        setValidMoves([]);
        return;
      }

      if (target && target.player !== turn) {
        onMove(selected, [r, c]);
        setSelected(null);
        setValidMoves([]);
        return;
      }

      setSelected(null);
      setValidMoves([]);
      return;
    }

    if (piece && piece.player === turn) {
      setSelected([r, c]);
      setValidMoves(getValidMoves(board, r, c));
      return;
    }

    if (piece && piece.player !== turn) {
      onMove([r, c], [r, c]);
      return;
    }

    setSelected(null);
    setValidMoves([]);
  };

  const handleRotateClick = (
    e: React.MouseEvent,
    r: number,
    c: number
  ) => {
    e.stopPropagation();
    onRotate([r, c]);
    setSelected(null);
    setValidMoves([]);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes blink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>

      <div className="relative w-full max-w-[600px] aspect-square mx-auto shadow-2xl">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full border-[2px] border-[#405336] rounded-sm overflow-hidden">
          {board.map((row, r) =>
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;

              const isSelected =
                selected?.[0] === r && selected?.[1] === c;

              const selectedPiece = selected
                ? board[selected[0]][selected[1]]
                : null;

              const isValidMove = validMoves.some(
                ([vr, vc]) => vr === r && vc === c
              );

              // 🔥 SACRIFÍCIO (BASEADO NO ESTADO REAL)
              const isSacrificeMode = !!sacrificeWindow;

              const sacrificePiece = sacrificeWindow
                ? board[sacrificeWindow.pos[0]][
                    sacrificeWindow.pos[1]
                  ]
                : null;

              const isSacrificeTarget =
                isSacrificeMode &&
                piece &&
                piece.player !== turn;

              // 🟢 ALIANÇA
              const isAlliance =
                isValidMove &&
                piece &&
                selectedPiece &&
                piece.player === selectedPiece.player &&
                piece.value === selectedPiece.value &&
                piece.mode === selectedPiece.mode;

              // 🔴 ATAQUE (DESATIVA NO SACRIFÍCIO)
              const isCapturable =
                isValidMove &&
                piece &&
                selectedPiece &&
                piece.player !== selectedPiece.player &&
                !isAlliance &&
                !isSacrificeMode;

              const allianceSrc =
                piece?.player === "white"
                  ? "/markers/aliance_w.png"
                  : "/markers/aliance_b.png";

              const sacrificeSrc =
                turn === "white"
                  ? "/markers/sacrify_b.png"
                  : "/markers/sacrify_w.png";

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className={cn(
                    "relative flex items-center justify-center cursor-pointer transition-colors duration-200 select-none",
                    isDark ? "bg-[#769656]" : "bg-[#EEEED2]",
                    isSelected && "bg-[#BACA44]",
                    isValidMove &&
                      !isCapturable &&
                      !isAlliance &&
                      !isSacrificeTarget &&
                      "square-highlight",
                    isCapturable && "square-capture"
                  )}
                >
                  {/* 🔶 MOVIMENTO */}
                  {isValidMove &&
                    !isCapturable &&
                    !isAlliance &&
                    !isSacrificeTarget && (
                      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                        <div className="relative w-[60%] h-[60%]">
                          <img
                            src="/markers/radius.png"
                            className="w-full h-full object-contain opacity-70 animate-pulse"
                          />
                        </div>
                      </div>
                    )}

                  {/* 🟠 SACRIFÍCIO */}
                  {isSacrificeTarget && piece && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                      <div
                        className={cn(
                          "relative w-[85%] h-[85%]",
                          sacrificePiece?.mode === "bishop" &&
                            "rotate-45"
                        )}
                        style={{
                          animation: "blink 2s steps(1) infinite",
                        }}
                      >
                        <img
                          src={sacrificeSrc}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* 🟥 ATAQUE */}
                  {isCapturable && piece && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div
                        className={cn(
                          "relative w-[85%] h-[85%]",
                          piece.mode === "bishop" && "rotate-45"
                        )}
                        style={{
                          animation: "blink 2s steps(1) infinite",
                        }}
                      >
                        <img
                          src="/markers/attack.png"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* 🟢 ALIANÇA */}
                  {isAlliance && piece && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <div className="relative w-[85%] h-[85%]">
                        <img
                          src={allianceSrc}
                          className={cn(
                            "w-full h-full object-contain",
                            piece.mode === "bishop" && "rotate-45"
                          )}
                          style={{
                            animation:
                              "blink 2s steps(1) infinite",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* coordenadas */}
                  {c === 0 && (
                    <span className="absolute left-0.5 top-0.5 text-[10px] font-bold opacity-40">
                      {8 - r}
                    </span>
                  )}

                  {r === 7 && (
                    <span className="absolute right-0.5 bottom-0.5 text-[10px] font-bold opacity-40">
                      {String.fromCharCode(97 + c)}
                    </span>
                  )}

                  {/* peça */}
                  {piece && (
                    <div className="relative z-10 group flex items-center justify-center w-[85%] h-[85%]">
                      <Die piece={piece} />

                      {isSelected && (
                        <button
                          onClick={(e) =>
                            handleRotateClick(e, r, c)
                          }
                          className="absolute -top-1 -right-1 bg-accent p-1 rounded-full opacity-0 group-hover:opacity-100 z-20"
                        >
                          ↻
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
