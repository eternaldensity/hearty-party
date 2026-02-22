import type { MinigameDef, MinigameRanking, PlayerState, DanceDirection } from '@hearty-party/shared';
import {
  getMinigameDef,
  DANCE_FLOOR_BEAT_COUNT,
  DANCE_FLOOR_BEAT_WINDOW_MS,
  DANCE_FLOOR_BEAT_GAP_MS,
  DANCE_FLOOR_HIT_POINTS,
  DANCE_FLOOR_COMBO_BONUS,
} from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';

const DIRECTIONS: DanceDirection[] = ['up', 'down', 'left', 'right'];

export class DanceFloorServer implements MinigameServer {
  readonly def: MinigameDef = getMinigameDef('dance_floor')!;

  private scores = new Map<string, number>();
  private combos = new Map<string, number>();
  private playerIds: string[] = [];
  private beats: DanceDirection[] = [];
  private beatIndex = 0;
  private beatStartTime = 0;
  private beatActive = false;
  private answeredThisBeat = new Set<string>();
  private started = false;

  init(players: PlayerState[]): void {
    this.playerIds = players.map((p) => p.id);
    for (const id of this.playerIds) {
      this.scores.set(id, 0);
      this.combos.set(id, 0);
    }

    // Pre-generate the beat sequence
    for (let i = 0; i < DANCE_FLOOR_BEAT_COUNT; i++) {
      this.beats.push(DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]);
    }

    this.beatIndex = 0;
    this.started = false;
  }

  tick(timeRemaining: number): unknown | null {
    if (timeRemaining <= 0) return null;
    if (this.beatIndex >= DANCE_FLOOR_BEAT_COUNT) return null;

    const now = Date.now();

    if (!this.started) {
      this.started = true;
      this.beatStartTime = now;
      this.beatActive = true;
      this.answeredThisBeat.clear();
    }

    const elapsed = now - this.beatStartTime;

    if (this.beatActive && elapsed >= DANCE_FLOOR_BEAT_WINDOW_MS) {
      // Beat window closed — players who didn't answer lose combo
      for (const id of this.playerIds) {
        if (!this.answeredThisBeat.has(id)) {
          this.combos.set(id, 0);
        }
      }
      this.beatActive = false;
      this.beatStartTime = now;
    } else if (!this.beatActive && elapsed >= DANCE_FLOOR_BEAT_GAP_MS) {
      // Gap over — advance to next beat
      this.beatIndex++;
      if (this.beatIndex >= DANCE_FLOOR_BEAT_COUNT) return null;
      this.beatActive = true;
      this.beatStartTime = now;
      this.answeredThisBeat.clear();
    }

    return {
      currentDirection: this.beats[this.beatIndex],
      beatIndex: this.beatIndex,
      totalBeats: DANCE_FLOOR_BEAT_COUNT,
      beatActive: this.beatActive,
      scores: Object.fromEntries(this.scores),
      combos: Object.fromEntries(this.combos),
    };
  }

  handleInput(playerId: string, inputType: string, data: unknown): void {
    if (inputType !== 'dance') return;
    if (!this.beatActive) return;
    if (this.answeredThisBeat.has(playerId)) return;

    const { direction } = data as { direction: DanceDirection };
    this.answeredThisBeat.add(playerId);

    if (direction === this.beats[this.beatIndex]) {
      const combo = (this.combos.get(playerId) ?? 0) + 1;
      this.combos.set(playerId, combo);
      const points = DANCE_FLOOR_HIT_POINTS + (combo >= 3 ? DANCE_FLOOR_COMBO_BONUS : 0);
      const current = this.scores.get(playerId) ?? 0;
      this.scores.set(playerId, current + points);
    } else {
      this.combos.set(playerId, 0);
    }
  }

  handleSubmit(): void {
    // Dance Floor uses input, not submit
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
    this.scores.clear();
    this.combos.clear();
    this.beats = [];
    this.answeredThisBeat.clear();
  }
}
