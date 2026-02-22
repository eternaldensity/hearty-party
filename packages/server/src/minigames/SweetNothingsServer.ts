import type { MinigameDef, MinigameRanking, PlayerState, SweetNothingsTickState } from '@hearty-party/shared';
import {
  getMinigameDef,
  SWEET_NOTHINGS_QUOTES,
  CHARACTERS,
  SWEET_NOTHINGS_ROUND_COUNT,
  SWEET_NOTHINGS_ROUND_TIME_MS,
  SWEET_NOTHINGS_SPEED_BONUS_MS,
  SWEET_NOTHINGS_FAST_POINTS,
  SWEET_NOTHINGS_CORRECT_POINTS,
} from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';

interface Round {
  quote: string;
  correctCharacterId: string;
  options: string[];
  answered: Set<string>;
  roundStartTime: number;
}

export class SweetNothingsServer implements MinigameServer {
  readonly def: MinigameDef = getMinigameDef('sweet_nothings')!;

  private scores = new Map<string, number>();
  private playerIds: string[] = [];
  private rounds: Round[] = [];
  private currentRound = 0;
  private roundStartTime = 0;

  init(players: PlayerState[]): void {
    this.playerIds = players.map((p) => p.id);
    for (const id of this.playerIds) {
      this.scores.set(id, 0);
    }

    const shuffled = [...SWEET_NOTHINGS_QUOTES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < SWEET_NOTHINGS_ROUND_COUNT; i++) {
      const q = shuffled[i % shuffled.length];
      this.rounds.push({
        quote: q.quote,
        correctCharacterId: q.correctCharacterId,
        options: q.options,
        answered: new Set(),
        roundStartTime: 0,
      });
    }
    this.roundStartTime = Date.now();
    this.rounds[0].roundStartTime = Date.now();
  }

  tick(timeRemaining: number): unknown | null {
    if (this.currentRound >= SWEET_NOTHINGS_ROUND_COUNT) return null;
    if (timeRemaining <= 0) return null;

    const now = Date.now();
    const roundElapsed = now - this.roundStartTime;
    const round = this.rounds[this.currentRound];

    // Auto-advance if round time expired or all players answered
    const allAnswered = round.answered.size >= this.playerIds.length;
    if (allAnswered || roundElapsed >= SWEET_NOTHINGS_ROUND_TIME_MS) {
      this.currentRound++;
      this.roundStartTime = Date.now();
      if (this.currentRound >= SWEET_NOTHINGS_ROUND_COUNT) return null;
      this.rounds[this.currentRound].roundStartTime = Date.now();
    }

    const current = this.rounds[this.currentRound];
    const isRoundOver = current.answered.size >= this.playerIds.length;
    const state: SweetNothingsTickState = {
      roundIndex: this.currentRound,
      totalRounds: SWEET_NOTHINGS_ROUND_COUNT,
      quote: current.quote,
      options: current.options.map((charId) => {
        const char = CHARACTERS.find((c) => c.id === charId);
        return { characterId: charId, characterName: char?.name ?? charId };
      }),
      roundAnswered: isRoundOver,
      correctCharacterId: isRoundOver ? current.correctCharacterId : null,
      scores: Object.fromEntries(this.scores),
    };
    return state;
  }

  handleInput(): void {
    // Sweet Nothings uses submit, not input
  }

  handleSubmit(playerId: string, result: unknown): void {
    if (this.currentRound >= SWEET_NOTHINGS_ROUND_COUNT) return;

    const { characterId } = result as { characterId: string };
    const round = this.rounds[this.currentRound];

    if (round.answered.has(playerId)) return;
    round.answered.add(playerId);

    if (characterId === round.correctCharacterId) {
      const elapsed = Date.now() - round.roundStartTime;
      const points = elapsed <= SWEET_NOTHINGS_SPEED_BONUS_MS
        ? SWEET_NOTHINGS_FAST_POINTS
        : SWEET_NOTHINGS_CORRECT_POINTS;
      const current = this.scores.get(playerId) ?? 0;
      this.scores.set(playerId, current + points);
    }
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
    this.rounds = [];
    this.scores.clear();
  }
}
