import type { GameState } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';
import type { MinigameEndData } from '../hooks/useGameEvents.js';

interface ResultsScreenProps {
  socket: GameSocket;
  gameState: GameState;
  playerId: string;
  minigameEndData: MinigameEndData | null;
}

export function ResultsScreen({ socket, gameState, playerId, minigameEndData }: ResultsScreenProps) {
  const rankings = minigameEndData?.rankings ?? [];
  const rewards = minigameEndData?.rewards ?? [];

  const playerNameMap = new Map(gameState.players.map((p) => [p.id, p.name]));

  const RANK_COLORS = ['#FBBF24', '#9CA3AF', '#CD7F32'];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Minigame Results</h2>

      {rankings.length === 0 ? (
        <p style={styles.waiting}>Tallying scores...</p>
      ) : (
        <div style={styles.rankingList}>
          {rankings.map((r) => {
            const reward = rewards.find((rw) => rw.playerId === r.playerId);
            const isMe = r.playerId === playerId;
            return (
              <div
                key={r.playerId}
                style={{
                  ...styles.row,
                  borderLeft: `4px solid ${RANK_COLORS[r.rank - 1] ?? '#4B5563'}`,
                  background: isMe ? '#1a2744' : '#1F2937',
                }}
              >
                <span style={{ ...styles.rank, color: RANK_COLORS[r.rank - 1] ?? '#9CA3AF' }}>
                  #{r.rank}
                </span>
                <div style={styles.nameCol}>
                  <span style={styles.name}>
                    {playerNameMap.get(r.playerId) ?? 'Unknown'}
                    {isMe ? ' (you)' : ''}
                  </span>
                  {reward && (
                    <span style={styles.reward}>
                      +{reward.affection} affection, +{reward.charmTokens} tokens
                    </span>
                  )}
                </div>
                <span style={styles.score}>{r.score} pts</span>
              </div>
            );
          })}
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
    flex: 1,
    padding: '2rem 1rem',
    gap: '1.5rem',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#F472B6',
  },
  waiting: {
    color: '#9CA3AF',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.5rem',
  },
  rank: {
    fontWeight: 800,
    fontSize: '1.1rem',
    width: '2.5rem',
    flexShrink: 0,
  },
  nameCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    flex: 1,
  },
  name: {
    fontWeight: 600,
    fontSize: '0.95rem',
  },
  reward: {
    fontSize: '0.75rem',
    color: '#34D399',
  },
  score: {
    fontWeight: 700,
    color: '#60A5FA',
    fontSize: '1rem',
    flexShrink: 0,
  },
};
