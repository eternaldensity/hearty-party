import type { MinigameDef, MinigameRanking, PlayerState } from '@hearty-party/shared';
import {
  getMinigameDef,
  CHARACTERS,
  COMPAT_QUIZ_QUESTIONS,
  COMPAT_QUIZ_ROUND_COUNT,
  COMPAT_QUIZ_ROUND_TIME_MS,
} from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';

export class CompatibilityQuizServer implements MinigameServer {
  readonly def: MinigameDef = getMinigameDef('compatibility_quiz')!;

  private scores = new Map<string, number>();
  private playerIds: string[] = [];
  private rounds: Array<{
    questionIndex: number;
    targetCharacterId: string;
  }> = [];
  private roundIndex = 0;
  private roundStartTime = 0;
  private answeredThisRound = new Set<string>();
  private started = false;

  init(players: PlayerState[]): void {
    this.playerIds = players.map((p) => p.id);
    for (const id of this.playerIds) {
      this.scores.set(id, 0);
    }

    // Pick random questions and target characters for each round
    const questionIndices = this.pickRandom(COMPAT_QUIZ_QUESTIONS.length, COMPAT_QUIZ_ROUND_COUNT);
    for (const qi of questionIndices) {
      const char = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      this.rounds.push({ questionIndex: qi, targetCharacterId: char.id });
    }

    this.roundIndex = 0;
    this.started = false;
  }

  tick(timeRemaining: number): unknown | null {
    if (timeRemaining <= 0) return null;
    if (this.roundIndex >= this.rounds.length) return null;

    const now = Date.now();

    if (!this.started) {
      this.started = true;
      this.roundStartTime = now;
      this.answeredThisRound.clear();
    }

    // Auto-advance round after timeout or when all players answered
    const roundElapsed = now - this.roundStartTime;
    const allAnswered = this.playerIds.every((id) => this.answeredThisRound.has(id));

    if (roundElapsed >= COMPAT_QUIZ_ROUND_TIME_MS || allAnswered) {
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) return null;
      this.roundStartTime = now;
      this.answeredThisRound.clear();
    }

    const round = this.rounds[this.roundIndex];
    const question = COMPAT_QUIZ_QUESTIONS[round.questionIndex];
    const character = CHARACTERS.find((c) => c.id === round.targetCharacterId);

    return {
      roundIndex: this.roundIndex,
      totalRounds: this.rounds.length,
      question: {
        question: question.question,
        options: question.options,
      },
      targetCharacterId: round.targetCharacterId,
      targetCharacterName: character?.name ?? 'Unknown',
      roundAnswered: allAnswered,
      scores: Object.fromEntries(this.scores),
    };
  }

  handleInput(): void {
    // Compatibility Quiz uses submit, not input
  }

  handleSubmit(playerId: string, result: unknown): void {
    if (this.roundIndex >= this.rounds.length) return;
    if (this.answeredThisRound.has(playerId)) return;

    const { category } = result as { category: string };
    this.answeredThisRound.add(playerId);

    const round = this.rounds[this.roundIndex];
    const character = CHARACTERS.find((c) => c.id === round.targetCharacterId);
    if (!character) return;

    // Score based on how much the character likes that category
    const weight = character.preferences[category] ?? 0;
    // Map weight (-3..+3) to points (0..6)
    const points = Math.max(0, weight + 3);
    const current = this.scores.get(playerId) ?? 0;
    this.scores.set(playerId, current + points);
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
    this.rounds = [];
    this.answeredThisRound.clear();
  }

  private pickRandom(total: number, count: number): number[] {
    const indices = Array.from({ length: total }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, count);
  }
}
