import { useState, useEffect } from 'react';
import type { ScrambleTickState } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface LoveLetterScrambleGameProps {
  socket: GameSocket;
  playerId: string;
  sharedState: unknown;
}

export function LoveLetterScrambleGame({ socket, playerId, sharedState }: LoveLetterScrambleGameProps) {
  const [input, setInput] = useState('');
  const [lastRound, setLastRound] = useState(-1);
  const state = sharedState as ScrambleTickState | null;

  // Clear input when round advances
  useEffect(() => {
    if (state && state.roundIndex !== lastRound) {
      setInput('');
      setLastRound(state.roundIndex);
    }
  }, [state?.roundIndex, lastRound]);

  if (!state) {
    return <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Get ready...</p>;
  }

  const myScore = state.scores[playerId] ?? 0;

  const handleSubmit = () => {
    if (!input.trim()) return;
    socket.emit('minigame:submit', { result: { word: input.trim() } });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={styles.container}>
      <div style={styles.roundInfo}>
        Round {state.roundIndex + 1}/{state.totalRounds}
        <span style={styles.score}> | Score: {myScore}</span>
      </div>

      <div style={styles.scrambleCard}>
        <p style={styles.hint}>Hint: {state.hint}</p>
        <p style={styles.scrambled}>{state.scrambledWord}</p>
        <p style={styles.length}>{state.wordLength} letters</p>
      </div>

      {state.roundSolved ? (
        <div style={styles.solved}>
          <p>Solved{state.solvedBy === playerId ? ' by you!' : '!'}</p>
        </div>
      ) : (
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="Type the word..."
            maxLength={state.wordLength + 2}
            autoFocus
          />
          <button style={styles.submitButton} onClick={handleSubmit}>
            Submit
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
    flex: 1,
    gap: '1rem',
    alignItems: 'center',
    padding: '1rem',
  },
  roundInfo: {
    fontSize: '0.9rem',
    color: '#9CA3AF',
  },
  score: {
    color: '#FBBF24',
    fontWeight: 700,
  },
  scrambleCard: {
    background: '#1F2937',
    borderRadius: '1rem',
    padding: '1.5rem',
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  hint: {
    fontSize: '0.85rem',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  scrambled: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#F472B6',
    letterSpacing: '0.15em',
  },
  length: {
    fontSize: '0.8rem',
    color: '#4B5563',
  },
  solved: {
    padding: '1rem',
    background: '#065F46',
    borderRadius: '0.5rem',
    color: '#34D399',
    fontWeight: 700,
    textAlign: 'center',
    width: '100%',
  },
  inputRow: {
    display: 'flex',
    gap: '0.5rem',
    width: '100%',
  },
  input: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid #4B5563',
    background: '#111827',
    color: '#eee',
    fontSize: '1.1rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    minHeight: '48px',
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: '#F472B6',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: '48px',
  },
};
