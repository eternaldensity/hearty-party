import type { MinigameDef, MinigameRanking, PlayerState, RoseGardenCell } from '@hearty-party/shared';
import {
  getMinigameDef,
  ROSE_GARDEN_GRID_SIZE,
  ROSE_GARDEN_ROUNDS,
  ROSE_GARDEN_PLACE_TIMEOUT_MS,
} from '@hearty-party/shared';
import type { MinigameServer } from './MinigameServer.js';

export class RoseGardenServer implements MinigameServer {
  readonly def: MinigameDef = getMinigameDef('rose_garden')!;

  private grid: RoseGardenCell[][] = [];
  private playerIds: string[] = [];
  private roundIndex = 0;
  private currentPlayerTurnIndex = 0;
  private placed = new Map<string, boolean>();
  private turnStartTime = 0;
  private allPlacedThisRound = false;
  private started = false;

  init(players: PlayerState[]): void {
    this.playerIds = players.map((p) => p.id);

    // Initialize empty grid
    this.grid = [];
    for (let r = 0; r < ROSE_GARDEN_GRID_SIZE; r++) {
      const row: RoseGardenCell[] = [];
      for (let c = 0; c < ROSE_GARDEN_GRID_SIZE; c++) {
        row.push({ owner: null });
      }
      this.grid.push(row);
    }

    this.roundIndex = 0;
    this.currentPlayerTurnIndex = 0;
    this.started = false;
    this.resetPlaced();
  }

  tick(timeRemaining: number): unknown | null {
    if (timeRemaining <= 0) return null;
    if (this.roundIndex >= ROSE_GARDEN_ROUNDS) return null;

    const now = Date.now();

    if (!this.started) {
      this.started = true;
      this.turnStartTime = now;
    }

    // Check if current player's turn has timed out
    const turnElapsed = now - this.turnStartTime;
    if (turnElapsed >= ROSE_GARDEN_PLACE_TIMEOUT_MS && !this.allPlacedThisRound) {
      // Auto-skip current player
      const currentId = this.playerIds[this.currentPlayerTurnIndex];
      if (!this.placed.get(currentId)) {
        this.placed.set(currentId, true);
      }
      this.advanceTurn(now);
    }

    // Compute scores
    const scores: Record<string, number> = {};
    for (const id of this.playerIds) {
      scores[id] = this.countCells(id);
    }

    return {
      grid: this.grid,
      gridSize: ROSE_GARDEN_GRID_SIZE,
      roundIndex: this.roundIndex,
      totalRounds: ROSE_GARDEN_ROUNDS,
      currentPlayerId: this.allPlacedThisRound ? null : this.playerIds[this.currentPlayerTurnIndex],
      scores,
      placed: Object.fromEntries(this.placed),
    };
  }

  handleInput(playerId: string, inputType: string, data: unknown): void {
    if (inputType !== 'place') return;
    if (this.roundIndex >= ROSE_GARDEN_ROUNDS) return;
    if (this.placed.get(playerId)) return;

    // Only the current player can place
    if (this.playerIds[this.currentPlayerTurnIndex] !== playerId) return;

    const { row, col } = data as { row: number; col: number };

    if (row < 0 || row >= ROSE_GARDEN_GRID_SIZE || col < 0 || col >= ROSE_GARDEN_GRID_SIZE) return;
    if (this.grid[row][col].owner !== null) return;

    this.grid[row][col].owner = playerId;
    this.placed.set(playerId, true);
    this.advanceTurn(Date.now());
  }

  handleSubmit(): void {
    // Rose Garden uses input, not submit
  }

  getRankings(): MinigameRanking[] {
    const entries = this.playerIds
      .map((playerId) => ({ playerId, score: this.countCells(playerId) }))
      .sort((a, b) => b.score - a.score);

    return entries.map((e, i) => ({
      playerId: e.playerId,
      rank: i + 1,
      score: e.score,
    }));
  }

  cleanup(): void {
    this.grid = [];
    this.placed.clear();
  }

  private advanceTurn(now: number): void {
    // Move to next unplaced player
    let next = this.currentPlayerTurnIndex + 1;
    while (next < this.playerIds.length && this.placed.get(this.playerIds[next])) {
      next++;
    }

    if (next >= this.playerIds.length) {
      // All players placed this round — spread roses and advance round
      this.spreadRoses();
      this.roundIndex++;
      if (this.roundIndex < ROSE_GARDEN_ROUNDS) {
        this.resetPlaced();
        this.currentPlayerTurnIndex = 0;
        this.allPlacedThisRound = false;
        this.turnStartTime = now;
      } else {
        this.allPlacedThisRound = true;
      }
    } else {
      this.currentPlayerTurnIndex = next;
      this.turnStartTime = now;
    }
  }

  private spreadRoses(): void {
    const size = ROSE_GARDEN_GRID_SIZE;
    const newOwners: Array<{ row: number; col: number; owner: string }> = [];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const owner = this.grid[r][c].owner;
        if (!owner) continue;

        const neighbors = [
          [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
        ];
        for (const [nr, nc] of neighbors) {
          if (nr >= 0 && nr < size && nc >= 0 && nc < size && this.grid[nr][nc].owner === null) {
            newOwners.push({ row: nr, col: nc, owner });
          }
        }
      }
    }

    // Resolve conflicts: if multiple players spread to same cell, nobody gets it
    const cellMap = new Map<string, string[]>();
    for (const { row, col, owner } of newOwners) {
      const key = `${row},${col}`;
      const existing = cellMap.get(key) ?? [];
      if (!existing.includes(owner)) {
        existing.push(owner);
      }
      cellMap.set(key, existing);
    }

    for (const [key, owners] of cellMap) {
      if (owners.length === 1) {
        const [row, col] = key.split(',').map(Number);
        this.grid[row][col].owner = owners[0];
      }
    }
  }

  private countCells(playerId: string): number {
    let count = 0;
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.owner === playerId) count++;
      }
    }
    return count;
  }

  private resetPlaced(): void {
    this.placed.clear();
    for (const id of this.playerIds) {
      this.placed.set(id, false);
    }
  }
}
