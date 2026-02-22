import type { DanceFloorTickState, DanceDirection } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface DanceFloorGameProps {
  socket: GameSocket;
  playerId: string;
  sharedState: unknown;
}

const ARROW_MAP: Record<DanceDirection, string> = {
  up: '\u2191',
  down: '\u2193',
  left: '\u2190',
  right: '\u2192',
};

const DIRECTIONS: DanceDirection[] = ['up', 'down', 'left', 'right'];

export function DanceFloorGame({ socket, playerId, sharedState }: DanceFloorGameProps) {
  const state = sharedState as DanceFloorTickState | null;

  if (!state) {
    return <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Get ready...</p>;
  }

  const myScore = state.scores[playerId] ?? 0;
  const myCombo = state.combos[playerId] ?? 0;

  const handleTap = (direction: DanceDirection) => {
    socket.emit('minigame:input', { type: 'dance', data: { direction } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.info}>
        <span style={styles.score}>Score: {myScore}</span>
        <span style={styles.beat}>Beat {state.beatIndex + 1}/{state.totalBeats}</span>
        {myCombo >= 2 && <span style={styles.combo}>Combo x{myCombo}!</span>}
      </div>

      <div style={{
        ...styles.prompt,
        opacity: state.beatActive ? 1 : 0.3,
        transform: state.beatActive ? 'scale(1.1)' : 'scale(0.9)',
      }}>
        <span style={styles.arrow}>{ARROW_MAP[state.currentDirection]}</span>
      </div>

      <div style={styles.buttons}>
        {DIRECTIONS.map((dir) => (
          <button
            key={dir}
            style={{
              ...styles.dirButton,
              gridArea: dir === 'up' ? '1/2' : dir === 'left' ? '2/1' : dir === 'right' ? '2/3' : '2/2',
            }}
            onClick={() => handleTap(dir)}
          >
            {ARROW_MAP[dir]}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '1rem',
    alignItems: 'center',
    padding: '1rem',
  },
  info: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  score: {
    fontWeight: 700,
    color: '#F472B6',
    fontSize: '1rem',
  },
  beat: {
    color: '#9CA3AF',
    fontSize: '0.85rem',
  },
  combo: {
    color: '#FBBF24',
    fontWeight: 800,
    fontSize: '1rem',
  },
  prompt: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: '#1F2937',
    border: '3px solid #A78BFA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s, opacity 0.15s',
  },
  arrow: {
    fontSize: '3rem',
    color: '#A78BFA',
  },
  buttons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 64px)',
    gridTemplateRows: 'repeat(2, 64px)',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  dirButton: {
    width: '64px',
    height: '64px',
    borderRadius: '0.75rem',
    border: '2px solid #6B7280',
    background: '#111827',
    color: '#eee',
    fontSize: '1.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
