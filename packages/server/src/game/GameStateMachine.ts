import type { Server } from 'socket.io';
import type {
  ClientEvents,
  ServerEvents,
  GameState,
  GamePhase,
  GameSettings,
  PlayerState,
  ItemId,
} from '@hearty-party/shared';
import {
  createDefaultBoard,
  getReachableSpaces,
  CHARACTERS,
  getCharacter,
  DICE_MIN,
  DICE_MAX,
  DICE_AUTO_ROLL_MS,
  ROUND_START_DISPLAY_MS,
  ROUND_END_DISPLAY_MS,
  CHARM_FOUNTAIN_AMOUNT,
  CUTTHROAT_STEAL_AMOUNT,
  CUTTHROAT_JEALOUSY_LOSS,
  CONFESSION_THRESHOLD,
  getShopItems,
  getRandomDialogue,
  getRandomCharacterDialogue,
  getRandomEvent,
} from '@hearty-party/shared';
import type { Room } from '../rooms/Room.js';
import {
  calculateDialogueAffection,
  calculateLoveNestAffection,
  applyAffection,
  randomCharacterId,
} from './AffectionSystem.js';
import { buyItem } from './ItemSystem.js';
import { MinigameRunner } from '../minigames/MinigameRunner.js';

type TypedServer = Server<ClientEvents, ServerEvents>;

export class GameStateMachine {
  private io: TypedServer;
  private room: Room;
  private state: GameState;
  private autoRollTimer: ReturnType<typeof setTimeout> | null = null;
  private _diceResolve: (() => void) | null = null;

  // Pending async player choices
  private pendingPathChoice: Map<string, (pathIndex: number) => void> = new Map();
  private pendingDialogueChoice: Map<string, (choiceIndex: number) => void> = new Map();
  private pendingShopDone: Map<string, () => void> = new Map();

  // Track last affection gain per player (for Mirror item)
  private lastAffectionGain: Map<string, { characterId: string; amount: number }> = new Map();

  private minigameRunner: MinigameRunner;

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

    this.minigameRunner = new MinigameRunner(io, room.code);
  }

  get gameState(): GameState {
    return this.state;
  }

  getPlayer(playerId: string): PlayerState | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  // ── External event handlers (called from protocol.ts) ──

  handlePathChoice(playerId: string, pathIndex: number): void {
    const resolve = this.pendingPathChoice.get(playerId);
    if (resolve) {
      this.pendingPathChoice.delete(playerId);
      resolve(pathIndex);
    }
  }

  handleDialogueChoice(playerId: string, choiceIndex: number): void {
    const resolve = this.pendingDialogueChoice.get(playerId);
    if (resolve) {
      this.pendingDialogueChoice.delete(playerId);
      resolve(choiceIndex);
    }
  }

  handleShopBuy(playerId: string, itemId: ItemId): void {
    const player = this.getPlayer(playerId);
    if (!player) return;
    const result = buyItem(player, itemId, this.state.settings.cutthroatMode);
    if (!result.success) {
      this.emitToPlayer(playerId, 'room:error', { message: result.error! });
      return;
    }
    // Re-send shop with updated tokens
    this.emitToPlayer(playerId, 'game:shop-open', {
      items: getShopItems(this.state.settings.cutthroatMode),
      playerTokens: player.charmTokens,
    });
    this.broadcastState();
  }

  handleShopClose(playerId: string): void {
    const resolve = this.pendingShopDone.get(playerId);
    if (resolve) {
      this.pendingShopDone.delete(playerId);
      resolve();
    }
  }

  handleMinigameInput(playerId: string, type: string, data: unknown): void {
    this.minigameRunner.routeInput(playerId, type, data);
  }

  handleMinigameSubmit(playerId: string, result: unknown): void {
    this.minigameRunner.routeSubmit(playerId, result);
  }

  handleDiceRoll(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (!player || this.state.phase !== 'dice_phase' || player.hasRolled) return;

    player.hasRolled = true;
    player.lastRoll = this.rollDice();

    const allRolled = this.state.players
      .filter((p) => p.connected)
      .every((p) => p.hasRolled);

    if (allRolled) {
      this.clearAutoRollTimer();
      this.finalizeDicePhase();
    }
  }

  // ── Game lifecycle ──

  async start(): Promise<void> {
    this.setPhase('game_start');
    this.broadcastState();
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

      // SPACE_PHASE
      await this.runSpacePhase();

      // Check confession after space events
      const confessionAfterSpace = this.checkConfession();
      if (confessionAfterSpace) {
        this.setPhase('game_over');
        this.broadcastGameOver(confessionAfterSpace);
        return;
      }

      // Cutthroat: jealousy mechanic at end of each round
      if (this.state.settings.cutthroatMode) {
        this.applyJealousy();
      }

      // MINIGAME phases
      await this.runMinigamePhase();

      // Check confession after minigame rewards
      const confessionAfterMinigame = this.checkConfession();
      if (confessionAfterMinigame) {
        this.setPhase('game_over');
        this.broadcastGameOver(confessionAfterMinigame);
        return;
      }

      // ROUND_END
      this.setPhase('round_end');
      this.broadcastRoundEnd();
      await this.delay(ROUND_END_DISPLAY_MS);
    }

    this.setPhase('game_over');
    this.broadcastGameOver();
  }

  // ── Dice Phase ──

  private async runDicePhase(): Promise<void> {
    for (const p of this.state.players) {
      p.hasRolled = false;
      p.lastRoll = 0;
    }

    this.setPhase('dice_phase');
    this.broadcastState();

    await new Promise<void>((resolve) => {
      this._diceResolve = resolve;
      this.autoRollTimer = setTimeout(() => {
        this.autoRollRemaining();
        resolve();
      }, DICE_AUTO_ROLL_MS);
    });
  }

  private finalizeDicePhase(): void {
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

  // ── Move Phase ──

  private async runMovePhase(): Promise<void> {
    this.setPhase('move_phase');
    this.broadcastState();

    for (let i = 0; i < this.state.players.length; i++) {
      const player = this.state.players[i];
      if (!player.connected || player.lastRoll === 0) continue;

      this.state.activePlayerIndex = i;
      this.broadcastState();

      await this.movePlayer(player);
      await this.delay(500);
    }
  }

  private async movePlayer(player: PlayerState): Promise<void> {
    const steps = player.lastRoll;
    const paths = getReachableSpaces(this.state.board, player.position, steps);

    let chosenPath: number[];
    if (paths.length === 1) {
      chosenPath = paths[0];
    } else {
      chosenPath = await this.waitForPathChoice(player, paths);
    }

    const finalSpace = chosenPath[chosenPath.length - 1];
    this.io.to(this.room.code).emit('game:player-moving', {
      playerId: player.id,
      path: chosenPath,
      finalSpace,
    });

    await this.delay(chosenPath.length * 300 + 200);
    player.position = finalSpace;
  }

  private async waitForPathChoice(player: PlayerState, paths: number[][]): Promise<number[]> {
    this.broadcastState();

    return new Promise<number[]>((resolve) => {
      this.pendingPathChoice.set(player.id, (pathIndex: number) => {
        const idx = Math.max(0, Math.min(pathIndex, paths.length - 1));
        resolve(paths[idx]);
      });

      setTimeout(() => {
        if (this.pendingPathChoice.has(player.id)) {
          this.pendingPathChoice.delete(player.id);
          resolve(paths[0]);
        }
      }, 10000);
    });
  }

  // ── Space Phase ──

  private async runSpacePhase(): Promise<void> {
    this.setPhase('space_phase');
    this.broadcastState();

    for (let i = 0; i < this.state.players.length; i++) {
      const player = this.state.players[i];
      if (!player.connected) continue;

      this.state.activePlayerIndex = i;
      this.broadcastState();
      const space = this.state.board.spaces[player.position];

      switch (space.type) {
        case 'blank':
          break;

        case 'charm_fountain':
          await this.handleCharmFountain(player);
          break;

        case 'date_spot':
          await this.handleDateSpot(player);
          break;

        case 'love_nest':
          await this.handleLoveNest(player, space.characterId!);
          break;

        case 'gift_shop':
          await this.handleGiftShop(player);
          break;

        case 'event':
          await this.handleEvent(player);
          break;

        case 'rival':
          await this.handleRival(player);
          break;
      }
    }
  }

  private async runMinigamePhase(): Promise<void> {
    const { rewards } = await this.minigameRunner.run(
      this.state.players,
      (phase) => this.setPhase(phase as GamePhase),
      () => this.broadcastState(),
    );

    this.state.currentMinigameId = this.minigameRunner.currentMinigameId;

    // Apply rewards to player state
    for (const reward of rewards) {
      const player = this.getPlayer(reward.playerId);
      if (!player) continue;
      player.charmTokens += reward.charmTokens;
      const charId = randomCharacterId();
      applyAffection(player, charId, reward.affection);
    }

    this.state.currentMinigameId = null;
    this.broadcastState();
  }

  private async handleCharmFountain(player: PlayerState): Promise<void> {
    player.charmTokens += CHARM_FOUNTAIN_AMOUNT;
    this.io.to(this.room.code).emit('game:space-event', {
      playerId: player.id,
      spaceType: 'charm_fountain',
      eventData: {
        description: `Found ${CHARM_FOUNTAIN_AMOUNT} Charm Tokens at the fountain!`,
        tokensGained: CHARM_FOUNTAIN_AMOUNT,
      },
    });
    this.broadcastState();
    await this.delay(2000);
  }

  private async handleDateSpot(player: PlayerState): Promise<void> {
    const prompt = getRandomCharacterDialogue();
    if (!prompt) return;

    const character = getCharacter(prompt.characterId);
    if (!character) return;

    // Send dialogue to the active player
    this.emitToPlayer(player.id, 'game:dialogue', { prompt });

    // Notify others
    this.io.to(this.room.code).emit('game:space-event', {
      playerId: player.id,
      spaceType: 'date_spot',
      eventData: {
        description: `${player.name} ran into ${character.name} at a Date Spot!`,
        characterId: character.id,
        characterName: character.name,
      },
    });

    // Wait for player choice (15s timeout)
    const choiceIndex = await this.waitForDialogueChoice(player.id);
    const choice = prompt.choices[Math.max(0, Math.min(choiceIndex, prompt.choices.length - 1))];
    const affectionChange = calculateDialogueAffection(character, choice);

    const { applied } = applyAffection(player, character.id, affectionChange);
    if (applied > 0) {
      this.lastAffectionGain.set(player.id, { characterId: character.id, amount: applied });
    }

    // Handle negative effects with shield
    if (applied < 0 && player.shielded) {
      player.shielded = false;
      applyAffection(player, character.id, -applied); // undo
      this.io.to(this.room.code).emit('game:space-event', {
        playerId: player.id,
        spaceType: 'date_spot',
        eventData: {
          description: `${player.name}'s Shield Brooch blocked the awkward moment!`,
          affectionChange: 0,
          characterId: character.id,
        },
      });
    } else {
      this.io.to(this.room.code).emit('game:space-event', {
        playerId: player.id,
        spaceType: 'date_spot',
        eventData: {
          description: applied >= 0
            ? `${character.name} liked that! +${applied} affection`
            : `${character.name} didn't appreciate that... ${applied} affection`,
          affectionChange: applied,
          characterId: character.id,
          choiceText: choice.text,
        },
      });
    }

    this.broadcastState();
    await this.delay(2500);
  }

  private async handleLoveNest(player: PlayerState, characterId: string): Promise<void> {
    const character = getCharacter(characterId);
    if (!character) return;

    const prompt = getRandomDialogue(characterId);
    if (!prompt) return;

    this.emitToPlayer(player.id, 'game:dialogue', { prompt });

    this.io.to(this.room.code).emit('game:space-event', {
      playerId: player.id,
      spaceType: 'love_nest',
      eventData: {
        description: `${player.name} visited ${character.name}'s Love Nest!`,
        characterId: character.id,
        characterName: character.name,
      },
    });

    const choiceIndex = await this.waitForDialogueChoice(player.id);
    const choice = prompt.choices[Math.max(0, Math.min(choiceIndex, prompt.choices.length - 1))];
    const affectionChange = calculateLoveNestAffection(character, choice);

    const { applied } = applyAffection(player, character.id, affectionChange);
    this.lastAffectionGain.set(player.id, { characterId: character.id, amount: applied });

    this.io.to(this.room.code).emit('game:space-event', {
      playerId: player.id,
      spaceType: 'love_nest',
      eventData: {
        description: `${character.name} and ${player.name} had a lovely time! +${applied} affection`,
        affectionChange: applied,
        characterId: character.id,
        choiceText: choice.text,
      },
    });

    this.broadcastState();
    await this.delay(2500);
  }

  private async handleGiftShop(player: PlayerState): Promise<void> {
    const items = getShopItems(this.state.settings.cutthroatMode);

    this.emitToPlayer(player.id, 'game:shop-open', {
      items,
      playerTokens: player.charmTokens,
    });

    this.io.to(this.room.code).emit('game:space-event', {
      playerId: player.id,
      spaceType: 'gift_shop',
      eventData: { description: `${player.name} is browsing the Gift Shop!` },
    });

    await this.waitForShopClose(player.id);
    this.broadcastState();
  }

  private async handleEvent(player: PlayerState): Promise<void> {
    const { event, tokenChange, affectionChange } = getRandomEvent();
    const charId = randomCharacterId();
    const character = getCharacter(charId);

    switch (event.scope) {
      case 'self': {
        player.charmTokens = Math.max(0, player.charmTokens + tokenChange);
        if (affectionChange < 0 && player.shielded) {
          player.shielded = false;
          this.io.to(this.room.code).emit('game:space-event', {
            playerId: player.id,
            spaceType: 'event',
            eventData: {
              description: `${player.name}'s Shield Brooch blocked: "${event.description}"`,
              tokenChange,
              affectionChange: 0,
            },
          });
        } else {
          if (affectionChange !== 0) {
            applyAffection(player, charId, affectionChange);
          }
          this.io.to(this.room.code).emit('game:space-event', {
            playerId: player.id,
            spaceType: 'event',
            eventData: {
              description: event.description,
              tokenChange,
              affectionChange,
              characterName: character?.name,
            },
          });
        }
        break;
      }
      case 'all': {
        for (const p of this.state.players) {
          if (!p.connected) continue;
          p.charmTokens = Math.max(0, p.charmTokens + tokenChange);
          if (affectionChange !== 0) {
            applyAffection(p, charId, affectionChange);
          }
        }
        this.io.to(this.room.code).emit('game:space-event', {
          playerId: player.id,
          spaceType: 'event',
          eventData: {
            description: event.description,
            tokenChange,
            affectionChange,
            affectsAll: true,
            characterName: character?.name,
          },
        });
        break;
      }
      case 'random_other': {
        const others = this.state.players.filter((p) => p.id !== player.id && p.connected);
        if (others.length > 0) {
          const target = others[Math.floor(Math.random() * others.length)];
          target.charmTokens = Math.max(0, target.charmTokens + tokenChange);
          if (affectionChange !== 0) {
            applyAffection(target, charId, affectionChange);
          }
          this.io.to(this.room.code).emit('game:space-event', {
            playerId: player.id,
            spaceType: 'event',
            eventData: {
              description: event.description,
              targetName: target.name,
              tokenChange,
              affectionChange,
              characterName: character?.name,
            },
          });
        }
        break;
      }
    }

    this.broadcastState();
    await this.delay(2500);
  }

  private async handleRival(player: PlayerState): Promise<void> {
    if (this.state.settings.cutthroatMode) {
      const others = this.state.players.filter((p) => p.id !== player.id && p.connected);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        const charId = randomCharacterId();
        const character = getCharacter(charId);

        if (target.shielded) {
          target.shielded = false;
          this.io.to(this.room.code).emit('game:space-event', {
            playerId: player.id,
            spaceType: 'rival',
            eventData: {
              description: `${player.name} tried to steal from ${target.name}, but their Shield Brooch blocked it!`,
            },
          });
        } else {
          applyAffection(target, charId, -CUTTHROAT_STEAL_AMOUNT);
          applyAffection(player, charId, CUTTHROAT_STEAL_AMOUNT);
          this.io.to(this.room.code).emit('game:space-event', {
            playerId: player.id,
            spaceType: 'rival',
            eventData: {
              description: `${player.name} stole ${CUTTHROAT_STEAL_AMOUNT} affection from ${target.name} with ${character?.name}!`,
              targetName: target.name,
              characterName: character?.name,
            },
          });
        }
      }
    } else {
      const others = this.state.players.filter((p) => p.id !== player.id && p.connected);
      if (others.length > 0) {
        const rival = others[Math.floor(Math.random() * others.length)];
        const charId = randomCharacterId();
        const character = getCharacter(charId);
        const playerBonus = Math.floor(Math.random() * 3) + 2;
        const rivalBonus = Math.floor(Math.random() * 3) + 1;

        applyAffection(player, charId, playerBonus);
        applyAffection(rival, charId, rivalBonus);

        this.io.to(this.room.code).emit('game:space-event', {
          playerId: player.id,
          spaceType: 'rival',
          eventData: {
            description: `${player.name} and ${rival.name} had a friendly contest over ${character?.name}! ${player.name} +${playerBonus}, ${rival.name} +${rivalBonus}`,
            rivalName: rival.name,
            characterName: character?.name,
          },
        });
      }
    }

    this.broadcastState();
    await this.delay(2500);
  }

  // ── Confession Win Condition ──

  private checkConfession(): { playerId: string; characterId: string } | null {
    for (const player of this.state.players) {
      if (!player.connected) continue;
      for (const [charId, aff] of Object.entries(player.affection)) {
        if (aff >= CONFESSION_THRESHOLD) {
          return { playerId: player.id, characterId: charId };
        }
      }
    }
    return null;
  }

  // ── Cutthroat: Jealousy ──

  private applyJealousy(): void {
    for (const char of CHARACTERS) {
      let maxAff = 0;
      for (const p of this.state.players) {
        if (p.connected && (p.affection[char.id] ?? 0) > maxAff) {
          maxAff = p.affection[char.id];
        }
      }
      if (maxAff <= 0) continue;

      const tiedPlayers = this.state.players.filter(
        (p) => p.connected && p.affection[char.id] === maxAff,
      );
      if (tiedPlayers.length >= 2) {
        for (const p of tiedPlayers) {
          applyAffection(p, char.id, -CUTTHROAT_JEALOUSY_LOSS);
        }
      }
    }
  }

  // ── Async choice helpers ──

  private waitForDialogueChoice(playerId: string): Promise<number> {
    return new Promise<number>((resolve) => {
      this.pendingDialogueChoice.set(playerId, resolve);
      setTimeout(() => {
        if (this.pendingDialogueChoice.has(playerId)) {
          this.pendingDialogueChoice.delete(playerId);
          resolve(0);
        }
      }, 15000);
    });
  }

  private waitForShopClose(playerId: string): Promise<void> {
    return new Promise<void>((resolve) => {
      this.pendingShopDone.set(playerId, resolve);
      setTimeout(() => {
        if (this.pendingShopDone.has(playerId)) {
          this.pendingShopDone.delete(playerId);
          resolve();
        }
      }, 20000);
    });
  }

  // ── Broadcasting ──

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

  private broadcastGameOver(confession?: { playerId: string; characterId: string }): void {
    const standings = this.state.players
      .map((p) => ({
        playerId: p.id,
        totalAffection: Object.values(p.affection).reduce((sum, v) => sum + v, 0),
        rank: 0,
      }))
      .sort((a, b) => b.totalAffection - a.totalAffection)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    // If confession win, the confessor is the winner regardless of total affection
    const winnerId = confession?.playerId ?? standings[0]?.playerId ?? '';

    if (confession) {
      // Re-rank so the confessor is rank 1
      const confIdx = standings.findIndex((s) => s.playerId === winnerId);
      if (confIdx > 0) {
        const [confessor] = standings.splice(confIdx, 1);
        standings.unshift(confessor);
        standings.forEach((s, i) => { s.rank = i + 1; });
      }
    }

    this.io.to(this.room.code).emit('game:over', {
      finalStandings: standings,
      winnerId,
      confession: confession
        ? { characterId: confession.characterId, characterName: getCharacter(confession.characterId)?.name ?? '' }
        : undefined,
    });
  }

  private emitToPlayer(playerId: string, event: keyof ServerEvents, data: unknown): void {
    const socket = this.io.sockets.sockets.get(playerId);
    if (socket) {
      (socket.emit as (ev: string, data: unknown) => void)(event, data);
    }
  }

  // ── Utilities ──

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
