import type { GameState } from '@hearty-party/shared';
import { AffectionMeter } from '../components/AffectionMeter.js';
import type { ConfessionData } from '../hooks/useGameState.js';

interface GameOverProps {
  gameState: GameState;
  playerId: string;
  confession: ConfessionData | null;
}

const PLAYER_COLORS = [
  '#F87171', '#60A5FA', '#34D399', '#FBBF24',
  '#A78BFA', '#FB923C', '#2DD4BF', '#F472B6',
];

export function GameOver({ gameState, playerId, confession }: GameOverProps) {
  const standings = gameState.players
    .map((p, i) => ({
      ...p,
      colorIndex: i,
      totalAffection: Object.values(p.affection).reduce((s, v) => s + v, 0),
    }))
    .sort((a, b) => b.totalAffection - a.totalAffection);

  const winner = standings[0];
  const isWinner = winner?.id === playerId;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        {confession ? 'Confession!' : 'Game Over!'}
      </h1>

      <div style={styles.winnerCard}>
        <span style={styles.crown}>{confession ? '\u{1F48C}' : '\u{1F451}'}</span>
        <h2 style={styles.winnerName}>
          {winner?.name}{isWinner ? ' (You!)' : ''} wins!
        </h2>
        {confession ? (
          <span style={styles.winnerScore}>
            Confessed their love to {confession.characterName}!
          </span>
        ) : (
          <span style={styles.winnerScore}>
            {winner?.totalAffection} total affection
          </span>
        )}
      </div>

      <div style={styles.rankingList}>
        {standings.map((p, rank) => (
          <div key={p.id} style={styles.rankRow}>
            <div style={styles.rankLeft}>
              <span style={styles.rankNumber}>#{rank + 1}</span>
              <div
                style={{
                  ...styles.rankDot,
                  background: PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length],
                }}
              />
              <span style={styles.rankName}>
                {p.name}{p.id === playerId ? ' (you)' : ''}
              </span>
            </div>
            <span style={styles.rankScore}>{p.totalAffection}</span>
          </div>
        ))}
      </div>

      {/* Show the local player's affection breakdown */}
      {gameState.players.find((p) => p.id === playerId) && (
        <div style={styles.breakdown}>
          <h3 style={styles.breakdownTitle}>Your Affection</h3>
          <AffectionMeter
            affection={gameState.players.find((p) => p.id === playerId)!.affection}
          />
        </div>
      )}

      <button
        style={styles.playAgain}
        onClick={() => window.location.reload()}
      >
        Play Again
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    padding: '2rem 1.5rem',
    gap: '1.5rem',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #F472B6, #FBBF24)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  winnerCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, #1F293780, #37415180)',
    border: '2px solid #FBBF24',
    borderRadius: '1rem',
    width: '100%',
  },
  crown: {
    fontSize: '2.5rem',
  },
  winnerName: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  winnerScore: {
    color: '#FBBF24',
    fontWeight: 600,
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  },
  rankRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0.75rem',
    background: '#1F2937',
    borderRadius: '0.5rem',
  },
  rankLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  rankNumber: {
    fontWeight: 700,
    color: '#6B7280',
    width: '2rem',
  },
  rankDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  rankName: {
    fontWeight: 600,
  },
  rankScore: {
    fontWeight: 700,
    color: '#F472B6',
  },
  breakdown: {
    width: '100%',
    padding: '1rem',
    background: '#1F2937',
    borderRadius: '0.75rem',
  },
  breakdownTitle: {
    fontSize: '0.9rem',
    color: '#9CA3AF',
    marginBottom: '0.5rem',
  },
  playAgain: {
    padding: '0.875rem 2rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: 'linear-gradient(135deg, #F472B6, #EF4444)',
    color: '#fff',
    fontSize: '1.1rem',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '48px',
  },
};
