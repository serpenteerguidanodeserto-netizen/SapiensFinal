
"use client"

import React from 'react';
import { cn } from '@/lib/utils';
import { PlayerColor } from '@/lib/game/core-engine';
import { User } from 'lucide-react';

interface PlayerInfoProps {
  name: string;
  color: PlayerColor;
  time: number;
  isActive: boolean;
  align?: 'top' | 'bottom';
}

export default function PlayerInfo({ name, color, time, isActive, align = 'bottom' }: PlayerInfoProps) {
  const isWhite = color === 'white';
  
  return (
    <div className={cn(
      "flex items-center justify-between w-full max-w-[600px] mx-auto py-2 px-4 rounded-lg transition-all border border-transparent",
      isActive && "bg-primary/10 border-primary/20 shadow-sm",
      align === 'top' ? "mb-2" : "mt-2"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center border shadow-sm",
          isWhite ? "bg-white text-black" : "bg-neutral-800 text-white"
        )}>
          <User size={16} />
        </div>
        <div className="flex flex-col">
          <h3 className="font-headline font-bold text-[12px] leading-tight truncate max-w-[120px]">{name}</h3>
          <span className="text-[8px] uppercase font-bold text-muted-foreground">{isWhite ? 'Branco' : 'Preto'}</span>
        </div>
      </div>

      <div className={cn(
        "px-2 py-1 rounded font-mono font-bold text-lg tabular-nums shadow-inner",
        isActive ? "bg-neutral-900 text-white" : "bg-muted text-muted-foreground"
      )}>
        {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}
      </div>
    </div>
  );
}
