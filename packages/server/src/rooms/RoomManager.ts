import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH, MAX_PLAYERS } from '@hearty-party/shared';
import type { GameSettings, RoomState } from '@hearty-party/shared';
import { Room } from './Room.js';
import type { GameStateMachine } from '../game/GameStateMachine.js';

export class RoomManager {
  private rooms = new Map<string, Room>();
  private games = new Map<string, GameStateMachine>();

  generateCode(): string {
    let code: string;
    do {
      code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostId: string, hostName: string, settings: GameSettings): Room {
    const code = this.generateCode();
    const room = new Room(code, hostId, hostName, settings);
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  getRoomByPlayerId(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.hasPlayer(playerId)) {
        return room;
      }
    }
    return undefined;
  }

  removeRoom(code: string): void {
    this.rooms.delete(code);
    this.games.delete(code);
  }

  setGame(code: string, game: GameStateMachine): void {
    this.games.set(code, game);
  }

  getGame(code: string): GameStateMachine | undefined {
    return this.games.get(code);
  }

  getGameByPlayerId(playerId: string): GameStateMachine | undefined {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return undefined;
    return this.games.get(room.code);
  }

  /** Clean up empty rooms */
  cleanup(): void {
    for (const [code, room] of this.rooms) {
      if (room.playerCount === 0) {
        this.rooms.delete(code);
        this.games.delete(code);
      }
    }
  }
}
