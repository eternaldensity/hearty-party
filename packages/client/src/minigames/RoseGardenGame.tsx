import type { RoseGardenTickState } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface RoseGardenGameProps {
  socket: GameSocket;
  playerId: string;
  sharedState: unknown;
}

const PLAYER_COLORS = [
  '#F472B6', '#60A5FA', '#34D399', '#FBBF24',
  '#A78BFA', '#FB923C', '#2DD4BF', '#F87171',
];

export function RoseGardenGame({ socket, playerId, sharedState }: RoseGardenGameProps) {
  const state = sharedState as RoseGardenTickState | null;

  if (!state) {
    return <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Get ready...</p>;
  }

  const myScore = state.scores[playerId] ?? 0;
  const isMyTurn = state.currentPlayerId === playerId;
  const playerIds = Object.keys(state.scores);
  const myColorIndex = playerIds.indexOf(playerId);

  const getColor = (ownerId: string | null): string => {
    if (!ownerId) return '#1F2937';
    const idx = playerIds.indexOf(ownerId);
    return PLAYER_COLORS[idx % PLAYER_COLORS.length];
  };

  const handlePlace = (row: number, col: number) => {
    if (!isMyTurn) return;
    socket.emit('minigame:input', { type: 'place', data: { row, col } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.info}>
        <span style={styles.score}>Your roses: {myScore}</span>
        <span style={styles.round}>Round {state.roundIndex + 1}/{state.totalRounds}</span>
      </div>

      {isMyTurn && (
        <p style={styles.turnLabel}>Your turn! Tap an empty cell to plant.</p>
      )}
      {!isMyTurn && state.currentPlayerId && (
        <p style={styles.waitLabel}>Waiting for other player...</p>
      )}
      {!state.currentPlayerId && (
        <p style={styles.waitLabel}>Roses spreading...</p>
      )}

      <div style={{
        ...styles.grid,
        gridTemplateColumns: `repeat(${state.gridSize}, 1fr)`,
      }}>
        {state.grid.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              style={{
                ...styles.cell,
                background: getColor(cell.owner),
                cursor: isMyTurn && !cell.owner ? 'pointer' : 'default',
                border: cell.owner === playerId ? '2px solid #fff' : '1px solid #374151',
              }}
              onClick={() => handlePlace(r, c)}
              disabled={!isMyTurn || cell.owner !== null}
            >
              {cell.owner && '\u2740'}
            </button>
          ))
        )}
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <div style={{ ...styles.legendDot, background: PLAYER_COLORS[myColorIndex % PLAYER_COLORS.length] }} />
          <span>You</span>
        </div>
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
    alignItems: 'center',
    padding: '0.75rem',
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
  round: {
    color: '#9CA3AF',
    fontSize: '0.85rem',
  },
  turnLabel: {
    color: '#34D399',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  waitLabel: {
    color: '#6B7280',
    fontSize: '0.85rem',
  },
  grid: {
    display: 'grid',
    gap: '3px',
    width: '100%',
    maxWidth: '360px',
  },
  cell: {
    aspectRatio: '1',
    borderRadius: '0.35rem',
    color: '#fff',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    padding: 0,
  },
  legend: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.25rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    color: '#9CA3AF',
    fontSize: '0.8rem',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
};
