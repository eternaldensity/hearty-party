import { SPACE_COLORS, CHARACTERS } from '@hearty-party/shared';
import type { SpaceEvent } from '../hooks/useGameEvents.js';

interface SpaceEventPayload {
  description?: string;
  affectionChange?: number;
  tokenChange?: number;
  characterId?: string;
  characterName?: string;
  choiceText?: string;
  [key: string]: unknown;
}

interface SpaceEventToastProps {
  events: SpaceEvent[];
  playerNames: Map<string, string>;
}

export function SpaceEventToast({ events, playerNames }: SpaceEventToastProps) {
  if (events.length === 0) return null;

  return (
    <div style={styles.container}>
      {events.map((evt) => {
        const eventData = (evt.eventData as SpaceEventPayload | null) ?? null;
        const color = SPACE_COLORS[evt.spaceType] ?? '#9CA3AF';
        const desc = eventData?.description ?? `${playerNames.get(evt.playerId) ?? 'Someone'} landed on a ${evt.spaceType} space`;
        const character = eventData?.characterId
          ? CHARACTERS.find((c) => c.id === eventData?.characterId)
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
            {eventData?.affectionChange !== undefined && eventData.affectionChange !== 0 && (
              <span
                style={{
                  ...styles.change,
                  color: eventData.affectionChange > 0 ? '#34D399' : '#F87171',
                }}
              >
                {eventData.affectionChange > 0 ? '+' : ''}{eventData.affectionChange}
                {character ? ` with ${character.name}` : ''}
              </span>
            )}
            {eventData?.tokenChange !== undefined && eventData.tokenChange !== 0 && (
              <span style={{ ...styles.change, color: '#FBBF24' }}>
                {eventData.tokenChange > 0 ? '+' : ''}{eventData.tokenChange} tokens
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
