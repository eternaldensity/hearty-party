import { useCallback, useEffect, useState } from 'react';
import type { GameState, GamePhase, RoomState } from '@hearty-party/shared';
import type { GameSocket } from './useSocket.js';

export type Screen = 'landing' | 'lobby' | 'board' | 'minigame' | 'results' | 'game_over';

export interface ConfessionData {
  characterId: string;
  characterName: string;
}

interface UseGameStateReturn {
  screen: Screen;
  roomState: RoomState | null;
  gameState: GameState | null;
  playerId: string | null;
  error: string | null;
  confession: ConfessionData | null;
  clearError: () => void;
}

const PHASE_TO_SCREEN: Partial<Record<GamePhase, Screen>> = {
  lobby: 'lobby',
  game_start: 'board',
  round_start: 'board',
  dice_phase: 'board',
  move_phase: 'board',
  space_phase: 'board',
  minigame_intro: 'board',
  minigame_play: 'minigame',
  minigame_results: 'results',
  round_end: 'board',
  game_over: 'game_over',
};

export function useGameState(socket: GameSocket | null): UseGameStateReturn {
  const [screen, setScreen] = useState<Screen>('landing');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confession, setConfession] = useState<ConfessionData | null>(null);

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

    const onStateUpdate = ({ phase, roundNumber, gameState: gs }: { phase: GamePhase; roundNumber: number; gameState: GameState }) => {
      setGameState(gs);
      const newScreen = PHASE_TO_SCREEN[phase];
      if (newScreen) {
        setScreen(newScreen);
      }
    };

    const onGameOver = ({ finalStandings, winnerId, confession: conf }: { finalStandings: Array<{ playerId: string; totalAffection: number; rank: number }>; winnerId: string; confession?: ConfessionData }) => {
      setConfession(conf ?? null);
      setScreen('game_over');
    };

    socket.on('room:created', onCreated);
    socket.on('room:joined', onJoined);
    socket.on('room:player-joined', onPlayerJoined);
    socket.on('room:player-left', onPlayerLeft);
    socket.on('room:error', onError);
    socket.on('game:state-update', onStateUpdate);
    socket.on('game:over', onGameOver);

    return () => {
      socket.off('room:created', onCreated);
      socket.off('room:joined', onJoined);
      socket.off('room:player-joined', onPlayerJoined);
      socket.off('room:player-left', onPlayerLeft);
      socket.off('room:error', onError);
      socket.off('game:state-update', onStateUpdate);
      socket.off('game:over', onGameOver);
    };
  }, [socket]);

  return { screen, roomState, gameState, playerId, error, confession, clearError };
}
