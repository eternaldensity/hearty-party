import { useCallback, useEffect, useState } from 'react';
import type { RoomState } from '@hearty-party/shared';
import type { GameSocket } from './useSocket.js';

export type Screen = 'landing' | 'lobby' | 'board' | 'minigame' | 'results' | 'game_over';

interface UseGameStateReturn {
  screen: Screen;
  roomState: RoomState | null;
  playerId: string | null;
  error: string | null;
  clearError: () => void;
}

export function useGameState(socket: GameSocket | null): UseGameStateReturn {
  const [screen, setScreen] = useState<Screen>('landing');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!socket) return;

    const onCreated = ({ gameCode, roomState }: { gameCode: string; roomState: RoomState }) => {
      setRoomState(roomState);
      setPlayerId(socket.id ?? null);
      setScreen('lobby');
      setError(null);
    };

    const onJoined = ({ roomState, playerId }: { roomState: RoomState; playerId: string }) => {
      setRoomState(roomState);
      setPlayerId(playerId);
      setScreen('lobby');
      setError(null);
    };

    const onPlayerJoined = ({ player }: { player: RoomState['players'][number] }) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        const exists = prev.players.some((p) => p.id === player.id);
        return {
          ...prev,
          players: exists
            ? prev.players.map((p) => (p.id === player.id ? player : p))
            : [...prev.players, player],
        };
      });
    };

    const onPlayerLeft = ({ playerId: leftId }: { playerId: string }) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.filter((p) => p.id !== leftId),
        };
      });
    };

    const onError = ({ message }: { message: string }) => {
      setError(message);
    };

    socket.on('room:created', onCreated);
    socket.on('room:joined', onJoined);
    socket.on('room:player-joined', onPlayerJoined);
    socket.on('room:player-left', onPlayerLeft);
    socket.on('room:error', onError);

    return () => {
      socket.off('room:created', onCreated);
      socket.off('room:joined', onJoined);
      socket.off('room:player-joined', onPlayerJoined);
      socket.off('room:player-left', onPlayerLeft);
      socket.off('room:error', onError);
    };
  }, [socket]);

  return { screen, roomState, playerId, error, clearError };
}
