import type { Server } from 'socket.io';
import type {
  ClientEvents,
  ServerEvents,
  GameState,
  GamePhase,
  GameSettings,
  PlayerState,
} from '@hearty-party/shared';
import {
  createDefaultBoard,
  getReachableSpaces,
  CHARACTERS,
  DICE_MIN,
  DICE_MAX,
  DICE_AUTO_ROLL_MS,
  ROUND_START_DISPLAY_MS,
  ROUND_END_DISPLAY_MS,
  CHARM_FOUNTAIN_AMOUNT,
} from '@hearty-party/shared';
import type { Room } from '../rooms/Room.js';

type TypedServer = Server<ClientEvents, ServerEvents>;

export class GameStateMachine {
  private io: TypedServer;
  private room: Room;
  private state: GameState;
  private autoRollTimer: ReturnType<typeof setTimeout> | null = null;
  /** Pending path choices: playerId → resolve function */
  private pendingPathChoice: Map<string, (pathIndex: number) => void> = new Map();

  constructor(io: TypedServer, room: Room, settings: GameSettings) {
    this.io = io;
    this.room = room;

    const board = createDefaultBoard();
    const players: PlayerState[] = room.playerList.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      connected: p.connected,
      position: 0,
      charmTokens: 0,
      items: [],
      affection: Object.fromEntries(CHARACTERS.map((c) => [c.id, 0])),
      milestones: Object.fromEntries(CHARACTERS.map((c) => [c.id, []])),
      hasRolled: false,
      lastRoll: 0,
      shielded: false,
    }));

    this.state = {
      id: room.code,
      code: room.code,
      phase: 'lobby',
      settings,
      board,
      players,
      currentRound: 0,
      totalRounds: settings.totalRounds,
      currentMinigameId: null,
      activePlayerIndex: 0,
    };
  }

  get gameState(): GameState {
    return this.state;
  }

  getPlayer(playerId: string): PlayerState | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  handlePathChoice(playerId: string, pathIndex: number): void {
    const resolve = this.pendingPathChoice.get(playerId);
    if (resolve) {
      this.pendingPathChoice.delete(playerId);
      resolve(pathIndex);
    }
  }

  handleDiceRoll(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (!player || this.state.phase !== 'dice_phase' || player.hasRolled) return;

    player.hasRolled = true;
    player.lastRoll = this.rollDice();

    // Check if all connected players have rolled
    const allRolled = this.state.players
      .filter((p) => p.connected)
      .every((p) => p.hasRolled);

    if (allRolled) {
      this.clearAutoRollTimer();
      this.finalizeDicePhase();
    }
  }

  async start(): Promise<void> {
    this.setPhase('game_start');
    this.broadcastState();

    // Small delay then begin round 1
    await this.delay(1000);
    await this.runGameLoop();
  }

  private async runGameLoop(): Promise<void> {
    for (let round = 1; round <= this.state.totalRounds; round++) {
      this.state.currentRound = round;

      // ROUND_START
      this.setPhase('round_start');
      this.broadcastState();
      await this.delay(ROUND_START_DISPLAY_MS);

      // DICE_PHASE
      await this.runDicePhase();

      // MOVE_PHASE
      await this.runMovePhase();

      // SPACE_PHASE (stub for now — will be implemented in Phase 4)
      await this.runSpacePhase();

      // MINIGAME phases skipped for now (Phase 5)

      // ROUND_END
      this.setPhase('round_end');
      this.broadcastRoundEnd();
      await this.delay(ROUND_END_DISPLAY_MS);
    }

    // GAME_OVER
    this.setPhase('game_over');
    this.broadcastGameOver();
  }

  private async runDicePhase(): Promise<void> {
    // Reset roll state
    for (const p of this.state.players) {
      p.hasRolled = false;
      p.lastRoll = 0;
    }

    this.setPhase('dice_phase');
    this.broadcastState();

    // Wait for all players to roll (or auto-roll after timeout)
    await new Promise<void>((resolve) => {
      const checkAllRolled = () => {
        const allRolled = this.state.players
          .filter((p) => p.connected)
          .every((p) => p.hasRolled);
        if (allRolled) resolve();
      };

      // Store the resolve so finalizeDicePhase can call it
      this._diceResolve = () => {
        resolve();
      };

      // Auto-roll timer
      this.autoRollTimer = setTimeout(() => {
        this.autoRollRemaining();
        resolve();
      }, DICE_AUTO_ROLL_MS);
    });
  }

  private _diceResolve: (() => void) | null = null;

  private finalizeDicePhase(): void {
    // Broadcast all roll results
    const rolls = this.state.players
      .filter((p) => p.connected)
      .map((p) => ({ playerId: p.id, value: p.lastRoll }));

    this.io.to(this.room.code).emit('game:dice-results', { rolls });

    if (this._diceResolve) {
      this._diceResolve();
      this._diceResolve = null;
    }
  }

  private autoRollRemaining(): void {
    for (const p of this.state.players) {
      if (p.connected && !p.hasRolled) {
        p.hasRolled = true;
        p.lastRoll = this.rollDice();
      }
    }
    this.finalizeDicePhase();
  }

  private async runMovePhase(): Promise<void> {
    this.setPhase('move_phase');
    this.broadcastState();

    // Move players sequentially
    for (let i = 0; i < this.state.players.length; i++) {
      const player = this.state.players[i];
      if (!player.connected || player.lastRoll === 0) continue;

      this.state.activePlayerIndex = i;
      this.broadcastState();

      await this.movePlayer(player);
      // Brief pause between players
      await this.delay(500);
    }
  }

  private async movePlayer(player: PlayerState): Promise<void> {
    const steps = player.lastRoll;
    const paths = getReachableSpaces(this.state.board, player.position, steps);

    let chosenPath: number[];

    if (paths.length === 1) {
      // Only one possible path
      chosenPath = paths[0];
    } else {
      // Player needs to choose at a branch point — find where the paths diverge
      // Send choice to the player and wait
      chosenPath = await this.waitForPathChoice(player, paths);
    }

    // Animate the movement
    const finalSpace = chosenPath[chosenPath.length - 1];
    this.io.to(this.room.code).emit('game:player-moving', {
      playerId: player.id,
      path: chosenPath,
      finalSpace,
    });

    // Wait for animation
    await this.delay(chosenPath.length * 300 + 200);

    // Update position
    player.position = finalSpace;
  }

  private async waitForPathChoice(player: PlayerState, paths: number[][]): Promise<number[]> {
    // Find the branch point (first space where paths diverge)
    // Send the options to the player
    const branchOptions = paths.map((path, idx) => ({
      pathIndex: idx,
      firstStep: path[1], // the first space after current position
      destination: path[path.length - 1],
    }));

    // Emit a state update so the client knows it needs to choose
    this.io.to(this.room.code).emit('game:state-update', {
      phase: 'move_phase',
      roundNumber: this.state.currentRound,
      gameState: {
        ...this.state,
        // Client will check if they're the active player and show branch UI
      },
    });

    return new Promise<number[]>((resolve) => {
      this.pendingPathChoice.set(player.id, (pathIndex: number) => {
        const idx = Math.max(0, Math.min(pathIndex, paths.length - 1));
        resolve(paths[idx]);
      });

      // Auto-choose after 10 seconds
      setTimeout(() => {
        if (this.pendingPathChoice.has(player.id)) {
          this.pendingPathChoice.delete(player.id);
          resolve(paths[0]);
        }
      }, 10000);
    });
  }

  private async runSpacePhase(): Promise<void> {
    this.setPhase('space_phase');
    this.broadcastState();

    for (let i = 0; i < this.state.players.length; i++) {
      const player = this.state.players[i];
      if (!player.connected) continue;

      this.state.activePlayerIndex = i;
      const space = this.state.board.spaces[player.position];

      // Handle simple space effects immediately
      switch (space.type) {
        case 'charm_fountain':
          player.charmTokens += CHARM_FOUNTAIN_AMOUNT;
          this.io.to(this.room.code).emit('game:space-event', {
            playerId: player.id,
            spaceType: space.type,
            eventData: { tokensGained: CHARM_FOUNTAIN_AMOUNT },
          });
          await this.delay(1500);
          break;

        case 'blank':
          // Nothing happens
          break;

        // Date spots, love nests, gift shops, events, and rivals
        // will be implemented in Phase 4
        default:
          this.io.to(this.room.code).emit('game:space-event', {
            playerId: player.id,
            spaceType: space.type,
            eventData: null,
          });
          await this.delay(1000);
          break;
      }
    }
  }

  private setPhase(phase: GamePhase): void {
    this.state.phase = phase;
  }

  private broadcastState(): void {
    this.io.to(this.room.code).emit('game:state-update', {
      phase: this.state.phase,
      roundNumber: this.state.currentRound,
      gameState: this.state,
    });
  }

  private broadcastRoundEnd(): void {
    const standings = this.state.players.map((p) => ({
      playerId: p.id,
      totalAffection: Object.values(p.affection).reduce((sum, v) => sum + v, 0),
    }));
    standings.sort((a, b) => b.totalAffection - a.totalAffection);

    this.io.to(this.room.code).emit('game:round-end', {
      standings,
      roundNumber: this.state.currentRound,
    });
  }

  private broadcastGameOver(): void {
    const standings = this.state.players
      .map((p) => ({
        playerId: p.id,
        totalAffection: Object.values(p.affection).reduce((sum, v) => sum + v, 0),
        rank: 0,
      }))
      .sort((a, b) => b.totalAffection - a.totalAffection)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    this.io.to(this.room.code).emit('game:over', {
      finalStandings: standings,
      winnerId: standings[0]?.playerId ?? '',
    });
  }

  private rollDice(): number {
    return Math.floor(Math.random() * (DICE_MAX - DICE_MIN + 1)) + DICE_MIN;
  }

  private clearAutoRollTimer(): void {
    if (this.autoRollTimer) {
      clearTimeout(this.autoRollTimer);
      this.autoRollTimer = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
