import type { MinigameDef, MinigameRanking, PlayerState } from '@hearty-party/shared';
import { getMinigameDef, GIFT_WRAP_TAPS_TO_WIN } from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';

export class GiftWrapRaceServer implements MinigameServer {
  readonly def: MinigameDef = getMinigameDef('gift_wrap_race')!;

  private tapCounts = new Map<string, number>();
  private finished = new Map<string, boolean>();
  private playerIds: string[] = [];
  private gameEnded = false;

  init(players: PlayerState[]): void {
    this.playerIds = players.map((p) => p.id);
    for (const id of this.playerIds) {
      this.tapCounts.set(id, 0);
      this.finished.set(id, false);
    }
    this.gameEnded = false;
  }

  tick(timeRemaining: number): unknown | null {
    if (timeRemaining <= 0 || this.gameEnded) return null;

    const progress: Record<string, number> = {};
    for (const [id, taps] of this.tapCounts) {
      progress[id] = Math.min(100, Math.round((taps / GIFT_WRAP_TAPS_TO_WIN) * 100));
    }

    return {
      progress,
      finished: Object.fromEntries(this.finished),
      tapCounts: Object.fromEntries(this.tapCounts),
    };
  }

  handleInput(playerId: string, inputType: string): void {
    if (inputType !== 'tap') return;
    if (this.finished.get(playerId)) return;

    const current = (this.tapCounts.get(playerId) ?? 0) + 1;
    this.tapCounts.set(playerId, current);

    if (current >= GIFT_WRAP_TAPS_TO_WIN) {
      this.finished.set(playerId, true);

      // End game when first player finishes
      if (!this.gameEnded) {
        this.gameEnded = true;
      }
    }
  }

  handleSubmit(): void {
    // Gift Wrap Race uses input, not submit
  }

  getRankings(): MinigameRanking[] {
    const entries = Array.from(this.tapCounts.entries())
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((a, b) => b.score - a.score);

    return entries.map((e, i) => ({
      playerId: e.playerId,
      rank: i + 1,
      score: e.score,
    }));
  }

  cleanup(): void {
    this.tapCounts.clear();
    this.finished.clear();
  }
}
