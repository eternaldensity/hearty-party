/**
 * Socket.IO event type contracts.
 *
 * Each interface defines the payload shape for events flowing
 * between client and server.
 */

import type {
  DialoguePrompt,
  GamePhase,
  GameState,
  ItemDef,
  ItemId,
  GameSettings,
  MinigameDef,
  MinigameRanking,
  MinigameReward,
  PlayerState,
  RoomState,
} from './types.js';

// ── Client → Server ──

export interface ClientEvents {
  'room:create': (data: { playerName: string; settings: GameSettings }) => void;
  'room:join': (data: { gameCode: string; playerName: string }) => void;
  'room:leave': () => void;
  'game:start': () => void;
  'game:roll-dice': () => void;
  'game:choose-path': (data: { pathIndex: number }) => void;
  'game:dialogue-choice': (data: { choiceIndex: number }) => void;
  'game:shop-buy': (data: { itemId: ItemId; targetCharacterId?: string }) => void;
  'game:shop-close': () => void;
  'game:use-item': (data: { itemId: ItemId; targetPlayerId?: string; targetCharacterId?: string }) => void;
  'minigame:input': (data: { type: string; data: unknown }) => void;
  'minigame:submit': (data: { result: unknown }) => void;
}

// ── Server → Client ──

export interface ServerEvents {
  'room:created': (data: { gameCode: string; roomState: RoomState }) => void;
  'room:joined': (data: { roomState: RoomState; playerId: string }) => void;
  'room:player-joined': (data: { player: { id: string; name: string; isHost: boolean; connected: boolean } }) => void;
  'room:player-left': (data: { playerId: string }) => void;
  'room:error': (data: { message: string }) => void;
  'room:settings-updated': (data: { settings: GameSettings }) => void;

  'game:state-update': (data: { phase: GamePhase; roundNumber: number; gameState: GameState }) => void;
  'game:dice-results': (data: { rolls: Array<{ playerId: string; value: number }> }) => void;
  'game:player-moving': (data: { playerId: string; path: number[]; finalSpace: number }) => void;
  'game:space-event': (data: { playerId: string; spaceType: string; eventData: unknown }) => void;
  'game:dialogue': (data: { prompt: DialoguePrompt }) => void;
  'game:shop-open': (data: { items: ItemDef[]; playerTokens: number }) => void;

  'minigame:start': (data: { minigame: MinigameDef; duration: number }) => void;
  'minigame:tick': (data: { timeRemaining: number; sharedState: unknown }) => void;
  'minigame:end': (data: { rankings: MinigameRanking[]; rewards: MinigameReward[] }) => void;

  'game:round-end': (data: { standings: Array<{ playerId: string; totalAffection: number }>; roundNumber: number }) => void;
  'game:over': (data: { finalStandings: Array<{ playerId: string; totalAffection: number; rank: number }>; winnerId: string; confession?: { characterId: string; characterName: string } }) => void;
}
