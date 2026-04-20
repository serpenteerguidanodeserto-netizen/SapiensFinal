"use client"

import React from 'react';
import { useCollection, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy, limit, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Trophy, Target, Star, FlaskConical, Crown, Loader2 } from 'lucide-react';
import { getDivision } from '@/app/lib/ranking-logic';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function Leaderboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const rankingsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(
      collection(firestore, 'player_rankings'),
      orderBy('eloRating', 'desc'),
      limit(10)
    );
  }, [firestore, user, isUserLoading]);

  const { data: rankings, isLoading: isCollectionLoading } = useCollection(rankingsQuery);
  const isLoading = isUserLoading || isCollectionLoading;

  const seedTestData = async () => {
    if (!firestore || !user) {
      toast({ title: "Autenticação necessária", variant: "destructive" });
      return;
    }

    const testPlayers = [
      { id: 'bot_1', username: 'Magnus_Sapiens', eloRating: 2850, wins: 150, losses: 20, captures: 1200 },
      { id: 'bot_2', username: 'DeepBlue_AI', eloRating: 2400, wins: 120, losses: 45, captures: 980 },
      { id: 'bot_3', username: 'StrategyKing', eloRating: 1850, wins: 95, losses: 30, captures: 750 },
      { id: 'bot_4', username: 'DiceMaster', eloRating: 1420, wins: 60, losses: 40, captures: 500 },
      { id: 'bot_5', username: 'ProPlayer_99', eloRating: 950, wins: 45, losses: 35, captures: 320 },
      { id: 'bot_6', username: 'GoldHunter', eloRating: 720, wins: 30, losses: 25, captures: 210 },
      { id: 'bot_7', username: 'SilverSurfer', eloRating: 350, wins: 15, losses: 15, captures: 100 },
      { id: 'bot_8', username: 'NewbieLuck', eloRating: 120, wins: 5, losses: 8, captures: 45 },
    ];

    if (user.email === 'master@sapiens.com') {
      testPlayers.push({
        id: user.uid,
        username: user.displayName || 'Sapiens_Master',
        eloRating: 3500,
        wins: 999,
        losses: 0,
        captures: 5000
      });
    }

    try {
      for (const player of testPlayers) {
        const rankingRef = doc(firestore, 'player_rankings', player.id);
        const data = {
          playerId: player.id,
          username: player.username,
          eloRating: player.eloRating,
          wins: player.wins,
          losses: player.losses,
          draws: 5,
          gamesPlayed: player.wins + player.losses + 5,
          totalCaptures: player.captures,
          lastUpdated: serverTimestamp(),
        };
        await setDoc(rankingRef, data, { merge: true });
      }

      toast({
        title: "Arena Sincronizada",
        description: "Dados de elite carregados no ranking global.",
      });
    } catch (e: any) {
      toast({ 
        variant: "destructive", 
        title: "Erro de Permissão", 
        description: "Não foi possível gravar os dados." 
      });
    }
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
        <h2 className="font-headline font-bold text-sm uppercase tracking-tight flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />
          Ranking Global
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-primary"
          onClick={seedTestData}
          title="Atualizar Dados de Ranking"
        >
          <FlaskConical size={14} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-0">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center gap-2">
              <Loader2 className="animate-spin text-primary" size={24} />
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Lendo Ranking...</span>
            </div>
          ) : !rankings || rankings.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <p className="text-xs text-muted-foreground font-medium">Nenhum dado encontrado no ranking.</p>
              <Button variant="outline" size="sm" onClick={seedTestData} className="gap-2 text-[10px] font-bold uppercase">
                <FlaskConical size={12} /> Popular Ranking
              </Button>
            </div>
          ) : (
            rankings.map((player: any, i) => {
              const div = getDivision(player.eloRating);
              const isMaster = player.eloRating >= 2000;
              
              return (
                <div 
                  key={player.id}
                  className={cn(
                    "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors border-b last:border-0",
                    i === 0 && "bg-yellow-500/5",
                    player.id === user?.uid && "bg-primary/5 ring-1 ring-inset ring-primary/20"
                  )}
                >
                  <div className="w-6 text-center font-black text-muted-foreground italic">
                    {i === 0 ? <Trophy className="text-yellow-500 mx-auto" size={18} /> : i + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate text-sm flex items-center gap-1">
                        {player.username || 'Anônimo'}
                        {isMaster && <Crown size={12} className="text-yellow-500" />}
                      </span>
                      <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded border bg-background", div.color)}>
                        {div.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      <span className="flex items-center gap-1"><Target size={10} /> {player.wins}V</span>
                      <span className="flex items-center gap-1"><Star size={10} /> {player.totalCaptures || 0} Capturas</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-primary tabular-nums leading-none">{player.eloRating}</div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase">Pontos</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}