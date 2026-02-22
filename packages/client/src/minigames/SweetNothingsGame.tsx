import { useState, useEffect } from 'react';
import type { SweetNothingsTickState } from '@hearty-party/shared';
import { CHARACTERS } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface SweetNothingsGameProps {
  socket: GameSocket;
  playerId: string;
  sharedState: unknown;
}

export function SweetNothingsGame({ socket, playerId, sharedState }: SweetNothingsGameProps) {
  const [answered, setAnswered] = useState(false);
  const [lastRound, setLastRound] = useState(-1);
  const state = sharedState as SweetNothingsTickState | null;

  // Reset answered state when round advances
  useEffect(() => {
    if (state && state.roundIndex !== lastRound) {
      setAnswered(false);
      setLastRound(state.roundIndex);
    }
  }, [state?.roundIndex, lastRound]);

  if (!state) {
    return <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Get ready...</p>;
  }

  const myScore = state.scores[playerId] ?? 0;

  const handleAnswer = (characterId: string) => {
    if (answered) return;
    setAnswered(true);
    socket.emit('minigame:submit', { result: { characterId } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.roundInfo}>
        Round {state.roundIndex + 1}/{state.totalRounds}
        <span style={styles.score}> | Score: {myScore}</span>
      </div>

      <div style={styles.quoteCard}>
        <p style={styles.quoteLabel}>Who said this?</p>
        <p style={styles.quote}>&ldquo;{state.quote}&rdquo;</p>
      </div>

      <div style={styles.options}>
        {state.options.map((opt) => {
          const char = CHARACTERS.find((c) => c.id === opt.characterId);
          const isCorrect = state.correctCharacterId === opt.characterId;
          const showResult = state.roundAnswered && state.correctCharacterId;
          return (
            <button
              key={opt.characterId}
              style={{
                ...styles.optionButton,
                borderColor: showResult
                  ? isCorrect ? '#34D399' : '#EF4444'
                  : char?.color ?? '#4B5563',
                opacity: answered && !showResult ? 0.6 : 1,
              }}
              onClick={() => handleAnswer(opt.characterId)}
              disabled={answered}
            >
              <div style={{ ...styles.optionDot, background: char?.color ?? '#6B7280' }} />
              {opt.characterName}
            </button>
          );
        })}
      </div>

      {answered && !state.roundAnswered && (
        <p style={styles.waiting}>Waiting for others...</p>
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
  quoteCard: {
    background: '#1F2937',
    borderRadius: '1rem',
    padding: '1.5rem',
    width: '100%',
    textAlign: 'center',
  },
  quoteLabel: {
    fontSize: '0.8rem',
    color: '#6B7280',
    marginBottom: '0.5rem',
  },
  quote: {
    fontSize: '1.15rem',
    fontStyle: 'italic',
    color: '#D1D5DB',
    lineHeight: 1.5,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
  },
  optionButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    borderRadius: '0.75rem',
    border: '2px solid',
    background: '#111827',
    color: '#eee',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '48px',
  },
  optionDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  waiting: {
    color: '#6B7280',
    fontSize: '0.85rem',
  },
};
