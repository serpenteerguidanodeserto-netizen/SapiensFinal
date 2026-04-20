
"use client"

import React from 'react';
import { useDoc, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { doc, getFirestore } from 'firebase/firestore';
import { Trophy, LogOut, User as UserIcon, Medal, Target } from 'lucide-react';
import { getDivision } from '@/app/lib/ranking-logic';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps) {
  const firestore = useFirestore();
  const auth = useAuth();

  const rankingRef = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return doc(firestore, 'player_rankings', userId);
  }, [firestore, userId]);

  const { data: ranking, isLoading } = useDoc(rankingRef);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: "Logout realizado", description: "Até a próxima partida!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível sair." });
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-3">
      <div className="h-10 w-10 bg-muted rounded"></div>
      <div className="h-4 w-3/4 bg-muted rounded"></div>
    </div>;
  }

  const division = getDivision(ranking?.eloRating || 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
          <UserIcon size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-black truncate leading-tight uppercase tracking-tighter">
            {ranking?.username || "Jogador"}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
          <LogOut size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="bg-background/50 p-3 rounded-lg border border-border/50">
          <div className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest flex items-center gap-1">
            <Medal size={8} /> Divisão
          </div>
          <div className={cn("text-xs font-black uppercase italic", division.color)}>
            {division.label}
          </div>
        </div>
        <div className="bg-background/50 p-3 rounded-lg border border-border/50">
          <div className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest flex items-center gap-1">
            <Trophy size={8} /> Pontos
          </div>
          <div className="text-xs font-black tabular-nums">
            {ranking?.eloRating || 100}
          </div>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl space-y-3">
        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
          <span className="text-muted-foreground">Vitórias</span>
          <span className="text-primary">{ranking?.wins || 0}</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold uppercase">
          <span className="text-muted-foreground">Capturas</span>
          <span>{ranking?.totalCaptures || 0}</span>
        </div>
        <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: '45%' }}></div>
        </div>
      </div>
    </div>
  );
}
