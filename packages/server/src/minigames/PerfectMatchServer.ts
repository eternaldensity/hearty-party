import type { MinigameDef, MinigameRanking, PlayerState, PerfectMatchCard } from '@hearty-party/shared';
import {
  getMinigameDef,
  CHARACTERS,
  PERFECT_MATCH_PAIRS,
  PERFECT_MATCH_FLIP_TIMEOUT_MS,
} from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';

export class PerfectMatchServer implements MinigameServer {
  readonly def: MinigameDef = getMinigameDef('perfect_match')!;

  private cards: PerfectMatchCard[] = [];
  private scores = new Map<string, number>();
  private playerIds: string[] = [];
  private currentFlipped: number[] = [];
  private flipLockUntil = 0;
  private lastMatchBy: string | null = null;

  init(players: PlayerState[]): void {
    this.playerIds = players.map((p) => p.id);
    for (const id of this.playerIds) {
      this.scores.set(id, 0);
    }

    // Build pairs from characters, cycling to fill PERFECT_MATCH_PAIRS
    const charIds: string[] = [];
    for (let i = 0; i < PERFECT_MATCH_PAIRS; i++) {
      charIds.push(CHARACTERS[i % CHARACTERS.length].id);
    }

    // Two of each character for pairs
    const allCards: PerfectMatchCard[] = [];
    let idCounter = 0;
    for (const charId of charIds) {
      allCards.push({ id: idCounter++, characterId: charId, flipped: false, matched: false });
      allCards.push({ id: idCounter++, characterId: charId, flipped: false, matched: false });
    }

    // Shuffle
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }

    this.cards = allCards;
  }

  tick(timeRemaining: number): unknown | null {
    if (timeRemaining <= 0) return null;

    // Check if all pairs matched — end early
    if (this.cards.every((c) => c.matched)) return null;

    // Auto-flip back after timeout
    if (this.currentFlipped.length === 2 && Date.now() >= this.flipLockUntil) {
      const [a, b] = this.currentFlipped;
      this.cards[a].flipped = false;
      this.cards[b].flipped = false;
      this.currentFlipped = [];
    }

    return {
      cards: this.cards,
      scores: Object.fromEntries(this.scores),
      currentFlipped: this.currentFlipped,
      lastMatchBy: this.lastMatchBy,
    };
  }

  handleInput(playerId: string, inputType: string, data: unknown): void {
    if (inputType !== 'flip') return;
    const { cardId } = data as { cardId: number };

    // Can't flip during lock period
    if (this.currentFlipped.length === 2 && Date.now() < this.flipLockUntil) return;

    // If lock expired, clear mismatched cards first
    if (this.currentFlipped.length === 2) {
      const [a, b] = this.currentFlipped;
      this.cards[a].flipped = false;
      this.cards[b].flipped = false;
      this.currentFlipped = [];
    }

    const card = this.cards.find((c) => c.id === cardId);
    if (!card || card.matched || card.flipped) return;

    card.flipped = true;
    this.currentFlipped.push(this.cards.indexOf(card));

    if (this.currentFlipped.length === 2) {
      const [a, b] = this.currentFlipped;
      if (this.cards[a].characterId === this.cards[b].characterId) {
        // Match found
        this.cards[a].matched = true;
        this.cards[b].matched = true;
        this.currentFlipped = [];
        this.lastMatchBy = playerId;
        const current = this.scores.get(playerId) ?? 0;
        this.scores.set(playerId, current + 1);
      } else {
        // Mismatch — set timeout to flip back
        this.flipLockUntil = Date.now() + PERFECT_MATCH_FLIP_TIMEOUT_MS;
      }
    }
  }

  handleSubmit(): void {
    // Perfect Match uses input, not submit
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
    this.cards = [];
    this.scores.clear();
    this.currentFlipped = [];
  }
}
