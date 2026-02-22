import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '@hearty-party/shared';

export type GameSocket = Socket<ServerEvents, ClientEvents>;

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket(): { socket: GameSocket | null; connected: boolean } {
  const socketRef = useRef<GameSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: GameSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[socket] connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[socket] disconnected');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socket: socketRef.current, connected };
}
