import { useEffect, useRef, useState } from 'react';
import { SPACE_COLORS, CHARACTERS } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface SpaceEventPayload {
  description?: string;
  affectionChange?: number;
  tokenChange?: number;
  characterId?: string;
  characterName?: string;
  choiceText?: string;
  [key: string]: unknown;
}

interface SpaceEventData {
  playerId: string;
  spaceType: string;
  eventData: SpaceEventPayload | null;
}

interface SpaceEventToastProps {
  socket: GameSocket;
  playerNames: Map<string, string>;
}

export function SpaceEventToast({ socket, playerNames }: SpaceEventToastProps) {
  const [events, setEvents] = useState<Array<SpaceEventData & { id: number }>>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    const onEvent = (raw: { playerId: string; spaceType: string; eventData: unknown }) => {
      const data: SpaceEventData = {
        playerId: raw.playerId,
        spaceType: raw.spaceType,
        eventData: (raw.eventData as SpaceEventPayload | null) ?? null,
      };
      const id = counterRef.current++;
      setEvents((prev) => [...prev.slice(-4), { ...data, id }]);

      // Auto-dismiss after 3s
      setTimeout(() => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      }, 3000);
    };

    socket.on('game:space-event', onEvent);
    return () => { socket.off('game:space-event', onEvent); };
  }, [socket]);

  if (events.length === 0) return null;

  return (
    <div style={styles.container}>
      {events.map((evt) => {
        const color = SPACE_COLORS[evt.spaceType] ?? '#9CA3AF';
        const desc = evt.eventData?.description ?? `${playerNames.get(evt.playerId) ?? 'Someone'} landed on a ${evt.spaceType} space`;
        const character = evt.eventData?.characterId
          ? CHARACTERS.find((c) => c.id === evt.eventData?.characterId)
          : undefined;

        return (
          <div
            key={evt.id}
            style={{
              ...styles.toast,
              borderLeft: `4px solid ${color}`,
            }}
          >
            <p style={styles.desc}>{desc}</p>
            {evt.eventData?.affectionChange !== undefined && evt.eventData.affectionChange !== 0 && (
              <span
                style={{
                  ...styles.change,
                  color: evt.eventData.affectionChange > 0 ? '#34D399' : '#F87171',
                }}
              >
                {evt.eventData.affectionChange > 0 ? '+' : ''}{evt.eventData.affectionChange}
                {character ? ` with ${character.name}` : ''}
              </span>
            )}
            {evt.eventData?.tokenChange !== undefined && evt.eventData.tokenChange !== 0 && (
              <span style={{ ...styles.change, color: '#FBBF24' }}>
                {evt.eventData.tokenChange > 0 ? '+' : ''}{evt.eventData.tokenChange} tokens
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    zIndex: 50,
    maxWidth: '360px',
    width: '90%',
  },
  toast: {
    background: '#1F2937',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
  },
  desc: {
    fontSize: '0.85rem',
    lineHeight: 1.4,
    color: '#D1D5DB',
  },
  change: {
    fontSize: '0.8rem',
    fontWeight: 700,
  },
};
