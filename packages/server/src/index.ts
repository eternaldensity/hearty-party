import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientEvents, ServerEvents } from '@hearty-party/shared';
import { RoomManager } from './rooms/RoomManager.js';
import { registerEventHandlers } from './events/protocol.js';

const PORT = parseInt(process.env.PORT || '3001', 10);

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientEvents, ServerEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', rooms: 0 });
});

// Register Socket.IO event handlers
registerEventHandlers(io, roomManager);

httpServer.listen(PORT, () => {
  console.log(`Hearty Party server listening on http://localhost:${PORT}`);
});
