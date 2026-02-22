import type { GiftWrapRaceTickState } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface GiftWrapRaceGameProps {
  socket: GameSocket;
  playerId: string;
  sharedState: unknown;
}

export function GiftWrapRaceGame({ socket, playerId, sharedState }: GiftWrapRaceGameProps) {
  const state = sharedState as GiftWrapRaceTickState | null;

  if (!state) {
    return <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Get ready...</p>;
  }

  const myProgress = state.progress[playerId] ?? 0;
  const myTaps = state.tapCounts[playerId] ?? 0;
  const myFinished = state.finished[playerId] ?? false;

  const handleTap = () => {
    if (!myFinished) {
      socket.emit('minigame:input', { type: 'tap', data: {} });
    }
  };

  // Show all players' progress bars
  const playerIds = Object.keys(state.progress);

  return (
    <div style={styles.container}>
      <div style={styles.progressSection}>
        {playerIds.map((pid) => {
          const progress = state.progress[pid] ?? 0;
          const finished = state.finished[pid] ?? false;
          const isMe = pid === playerId;
          return (
            <div key={pid} style={styles.progressRow}>
              <span style={{
                ...styles.label,
                color: isMe ? '#F472B6' : '#6B7280',
                fontWeight: isMe ? 700 : 400,
              }}>
                {isMe ? 'You' : pid.slice(0, 6)}
                {finished && ' \u2713'}
              </span>
              <div style={styles.barBg}>
                <div style={{
                  ...styles.barFill,
                  width: `${progress}%`,
                  background: isMe ? '#F472B6' : '#6B7280',
                }} />
              </div>
              <span style={styles.percent}>{progress}%</span>
            </div>
          );
        })}
      </div>

      <button
        style={{
          ...styles.tapButton,
          opacity: myFinished ? 0.4 : 1,
          transform: myFinished ? 'scale(0.95)' : 'scale(1)',
        }}
        onClick={handleTap}
        disabled={myFinished}
      >
        {myFinished ? 'Done!' : 'TAP!'}
      </button>

      <p style={styles.tapCount}>Taps: {myTaps}</p>
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
  progressSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.8rem',
    width: '60px',
    textAlign: 'right',
  },
  barBg: {
    flex: 1,
    height: '16px',
    background: '#1F2937',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '8px',
    transition: 'width 0.1s',
  },
  percent: {
    fontSize: '0.8rem',
    color: '#9CA3AF',
    width: '40px',
  },
  tapButton: {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    border: '4px solid #FBBF24',
    background: '#111827',
    color: '#FBBF24',
    fontSize: '2rem',
    fontWeight: 800,
    cursor: 'pointer',
    marginTop: '1rem',
    userSelect: 'none',
  },
  tapCount: {
    color: '#6B7280',
    fontSize: '0.9rem',
  },
};
