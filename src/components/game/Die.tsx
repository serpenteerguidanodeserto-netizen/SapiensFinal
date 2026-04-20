"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Piece } from "@/lib/game/core-engine";

interface DieProps {
  piece: Piece;
}

export default function Die({ piece }: DieProps) {
  const prefix = piece.player === "white" ? "w" : "b";
  const src = `/pieces/${prefix}${piece.value}.png`;

  return (
    <div
      className={cn(
        "relative w-full h-full transition-transform duration-300",
        piece.mode === "bishop" && "rotate-45 scale-[0.95]"
      )}
    >
      <img
        src={src}
        alt={`${piece.player}-${piece.value}`}
        className="w-full h-full object-contain pointer-events-none select-none"
      />
    </div>
  );
}