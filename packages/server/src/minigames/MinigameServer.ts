import type { MinigameDef, MinigameRanking, PlayerState } from '@hearty-party/shared';

/**
 * Common interface for all server-side minigame implementations.
 * Each minigame is a stateful object created per-run.
 */
export interface MinigameServer {
  readonly def: MinigameDef;

  /** Initialize game state. Called once before the play loop begins. */
  init(players: PlayerState[]): void;

  /**
   * Called at a fixed tick interval during the play phase.
   * Returns the shared state to broadcast via minigame:tick.
   * Returns null to signal the game has ended early.
   */
  tick(timeRemaining: number): unknown | null;

  /** Handle a real-time input from a player (minigame:input). */
  handleInput(playerId: string, inputType: string, data: unknown): void;

  /** Handle a submission from a player (minigame:submit). */
  handleSubmit(playerId: string, result: unknown): void;

  /** Compute final rankings sorted by rank (1 = best). */
  getRankings(): MinigameRanking[];

  /** Clean up any resources. */
  cleanup(): void;
}
