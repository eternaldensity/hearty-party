import type { PerfectMatchTickState } from '@hearty-party/shared';
import { CHARACTERS } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface PerfectMatchGameProps {
  socket: GameSocket;
  playerId: string;
  sharedState: unknown;
}

export function PerfectMatchGame({ socket, playerId, sharedState }: PerfectMatchGameProps) {
  const state = sharedState as PerfectMatchTickState | null;

  if (!state) {
    return <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Get ready...</p>;
  }

  const myScore = state.scores[playerId] ?? 0;

  const handleFlip = (cardId: number) => {
    socket.emit('minigame:input', { type: 'flip', data: { cardId } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.scoreBar}>
        <span style={styles.myScore}>Your pairs: {myScore}</span>
        {state.lastMatchBy && (
          <span style={styles.lastMatch}>Last match scored!</span>
        )}
      </div>
      <div style={styles.grid}>
        {state.cards.map((card) => {
          const char = CHARACTERS.find((c) => c.id === card.characterId);
          const isRevealed = card.flipped || card.matched;
          return (
            <button
              key={card.id}
              style={{
                ...styles.card,
                background: isRevealed ? (char?.color ?? '#6B7280') : '#374151',
                opacity: card.matched ? 0.4 : 1,
                cursor: card.matched || card.flipped ? 'default' : 'pointer',
              }}
              onClick={() => handleFlip(card.id)}
              disabled={card.matched || card.flipped}
            >
              {isRevealed ? char?.name.charAt(0) ?? '?' : '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '0.75rem',
  },
  scoreBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.25rem 0.5rem',
  },
  myScore: {
    fontWeight: 700,
    color: '#F472B6',
    fontSize: '1rem',
  },
  lastMatch: {
    color: '#34D399',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.5rem',
    padding: '0.5rem',
  },
  card: {
    aspectRatio: '1',
    borderRadius: '0.75rem',
    border: '2px solid #4B5563',
    color: '#fff',
    fontSize: '1.3rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '52px',
  },
};
