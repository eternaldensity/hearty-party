import type { MinigameDef, MinigameRanking, PlayerState, HeartCatcherHeart } from '@hearty-party/shared';
import {
  getMinigameDef,
  CHARACTERS,
  HEART_CATCHER_SPAWN_INTERVAL_MS,
  HEART_CATCHER_HEART_LIFETIME_MS,
} from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';

export class HeartCatcherServer implements MinigameServer {
  readonly def: MinigameDef = getMinigameDef('heart_catcher')!;

  private hearts: HeartCatcherHeart[] = [];
  private scores = new Map<string, number>();
  private playerIds: string[] = [];
  private heartCounter = 0;
  private lastSpawnTime = 0;

  init(players: PlayerState[]): void {
    this.playerIds = players.map((p) => p.id);
    for (const id of this.playerIds) {
      this.scores.set(id, 0);
    }
    this.lastSpawnTime = Date.now();
  }

  tick(timeRemaining: number): unknown | null {
    if (timeRemaining <= 0) return null;

    const now = Date.now();

    // Spawn new hearts at intervals
    if (now - this.lastSpawnTime >= HEART_CATCHER_SPAWN_INTERVAL_MS) {
      this.spawnHeart(now);
      this.lastSpawnTime = now;
    }

    // Expire old hearts
    this.hearts = this.hearts.filter(
      (h) => h.active && now - h.spawnedAt < HEART_CATCHER_HEART_LIFETIME_MS,
    );

    // Update Y positions based on elapsed time (falling)
    for (const heart of this.hearts) {
      const elapsed = now - heart.spawnedAt;
      heart.y = (elapsed / HEART_CATCHER_HEART_LIFETIME_MS) * 100;
    }

    return {
      hearts: this.hearts,
      scores: Object.fromEntries(this.scores),
    };
  }

  handleInput(playerId: string, inputType: string, data: unknown): void {
    if (inputType !== 'catch') return;
    const { heartId } = data as { heartId: string };

    const heart = this.hearts.find((h) => h.id === heartId && h.active);
    if (!heart) return;

    const now = Date.now();
    if (now - heart.spawnedAt > HEART_CATCHER_HEART_LIFETIME_MS) return;

    heart.active = false;
    const current = this.scores.get(playerId) ?? 0;
    this.scores.set(playerId, current + 1);
  }

  handleSubmit(): void {
    // Heart Catcher uses input, not submit
  }

  getRankings(): MinigameRanking[] {
    const entries = Array.from(this.scores.entries())
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score);

    return entries.map((e, i) => ({
      playerId: e.playerId,
      rank: i + 1,
      score: e.score,
    }));
  }

  cleanup(): void {
    this.hearts = [];
    this.scores.clear();
  }

  private spawnHeart(now: number): void {
    const charIndex = this.heartCounter % CHARACTERS.length;
    const character = CHARACTERS[charIndex];
    this.hearts.push({
      id: `h_${this.heartCounter++}`,
      characterId: character.id,
      x: Math.random() * 80 + 10, // 10-90% across
      y: 0,
      spawnedAt: now,
      active: true,
    });
  }
}
