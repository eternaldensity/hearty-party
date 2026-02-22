import { useState } from 'react';
import type { GameSocket } from '../hooks/useSocket.js';
import { DEFAULT_ROUNDS } from '@hearty-party/shared';

interface LandingProps {
  socket: GameSocket;
  error: string | null;
  clearError: () => void;
}

export function Landing({ socket, error, clearError }: LandingProps) {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const handleCreate = () => {
    if (!name.trim()) return;
    socket.emit('room:create', {
      playerName: name.trim(),
      settings: { totalRounds: DEFAULT_ROUNDS, cutthroatMode: false },
    });
  };

  const handleJoin = () => {
    if (!name.trim() || !gameCode.trim()) return;
    socket.emit('room:join', {
      gameCode: gameCode.trim().toUpperCase(),
      playerName: name.trim(),
    });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Hearty Party</h1>
      <p style={styles.subtitle}>A game of love, luck, and rivalry</p>

      {error && (
        <div style={styles.error} onClick={clearError}>
          {error}
        </div>
      )}

      {mode === 'menu' && (
        <div style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={() => { if (name.trim()) setMode('create'); }}
            disabled={!name.trim()}
          >
            Create Game
          </button>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={() => { if (name.trim()) setMode('join'); }}
            disabled={!name.trim()}
          >
            Join Game
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div style={styles.form}>
          <p style={styles.label}>Playing as <strong>{name}</strong></p>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleCreate}
          >
            Start New Game
          </button>
          <button
            style={{ ...styles.button, ...styles.backButton }}
            onClick={() => setMode('menu')}
          >
            Back
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div style={styles.form}>
          <p style={styles.label}>Playing as <strong>{name}</strong></p>
          <input
            style={{ ...styles.input, ...styles.codeInput }}
            type="text"
            placeholder="Game Code"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            maxLength={4}
            autoFocus
          />
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={handleJoin}
            disabled={gameCode.length < 4}
          >
            Join
          </button>
          <button
            style={{ ...styles.button, ...styles.backButton }}
            onClick={() => setMode('menu')}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '2rem',
    gap: '1rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #F472B6, #EF4444, #FBBF24)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: '1.1rem',
    marginBottom: '1.5rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    maxWidth: '320px',
  },
  input: {
    padding: '0.875rem 1rem',
    borderRadius: '0.75rem',
    border: '2px solid #374151',
    background: '#111827',
    color: '#eee',
    fontSize: '1.1rem',
    outline: 'none',
    textAlign: 'center',
  },
  codeInput: {
    fontSize: '1.5rem',
    letterSpacing: '0.5rem',
    fontWeight: 700,
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
  primaryButton: {
    background: 'linear-gradient(135deg, #F472B6, #EF4444)',
    color: '#fff',
  },
  secondaryButton: {
    background: '#374151',
    color: '#eee',
  },
  backButton: {
    background: 'transparent',
    color: '#9CA3AF',
    border: '1px solid #374151',
  },
  label: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: '1rem',
  },
  error: {
    background: '#7F1D1D',
    color: '#FCA5A5',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    width: '100%',
    maxWidth: '320px',
    textAlign: 'center',
    cursor: 'pointer',
  },
};
