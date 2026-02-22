import type { RoomState } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface LobbyProps {
  socket: GameSocket;
  roomState: RoomState;
  playerId: string;
  error: string | null;
  clearError: () => void;
}

export function Lobby({ socket, roomState, playerId, error, clearError }: LobbyProps) {
  const isHost = roomState.players.find((p) => p.id === playerId)?.isHost ?? false;
  const connectedCount = roomState.players.filter((p) => p.connected).length;

  const handleStart = () => {
    socket.emit('game:start');
  };

  const handleLeave = () => {
    socket.emit('room:leave');
    // The useGameState hook will handle screen transition via room:player-left
    window.location.reload();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Lobby</h2>
        <div style={styles.code}>
          <span style={styles.codeLabel}>Game Code</span>
          <span style={styles.codeValue}>{roomState.code}</span>
        </div>
      </div>

      {error && (
        <div style={styles.error} onClick={clearError}>
          {error}
        </div>
      )}

      <div style={styles.settings}>
        <span>Rounds: {roomState.settings.totalRounds}</span>
        <span>{roomState.settings.cutthroatMode ? 'Cutthroat Mode' : 'Cozy Mode'}</span>
      </div>

      <div style={styles.playerList}>
        <h3 style={styles.playersTitle}>
          Players ({connectedCount}/{roomState.players.length})
        </h3>
        {roomState.players.map((player) => (
          <div
            key={player.id}
            style={{
              ...styles.playerCard,
              opacity: player.connected ? 1 : 0.5,
            }}
          >
            <span style={styles.playerName}>
              {player.name}
              {player.id === playerId && ' (you)'}
            </span>
            {player.isHost && <span style={styles.hostBadge}>Host</span>}
            {!player.connected && <span style={styles.disconnectedBadge}>Disconnected</span>}
          </div>
        ))}
      </div>

      <div style={styles.actions}>
        {isHost && (
          <button
            style={{ ...styles.button, ...styles.startButton }}
            onClick={handleStart}
            disabled={connectedCount < 2}
          >
            {connectedCount < 2 ? 'Waiting for players...' : 'Start Game'}
          </button>
        )}
        {!isHost && (
          <p style={styles.waitingText}>Waiting for the host to start...</p>
        )}
        <button
          style={{ ...styles.button, ...styles.leaveButton }}
          onClick={handleLeave}
        >
          Leave
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '1.5rem',
    gap: '1.25rem',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  code: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: '0.7rem',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  codeValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    letterSpacing: '0.3rem',
    color: '#F472B6',
  },
  settings: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    fontSize: '0.9rem',
    color: '#9CA3AF',
  },
  playerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  playersTitle: {
    fontSize: '1rem',
    color: '#9CA3AF',
    marginBottom: '0.25rem',
  },
  playerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    background: '#1F2937',
    borderRadius: '0.5rem',
  },
  playerName: {
    fontWeight: 600,
  },
  hostBadge: {
    fontSize: '0.75rem',
    padding: '0.2rem 0.5rem',
    background: '#FBBF24',
    color: '#1a1a2e',
    borderRadius: '0.25rem',
    fontWeight: 700,
  },
  disconnectedBadge: {
    fontSize: '0.75rem',
    color: '#EF4444',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  button: {
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    border: 'none',
    fontSize: '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '48px',
  },
  startButton: {
    background: 'linear-gradient(135deg, #F472B6, #EF4444)',
    color: '#fff',
  },
  leaveButton: {
    background: 'transparent',
    color: '#9CA3AF',
    border: '1px solid #374151',
  },
  waitingText: {
    textAlign: 'center',
    color: '#9CA3AF',
    padding: '0.5rem',
  },
  error: {
    background: '#7F1D1D',
    color: '#FCA5A5',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
    cursor: 'pointer',
  },
};
