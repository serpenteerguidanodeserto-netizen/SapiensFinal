
"use client"

import React, { useState } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, getDocs, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Plus, Users, Shield, Globe, Loader2, Search, Trash2, Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { serverTimestamp } from 'firebase/firestore';

interface LobbyProps {
  onJoinRoom: (roomId: string) => void;
}

export function Lobby({ onJoinRoom }: LobbyProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: '',
    type: 'public',
    timeControl: 'rapid'
  });

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null;
    return query(
      collection(firestore, 'game_rooms'),
      where('status', '==', 'waiting'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user, isUserLoading]);

  const { data: rooms, isLoading: isCollectionLoading } = useCollection(roomsQuery);
  const isLoading = isUserLoading || isCollectionLoading;

  const isMaster = user?.email === 'master@sapiens.com';

  const handleCopyInvite = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : "https://studio-6399144489-33e7d.web.app";
    navigator.clipboard.writeText(origin);
    setCopied(true);
    toast({ title: "Link Copiado!", description: "Envie este link público para seu amigo entrar na arena." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearRooms = async () => {
    if (!firestore || !isMaster) return;
    setIsClearing(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, 'game_rooms'));
      const batch = writeBatch(firestore);
      querySnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      toast({ title: "Arena Limpa", description: "Todas as salas foram removidas." });
    } catch (e: any) {
      toast({ title: "Erro ao limpar", description: "Verifique suas permissões.", variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCreateRoom = () => {
    if (!user || !firestore) return;
    if (!newRoom.name) {
      toast({ title: "Nome Inválido", description: "Dê um nome à sua sala.", variant: "destructive" });
      return;
    }

    const roomsRef = collection(firestore, 'game_rooms');
    const newRoomRef = doc(roomsRef);
    const roomId = newRoomRef.id;

    setDocumentNonBlocking(newRoomRef, {
      ...newRoom,
      id: roomId,
      creatorId: user.uid,
      creatorUsername: user.displayName || 'Jogador',
      status: 'waiting',
      playerOneId: user.uid,
      playerOneUsername: user.displayName || 'Jogador',
      playerTwoId: null,
      playerTwoUsername: null,
      players: [
        {
          id: user.uid,
          name: user.displayName || "Jogador"
        }
      ],
      createdAt: serverTimestamp(),
      gameState: null
    }, { merge: true });

    setIsCreateModalOpen(false);
    onJoinRoom(roomId);
    toast({ title: "Sala Criada!", description: "Aguardando oponente." });
  };

  const handleJoin = (room: any) => {
    if (!user || !firestore) return;
    if (room.creatorId === user.uid) {
      onJoinRoom(room.id);
      return;
    }

    setIsJoining(room.id);
    const roomRef = doc(firestore, 'game_rooms', room.id);
    
    updateDocumentNonBlocking(roomRef, {
      playerTwoId: user.uid,
      playerTwoUsername: user.displayName || 'Desafiante',
      status: 'playing',
      players: [
        {
          id: room.creatorId,
          name: room.creatorUsername
        },
        {
          id: user.uid,
          name: user.displayName || "Jogador"
        }
      ]
    });

    onJoinRoom(room.id);
    setIsJoining(null);
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm flex flex-col h-[700px] overflow-hidden">
      <div className="p-6 border-b flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-black text-xl uppercase tracking-tight flex items-center gap-3">
            <Users className="text-primary" /> Lobby Global
          </h2>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 font-bold uppercase text-[10px] h-10 border-primary/20 hover:bg-primary/5 text-primary"
              onClick={handleCopyInvite}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              {copied ? 'Copiado' : 'Link de Convite'}
            </Button>

            {isMaster && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-muted-foreground hover:text-destructive"
                onClick={handleClearRooms}
                disabled={isClearing}
              >
                {isClearing ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
              </Button>
            )}

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 font-bold uppercase text-xs h-10" disabled={!user}>
                  <Plus size={16} /> Criar Sala
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-black uppercase italic tracking-tighter text-2xl">
                    Nova Sala
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roomName">Nome da Sala</Label>
                    <Input
                      id="roomName"
                      placeholder="Minha Arena Sapiens"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tipo</Label>
                      <Select onValueChange={(val) => setNewRoom({ ...newRoom, type: val as any })} defaultValue="public">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Pública</SelectItem>
                          <SelectItem value="private">Privada</SelectItem>
                          <SelectItem value="ranked">Rankeada</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Tempo</Label>
                      <Select onValueChange={(val) => setNewRoom({ ...newRoom, timeControl: val as any })} defaultValue="rapid">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blitz">Blitz (3m)</SelectItem>
                          <SelectItem value="rapid">Rápido (10m)</SelectItem>
                          <SelectItem value="classic">Clássico (30m)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateRoom} className="w-full font-bold uppercase">
                    Lançar Desafio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 grid grid-cols-1 gap-3">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-primary" size={32} />
              <p className="text-xs text-muted-foreground font-bold uppercase">Sincronizando...</p>
            </div>
          ) : !rooms || rooms.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-4 text-muted-foreground">
              <Globe className="opacity-20" size={64} />
              <p className="text-sm italic">Nenhuma sala disponível.</p>
            </div>
          ) : (
            rooms.map((room: any) => (
              <div key={room.id} className="group flex items-center justify-between p-4 bg-background/40 hover:bg-primary/5 border rounded-xl transition-all gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center border",
                    room.type === 'ranked' ? "bg-primary/10 border-primary/30" : "bg-muted border-border"
                  )}>
                    {room.type === 'ranked' ? <Shield size={20} className="text-primary" /> : <Users size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">{room.name}</h3>
                    <span className="text-[10px] font-black uppercase text-primary">{room.creatorUsername}</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="font-bold uppercase text-xs h-10 px-6" 
                  onClick={() => handleJoin(room)}
                  disabled={isJoining === room.id}
                >
                  {isJoining === room.id ? <Loader2 className="animate-spin" size={14} /> : 'Entrar'}
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
