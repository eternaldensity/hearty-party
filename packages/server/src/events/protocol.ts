import type { Server, Socket } from 'socket.io';
import type { ClientEvents, ServerEvents, GameSettings } from '@hearty-party/shared';
import { MIN_PLAYERS } from '@hearty-party/shared';
import { RoomManager } from '../rooms/RoomManager.js';
import { GameStateMachine } from '../game/GameStateMachine.js';

type TypedServer = Server<ClientEvents, ServerEvents>;
type TypedSocket = Socket<ClientEvents, ServerEvents>;

export function registerEventHandlers(io: TypedServer, roomManager: RoomManager): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[connect] ${socket.id}`);

    socket.on('room:create', ({ playerName, settings }) => {
      // Leave any existing room first
      leaveCurrentRoom(socket, io, roomManager);

      const room = roomManager.createRoom(socket.id, playerName, settings);
      socket.join(room.code);
      socket.emit('room:created', {
        gameCode: room.code,
        roomState: room.toRoomState(),
      });
      console.log(`[room:create] ${playerName} created room ${room.code}`);
    });

    socket.on('room:join', ({ gameCode, playerName }) => {
      const code = gameCode.toUpperCase().trim();
      const room = roomManager.getRoom(code);

      if (!room) {
        socket.emit('room:error', { message: `Room "${code}" not found` });
        return;
      }

      // Check if reconnecting
      const existing = room.getPlayer(socket.id);
      if (existing) {
        room.markReconnected(socket.id);
        socket.join(room.code);
        socket.emit('room:joined', { roomState: room.toRoomState(), playerId: socket.id });
        io.to(room.code).emit('room:player-joined', {
          player: { id: socket.id, name: existing.name, isHost: existing.isHost, connected: true },
        });
        console.log(`[room:rejoin] ${existing.name} reconnected to ${room.code}`);
        return;
      }

      const result = room.addPlayer(socket.id, playerName);
      if (!result.success) {
        socket.emit('room:error', { message: result.error! });
        return;
      }

      socket.join(room.code);
      socket.emit('room:joined', { roomState: room.toRoomState(), playerId: socket.id });
      io.to(room.code).emit('room:player-joined', {
        player: { id: socket.id, name: playerName, isHost: false, connected: true },
      });
      console.log(`[room:join] ${playerName} joined room ${room.code}`);
    });

    socket.on('room:leave', () => {
      leaveCurrentRoom(socket, io, roomManager);
    });

    socket.on('game:start', () => {
      const room = roomManager.getRoomByPlayerId(socket.id);
      if (!room) {
        socket.emit('room:error', { message: 'Not in a room' });
        return;
      }

      // Only host can start
      if (room.hostId !== socket.id) {
        socket.emit('room:error', { message: 'Only the host can start the game' });
        return;
      }

      const canStart = room.canStart();
      if (!canStart.ok) {
        socket.emit('room:error', { message: canStart.reason! });
        return;
      }

      room.inGame = true;
      console.log(`[game:start] Room ${room.code} starting game with ${room.playerCount} players`);

      const game = new GameStateMachine(io, room, room.settings);
      roomManager.setGame(room.code, game);
      game.start();
    });

    socket.on('game:roll-dice', () => {
      const game = roomManager.getGameByPlayerId(socket.id);
      if (!game) return;
      game.handleDiceRoll(socket.id);
    });

    socket.on('game:choose-path', ({ pathIndex }) => {
      const game = roomManager.getGameByPlayerId(socket.id);
      if (!game) return;
      game.handlePathChoice(socket.id, pathIndex);
    });

    socket.on('disconnect', () => {
      console.log(`[disconnect] ${socket.id}`);
      const room = roomManager.getRoomByPlayerId(socket.id);
      if (!room) return;

      if (room.inGame) {
        // During game: grace period for reconnect
        room.markDisconnected(socket.id, () => {
          // Timeout expired — remove player
          room.removePlayer(socket.id);
          io.to(room.code).emit('room:player-left', { playerId: socket.id });
          if (room.playerCount === 0) {
            roomManager.removeRoom(room.code);
          }
        });
      } else {
        // In lobby: remove immediately
        room.removePlayer(socket.id);
        io.to(room.code).emit('room:player-left', { playerId: socket.id });
        if (room.playerCount === 0) {
          roomManager.removeRoom(room.code);
        }
      }
    });
  });
}

function leaveCurrentRoom(
  socket: TypedSocket,
  io: TypedServer,
  roomManager: RoomManager,
): void {
  const room = roomManager.getRoomByPlayerId(socket.id);
  if (!room) return;

  room.removePlayer(socket.id);
  socket.leave(room.code);
  io.to(room.code).emit('room:player-left', { playerId: socket.id });

  if (room.playerCount === 0) {
    roomManager.removeRoom(room.code);
    console.log(`[room:remove] Room ${room.code} removed (empty)`);
  }
}
