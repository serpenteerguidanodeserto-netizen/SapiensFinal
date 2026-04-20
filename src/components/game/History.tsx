"use client"

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoveHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MoveRecord } from "@/lib/game/game-types";

interface HistoryProps {
  history: MoveRecord[];
}

export default function History({ history }: HistoryProps) {
  return (
    <div className="h-full flex flex-col bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h2 className="font-headline font-bold text-sm uppercase tracking-wider">Histórico</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Aguardando jogadas...</p>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {history.map((move, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors text-xs border-b border-border/50 last:border-0"
                >
                  <span className="w-6 font-mono font-bold opacity-50">{i + 1}.</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    move.player === 'white' ? "bg-white border" : "bg-black"
                  )} />
                  <span className="font-medium">{move.from}</span>
                  {move.action === 'rotate' ? (
                    <RotateCcw size={12} className="text-accent" />
                  ) : (
                    <MoveHorizontal size={12} className="text-primary" />
                  )}
                  <span className="font-medium">{move.to || '↺'}</span>
                  <span className="ml-auto font-mono bg-muted px-1.5 rounded text-[10px]">V: {move.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
