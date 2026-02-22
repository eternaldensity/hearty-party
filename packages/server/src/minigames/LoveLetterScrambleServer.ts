import type { MinigameDef, MinigameRanking, PlayerState, ScrambleTickState } from '@hearty-party/shared';
import {
  getMinigameDef,
  SCRAMBLE_WORDS,
  scrambleWord,
  SCRAMBLE_ROUND_COUNT,
  SCRAMBLE_ROUND_TIME_MS,
  SCRAMBLE_FIRST_SOLVE_BONUS,
} from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';

interface Round {
  word: string;
  hint: string;
  scrambled: string;
  solved: boolean;
  solvedBy: string | null;
}

export class LoveLetterScrambleServer implements MinigameServer {
  readonly def: MinigameDef = getMinigameDef('love_letter_scramble')!;

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

    // Pick random words for each round (no repeats)
    const shuffled = [...SCRAMBLE_WORDS].sort(() => Math.random() - 0.5);
    for (let i = 0; i < SCRAMBLE_ROUND_COUNT; i++) {
      const entry = shuffled[i % shuffled.length];
      this.rounds.push({
        word: entry.word.toUpperCase(),
        hint: entry.hint,
        scrambled: scrambleWord(entry.word.toUpperCase()),
        solved: false,
        solvedBy: null,
      });
    }
    this.roundStartTime = Date.now();
  }

  tick(timeRemaining: number): unknown | null {
    if (this.currentRound >= SCRAMBLE_ROUND_COUNT) return null;
    if (timeRemaining <= 0) return null;

    const now = Date.now();
    const roundElapsed = now - this.roundStartTime;

    // Auto-advance round if time expires or solved
    const round = this.rounds[this.currentRound];
    if (round.solved || roundElapsed >= SCRAMBLE_ROUND_TIME_MS) {
      this.currentRound++;
      this.roundStartTime = Date.now();
      if (this.currentRound >= SCRAMBLE_ROUND_COUNT) return null;
    }

    const current = this.rounds[this.currentRound];
    const state: ScrambleTickState = {
      roundIndex: this.currentRound,
      totalRounds: SCRAMBLE_ROUND_COUNT,
      scrambledWord: current.scrambled,
      hint: current.hint,
      wordLength: current.word.length,
      roundSolved: current.solved,
      solvedBy: current.solvedBy,
      scores: Object.fromEntries(this.scores),
    };
    return state;
  }

  handleInput(): void {
    // Scramble uses submit, not input
  }

  handleSubmit(playerId: string, result: unknown): void {
    if (this.currentRound >= SCRAMBLE_ROUND_COUNT) return;

    const { word } = result as { word: string };
    const round = this.rounds[this.currentRound];
    if (round.solved) return;

    if (word.toUpperCase().trim() === round.word) {
      round.solved = true;
      round.solvedBy = playerId;
      const current = this.scores.get(playerId) ?? 0;
      this.scores.set(playerId, current + SCRAMBLE_FIRST_SOLVE_BONUS);
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
