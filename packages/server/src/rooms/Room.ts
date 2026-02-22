import { MAX_PLAYERS, MIN_PLAYERS, DEFAULT_ROUNDS, RECONNECT_GRACE_MS } from '@hearty-party/shared';
import type { GameSettings, RoomState } from '@hearty-party/shared';

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  disconnectTimer?: ReturnType<typeof setTimeout>;
}

export class Room {
  readonly code: string;
  private players = new Map<string, RoomPlayer>();
  settings: GameSettings;
  inGame = false;

  constructor(code: string, hostId: string, hostName: string, settings: GameSettings) {
    this.code = code;
    this.settings = {
      totalRounds: settings.totalRounds || DEFAULT_ROUNDS,
      cutthroatMode: settings.cutthroatMode ?? false,
    };
    this.players.set(hostId, {
      id: hostId,
      name: hostName,
      isHost: true,
      connected: true,
    });
  }

  get playerCount(): number {
    return this.players.size;
  }

  get playerList(): RoomPlayer[] {
    return Array.from(this.players.values());
  }

  get hostId(): string | undefined {
    for (const p of this.players.values()) {
      if (p.isHost) return p.id;
    }
    return undefined;
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId);
  }

  getPlayer(playerId: string): RoomPlayer | undefined {
    return this.players.get(playerId);
  }

  addPlayer(id: string, name: string): { success: boolean; error?: string } {
    if (this.players.has(id)) {
      return { success: false, error: 'Already in this room' };
    }
    if (this.players.size >= MAX_PLAYERS) {
      return { success: false, error: `Room is full (max ${MAX_PLAYERS} players)` };
    }
    if (this.inGame) {
      return { success: false, error: 'Game already in progress' };
    }
    this.players.set(id, {
      id,
      name,
      isHost: false,
      connected: true,
    });
    return { success: true };
  }

  removePlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
    }
    this.players.delete(playerId);

    // Transfer host if needed
    if (player.isHost && this.players.size > 0) {
      const newHost = this.players.values().next().value;
      if (newHost) newHost.isHost = true;
    }
  }

  markDisconnected(playerId: string, onTimeout: () => void): void {
    const player = this.players.get(playerId);
    if (!player) return;

    player.connected = false;
    player.disconnectTimer = setTimeout(() => {
      onTimeout();
    }, RECONNECT_GRACE_MS);
  }

  markReconnected(playerId: string): void {
    const player = this.players.get(playerId);
    if (!player) return;

    player.connected = true;
    if (player.disconnectTimer) {
      clearTimeout(player.disconnectTimer);
      player.disconnectTimer = undefined;
    }
  }

  canStart(): { ok: boolean; reason?: string } {
    if (this.inGame) return { ok: false, reason: 'Game already in progress' };
    const connected = this.playerList.filter((p) => p.connected).length;
    if (connected < MIN_PLAYERS) {
      return { ok: false, reason: `Need at least ${MIN_PLAYERS} connected players` };
    }
    return { ok: true };
  }

  toRoomState(): RoomState {
    return {
      code: this.code,
      players: this.playerList.map((p) => ({
        id: p.id,
        name: p.name,
        isHost: p.isHost,
        connected: p.connected,
      })),
      settings: { ...this.settings },
      inGame: this.inGame,
    };
  }
}
