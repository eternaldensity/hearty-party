import type { HeartCatcherTickState } from '@hearty-party/shared';
import { CHARACTERS } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface HeartCatcherGameProps {
  socket: GameSocket;
  playerId: string;
  sharedState: unknown;
}

export function HeartCatcherGame({ socket, playerId, sharedState }: HeartCatcherGameProps) {
  const state = sharedState as HeartCatcherTickState | null;

  if (!state) {
    return <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Get ready...</p>;
  }

  const myScore = state.scores[playerId] ?? 0;

  const handleCatch = (heartId: string) => {
    socket.emit('minigame:input', { type: 'catch', data: { heartId } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.scoreBar}>
        <span style={styles.myScore}>Your catches: {myScore}</span>
      </div>
      <div style={styles.gameField}>
        {state.hearts
          .filter((h) => h.active)
          .map((heart) => {
            const char = CHARACTERS.find((c) => c.id === heart.characterId);
            return (
              <button
                key={heart.id}
                style={{
                  ...styles.heart,
                  left: `${heart.x}%`,
                  top: `${heart.y}%`,
                  background: char?.color ?? '#F472B6',
                }}
                onClick={() => handleCatch(heart.id)}
              >
                {'\u2764'}
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
    gap: '0.5rem',
  },
  scoreBar: {
    textAlign: 'center',
    padding: '0.25rem',
  },
  myScore: {
    fontWeight: 700,
    color: '#F472B6',
    fontSize: '1rem',
  },
  gameField: {
    position: 'relative',
    flex: 1,
    background: '#111827',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    minHeight: '300px',
  },
  heart: {
    position: 'absolute',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
  },
};
