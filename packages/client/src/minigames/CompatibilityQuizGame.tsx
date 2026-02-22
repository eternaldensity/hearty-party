import { useState, useEffect } from 'react';
import type { CompatibilityQuizTickState } from '@hearty-party/shared';
import { CHARACTERS } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface CompatibilityQuizGameProps {
  socket: GameSocket;
  playerId: string;
  sharedState: unknown;
}

export function CompatibilityQuizGame({ socket, playerId, sharedState }: CompatibilityQuizGameProps) {
  const [answered, setAnswered] = useState(false);
  const [lastRound, setLastRound] = useState(-1);
  const state = sharedState as CompatibilityQuizTickState | null;

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
  const targetChar = CHARACTERS.find((c) => c.id === state.targetCharacterId);

  const handleAnswer = (category: string) => {
    if (answered) return;
    setAnswered(true);
    socket.emit('minigame:submit', { result: { category } });
  };

  return (
    <div style={styles.container}>
      <div style={styles.roundInfo}>
        Round {state.roundIndex + 1}/{state.totalRounds}
        <span style={styles.score}> | Score: {myScore}</span>
      </div>

      <div style={{
        ...styles.targetCard,
        borderColor: targetChar?.color ?? '#6B7280',
      }}>
        <p style={styles.targetLabel}>What would impress...</p>
        <div style={styles.targetName}>
          <div style={{ ...styles.targetDot, background: targetChar?.color ?? '#6B7280' }} />
          <span>{state.targetCharacterName}</span>
        </div>
      </div>

      <div style={styles.questionCard}>
        <p style={styles.question}>{state.question.question}</p>
      </div>

      <div style={styles.options}>
        {state.question.options.map((opt, idx) => (
          <button
            key={idx}
            style={{
              ...styles.optionButton,
              opacity: answered ? 0.6 : 1,
            }}
            onClick={() => handleAnswer(opt.category)}
            disabled={answered}
          >
            {opt.text}
          </button>
        ))}
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
    gap: '0.75rem',
    alignItems: 'center',
    padding: '0.75rem',
  },
  roundInfo: {
    fontSize: '0.9rem',
    color: '#9CA3AF',
  },
  score: {
    color: '#FBBF24',
    fontWeight: 700,
  },
  targetCard: {
    background: '#1F2937',
    borderRadius: '1rem',
    padding: '1rem',
    width: '100%',
    textAlign: 'center',
    border: '2px solid',
  },
  targetLabel: {
    fontSize: '0.8rem',
    color: '#6B7280',
    marginBottom: '0.5rem',
  },
  targetName: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#D1D5DB',
  },
  targetDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  questionCard: {
    background: '#111827',
    borderRadius: '0.75rem',
    padding: '1rem',
    width: '100%',
    textAlign: 'center',
  },
  question: {
    fontSize: '1.05rem',
    color: '#D1D5DB',
    lineHeight: 1.4,
  },
  options: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  },
  optionButton: {
    padding: '0.85rem 1rem',
    borderRadius: '0.75rem',
    border: '2px solid #4B5563',
    background: '#111827',
    color: '#eee',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    minHeight: '48px',
  },
  waiting: {
    color: '#6B7280',
    fontSize: '0.85rem',
  },
};
