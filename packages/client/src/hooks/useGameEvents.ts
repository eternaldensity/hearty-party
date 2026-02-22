import { useEffect, useRef, useState } from 'react';
import type {
  DialoguePrompt,
  GamePhase,
  ItemDef,
  MinigameDef,
  MinigameRanking,
  MinigameReward,
} from '@hearty-party/shared';
import type { GameSocket } from './useSocket.js';

// ── Exported data types ──

export interface MinigameStartData {
  minigame: MinigameDef;
  duration: number;
}

export interface MinigameEndData {
  rankings: MinigameRanking[];
  rewards: MinigameReward[];
}

export interface MinigameTickData {
  timeRemaining: number;
  sharedState: unknown;
}

export interface MovingData {
  playerId: string;
  path: number[];
  finalSpace: number;
}

export interface ShopData {
  items: ItemDef[];
  playerTokens: number;
}

export interface SpaceEvent {
  id: number;
  playerId: string;
  spaceType: string;
  eventData: unknown;
}

export interface GameEvents {
  minigameStartData: MinigameStartData | null;
  minigameEndData: MinigameEndData | null;
  minigameTick: MinigameTickData | null;
  movingData: MovingData | null;
  dialoguePrompt: DialoguePrompt | null;
  shopData: ShopData | null;
  spaceEvents: SpaceEvent[];
  clearDialogue: () => void;
  clearShop: () => void;
}

/**
 * Centralized game event listener hook.
 *
 * Registers socket listeners for ALL game events once (always mounted),
 * preventing race conditions from screen mount/unmount cycles.
 * Phase-based cleanup ensures stale data is cleared on transitions.
 */
export function useGameEvents(socket: GameSocket | null, phase: GamePhase | undefined): GameEvents {
  const [minigameStartData, setMinigameStartData] = useState<MinigameStartData | null>(null);
  const [minigameEndData, setMinigameEndData] = useState<MinigameEndData | null>(null);
  const [minigameTick, setMinigameTick] = useState<MinigameTickData | null>(null);
  const [movingData, setMovingData] = useState<MovingData | null>(null);
  const [dialoguePrompt, setDialoguePrompt] = useState<DialoguePrompt | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [spaceEvents, setSpaceEvents] = useState<SpaceEvent[]>([]);
  const spaceEventCounter = useRef(0);

  // ── Register all listeners once ──
  useEffect(() => {
    if (!socket) return;

    const onMinigameStart = (data: MinigameStartData) => {
      setMinigameStartData(data);
    };

    const onMinigameEnd = (data: MinigameEndData) => {
      setMinigameEndData(data);
    };

    const onMinigameTick = (data: MinigameTickData) => {
      setMinigameTick(data);
    };

    const onPlayerMoving = (data: MovingData) => {
      setMovingData(data);
    };

    const onDialogue = ({ prompt }: { prompt: DialoguePrompt }) => {
      setDialoguePrompt(prompt);
    };

    const onShopOpen = (data: ShopData) => {
      setShopData(data);
    };

    const onSpaceEvent = (raw: { playerId: string; spaceType: string; eventData: unknown }) => {
      const id = spaceEventCounter.current++;
      setSpaceEvents((prev) => [...prev.slice(-4), { ...raw, id }]);
      setTimeout(() => {
        setSpaceEvents((prev) => prev.filter((e) => e.id !== id));
      }, 3000);
    };

    socket.on('minigame:start', onMinigameStart);
    socket.on('minigame:end', onMinigameEnd);
    socket.on('minigame:tick', onMinigameTick);
    socket.on('game:player-moving', onPlayerMoving);
    socket.on('game:dialogue', onDialogue);
    socket.on('game:shop-open', onShopOpen);
    socket.on('game:space-event', onSpaceEvent);

    return () => {
      socket.off('minigame:start', onMinigameStart);
      socket.off('minigame:end', onMinigameEnd);
      socket.off('minigame:tick', onMinigameTick);
      socket.off('game:player-moving', onPlayerMoving);
      socket.off('game:dialogue', onDialogue);
      socket.off('game:shop-open', onShopOpen);
      socket.off('game:space-event', onSpaceEvent);
    };
  }, [socket]);

  // ── Phase-based cleanup ──
  useEffect(() => {
    if (phase !== 'minigame_intro' && phase !== 'minigame_play') {
      setMinigameStartData(null);
    }
    if (phase !== 'minigame_play') {
      setMinigameTick(null);
    }
    if (phase !== 'minigame_results') {
      setMinigameEndData(null);
    }
    if (phase !== 'move_phase') {
      setMovingData(null);
    }
    if (phase !== 'space_phase') {
      setDialoguePrompt(null);
      setShopData(null);
    }
  }, [phase]);

  const clearDialogue = () => setDialoguePrompt(null);
  const clearShop = () => setShopData(null);

  return {
    minigameStartData,
    minigameEndData,
    minigameTick,
    movingData,
    dialoguePrompt,
    shopData,
    spaceEvents,
    clearDialogue,
    clearShop,
  };
}
