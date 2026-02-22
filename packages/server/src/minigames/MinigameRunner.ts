import type { Server } from 'socket.io';
import type {
  ClientEvents,
  ServerEvents,
  GamePhase,
  MinigameRanking,
  MinigameReward,
  PlayerState,
} from '@hearty-party/shared';
import {
  MINIGAME_INTRO_MS,
  MINIGAME_RESULTS_MS,
  AFFECTION_MINIGAME_1ST,
  AFFECTION_MINIGAME_2ND,
  AFFECTION_MINIGAME_3RD,
  AFFECTION_MINIGAME_OTHER,
  TOKENS_MINIGAME_1ST,
  TOKENS_MINIGAME_2ND,
  TOKENS_MINIGAME_3RD,
  TOKENS_MINIGAME_OTHER,
} from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';
import { createMinigame } from './registry.js';

type TypedServer = Server<ClientEvents, ServerEvents>;

const TICK_INTERVAL_MS = 500;

export class MinigameRunner {
  private io: TypedServer;
  private roomCode: string;
  private game: MinigameServer | null = null;
  private inputHandler: ((playerId: string, type: string, data: unknown) => void) | null = null;
  private submitHandler: ((playerId: string, result: unknown) => void) | null = null;

  constructor(io: TypedServer, roomCode: string) {
    this.io = io;
    this.roomCode = roomCode;
  }

  /**
   * Run a complete minigame cycle (intro → play → results).
   * Returns rankings and rewards for the GSM to apply.
   */
  async run(
    players: PlayerState[],
    setPhase: (phase: GamePhase) => void,
    broadcastState: () => void,
  ): Promise<{ rankings: MinigameRanking[]; rewards: MinigameReward[] }> {
    const connectedPlayers = players.filter((p) => p.connected);

    const game = createMinigame(connectedPlayers.length);
    this.game = game;

    // ── INTRO ──
    setPhase('minigame_intro');
    broadcastState();
    this.io.to(this.roomCode).emit('minigame:start', {
      minigame: game.def,
      duration: game.def.duration,
    });
    await this.delay(MINIGAME_INTRO_MS);

    // ── PLAY ──
    setPhase('minigame_play');
    broadcastState();

    game.init(connectedPlayers);

    this.inputHandler = (playerId, type, data) => game.handleInput(playerId, type, data);
    this.submitHandler = (playerId, result) => game.handleSubmit(playerId, result);

    const duration = game.def.duration;
    const startTime = Date.now();
    await new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        const state = game.tick(remaining);

        if (state === null || remaining <= 0) {
          clearInterval(interval);
          resolve();
          return;
        }

        this.io.to(this.roomCode).emit('minigame:tick', {
          timeRemaining: remaining,
          sharedState: state,
        });
      }, TICK_INTERVAL_MS);
    });

    this.inputHandler = null;
    this.submitHandler = null;

    // ── RESULTS ──
    setPhase('minigame_results');
    broadcastState();

    const rankings = game.getRankings();
    const rewards = this.calculateRewards(rankings);

    this.io.to(this.roomCode).emit('minigame:end', { rankings, rewards });
    game.cleanup();
    this.game = null;

    await this.delay(MINIGAME_RESULTS_MS);

    return { rankings, rewards };
  }

  routeInput(playerId: string, type: string, data: unknown): void {
    this.inputHandler?.(playerId, type, data);
  }

  routeSubmit(playerId: string, result: unknown): void {
    this.submitHandler?.(playerId, result);
  }

  get currentMinigameId(): string | null {
    return this.game?.def.id ?? null;
  }

  private calculateRewards(rankings: MinigameRanking[]): MinigameReward[] {
    return rankings.map((r) => {
      let affection: number;
      let charmTokens: number;
      switch (r.rank) {
        case 1: affection = AFFECTION_MINIGAME_1ST; charmTokens = TOKENS_MINIGAME_1ST; break;
        case 2: affection = AFFECTION_MINIGAME_2ND; charmTokens = TOKENS_MINIGAME_2ND; break;
        case 3: affection = AFFECTION_MINIGAME_3RD; charmTokens = TOKENS_MINIGAME_3RD; break;
        default: affection = AFFECTION_MINIGAME_OTHER; charmTokens = TOKENS_MINIGAME_OTHER; break;
      }
      return { playerId: r.playerId, affection, charmTokens };
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
