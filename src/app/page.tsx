"use client";
export const dynamic = "force-static";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";
import { createInitialBoard } from "@/lib/game/core-engine";
import { Button } from "@/components/ui/button";
import { Loader2, Play, Trophy, Users, Shield, Bot } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const router = useRouter();
  const [isFinding, setIsFinding] = useState(false);

  const heroImage = PlaceHolderImages.find(img => img.id === "hero-game");

  const startMatchmaking = async () => {
    setIsFinding(true);
    try {
      // 1️⃣ Garantir autenticação
      let user = auth.currentUser;
      if (!user) {
        const cred = await signInAnonymously(auth);
        user = cred.user;
      }

      // 2️⃣ Buscar jogos esperando
      const gamesRef = collection(db, "games");
      const q = query(
        gamesRef,
        where("status", "==", "waiting"),
        where("players.black", "==", null)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Entrar como preto
        const gameDoc = querySnapshot.docs[0];
        const gameId = gameDoc.id;

        await updateDoc(doc(db, "games", gameId), {
          "players.black": user.uid,
          "usernames.black": `Jogador_${user.uid.slice(0, 4)}`,
          status: "playing",
          startedAt: serverTimestamp(),
        });

        window.location.href = `/play/${gameId}`;
      } else {
        // Criar novo jogo como branco
        const newGame = {
          players: {
            white: user.uid,
            black: null,
          },
          usernames: {
            white: `Jogador_${user.uid.slice(0, 4)}`,
            black: "",
          },
          board: createInitialBoard(),
          turn: "white",
          status: "waiting",
          clocks: {
            white: 600,
            black: 600
          },
          history: [],
          winner: null,
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(gamesRef, newGame);
        window.location.href = `/play-ai?gameId=${docRef.id}`;
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro de Pareamento",
        description: "Falha ao conectar aos servidores.",
        variant: "destructive",
      });
      setIsFinding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center">
      {/* ================= HERO ================= */}
      <section className="w-full max-w-6xl px-6 py-12 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Trophy className="h-4 w-4" />
            Nova Temporada Disponível
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Sapiens <span className="text-primary">Multiplayer</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-lg mx-auto md:mx-0">
            Aqui todos têm lugar no tabuleiro. Estratégia ao vivo, ambiente seguro e evolução a cada partida.
          </p>

          {/* ================= BOTÕES ================= */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            
            {/* ONLINE */}
            <Button
              size="lg"
              onClick={startMatchmaking}
              disabled={isFinding}
              className="h-14 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isFinding ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Buscando Partida...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Jogar Online
                </>
              )}
            </Button>

            {/* IA OFFLINE */}
            <Button
              variant="outline"
              size="lg"
              className="h-14 px-8 text-lg rounded-xl"
              onClick={() => {
                window.location.href = "/play-ai";
              }}
            >
              <Bot className="mr-2 h-5 w-5" />
              Jogar contra IA
            </Button>
            

            {/* TUTORIAL */}
            <Button
              variant="ghost"
              size="lg"
              className="h-14 px-8 text-lg rounded-xl"
            >
              Tutorial
            </Button>

          </div>
        </div>

        {/* HERO IMAGE (opcional se quiser usar) */}
        {heroImage?.imageUrl && (
          <div className="relative w-full h-[400px] hidden md:block">
            <Image
              src={heroImage.imageUrl}
              alt="Sapiens Game"
              fill
              className="object-contain"
            />
          </div>
        )}
      </section>

      {/* ================= FEATURES ================= */}
      <section className="w-full bg-white py-16">
        <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-3 gap-8">
          
          <div className="p-6 rounded-2xl bg-background border border-black/5 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">
              Multijogador em Tempo Real
            </h3>
            <p className="text-sm text-muted-foreground">
              Desafie jogadores de todo o mundo com sincronização via Firestore.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-background border border-black/5 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Play className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">
              Profundidade Estratégica
            </h3>
            <p className="text-sm text-muted-foreground">
              Movimentos únicos baseados em valor. Domine as mecânicas minimalistas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-background border border-black/5 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">
              Seguro e Justo
            </h3>
            <p className="text-sm text-muted-foreground">
              Validação de movimentos garante que cada partida siga as regras.
            </p>
          </div>

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="w-full max-w-6xl py-12 px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
        <p>© 2026 Jogo Sapiens. Todos os direitos reservados.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-primary transition-colors">
            Termos
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Privacidade
          </a>
          <a href="#" className="hover:text-primary transition-colors">
            Suporte
          </a>
        </div>
      </footer>
    </div>
  );
}
