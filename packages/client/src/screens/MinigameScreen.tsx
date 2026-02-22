import { useEffect, useState } from 'react';
import type { GameState, MinigameDef } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';
import { HeartCatcherGame } from '../minigames/HeartCatcherGame.js';
import { LoveLetterScrambleGame } from '../minigames/LoveLetterScrambleGame.js';
import { SweetNothingsGame } from '../minigames/SweetNothingsGame.js';

interface MinigameScreenProps {
  socket: GameSocket;
  gameState: GameState;
  playerId: string;
}

export function MinigameScreen({ socket, gameState, playerId }: MinigameScreenProps) {
  const [minigameDef, setMinigameDef] = useState<MinigameDef | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [sharedState, setSharedState] = useState<unknown>(null);

  useEffect(() => {
    const onStart = ({ minigame, duration }: { minigame: MinigameDef; duration: number }) => {
      setMinigameDef(minigame);
      setTimeRemaining(duration);
    };

    const onTick = ({ timeRemaining: tr, sharedState: ss }: { timeRemaining: number; sharedState: unknown }) => {
      setTimeRemaining(tr);
      setSharedState(ss);
    };

    socket.on('minigame:start', onStart);
    socket.on('minigame:tick', onTick);
    return () => {
      socket.off('minigame:start', onStart);
      socket.off('minigame:tick', onTick);
    };
  }, [socket]);

  if (!minigameDef) {
    return (
      <div style={styles.loading}>
        <p>Loading minigame...</p>
      </div>
    );
  }

  const timerSeconds = Math.ceil(timeRemaining / 1000);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.gameName}>{minigameDef.name}</span>
        <span style={styles.timer}>{timerSeconds}s</span>
      </div>

      <div style={styles.gameArea}>
        {minigameDef.id === 'heart_catcher' && (
          <HeartCatcherGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigameDef.id === 'love_letter_scramble' && (
          <LoveLetterScrambleGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigameDef.id === 'sweet_nothings' && (
          <SweetNothingsGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    padding: '0.75rem',
    maxWidth: '480px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    marginBottom: '0.5rem',
  },
  gameName: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#F472B6',
  },
  timer: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#FBBF24',
    fontVariantNumeric: 'tabular-nums',
  },
  gameArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#9CA3AF',
  },
};
