import type { GameState } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';
import type { MinigameStartData, MinigameTickData } from '../hooks/useGameEvents.js';
import { HeartCatcherGame } from '../minigames/HeartCatcherGame.js';
import { LoveLetterScrambleGame } from '../minigames/LoveLetterScrambleGame.js';
import { SweetNothingsGame } from '../minigames/SweetNothingsGame.js';
import { PerfectMatchGame } from '../minigames/PerfectMatchGame.js';
import { DanceFloorGame } from '../minigames/DanceFloorGame.js';
import { GiftWrapRaceGame } from '../minigames/GiftWrapRaceGame.js';
import { CompatibilityQuizGame } from '../minigames/CompatibilityQuizGame.js';
import { RoseGardenGame } from '../minigames/RoseGardenGame.js';

interface MinigameScreenProps {
  socket: GameSocket;
  gameState: GameState;
  playerId: string;
  minigameStartData: MinigameStartData | null;
  minigameTick: MinigameTickData | null;
}

export function MinigameScreen({ socket, gameState, playerId, minigameStartData, minigameTick }: MinigameScreenProps) {
  if (!minigameStartData) {
    return (
      <div style={styles.loading}>
        <p>Loading minigame...</p>
      </div>
    );
  }

  const { minigame } = minigameStartData;
  const timeRemaining = minigameTick?.timeRemaining ?? minigameStartData.duration;
  const sharedState = minigameTick?.sharedState ?? null;
  const timerSeconds = Math.ceil(timeRemaining / 1000);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.gameName}>{minigame.name}</span>
        <span style={styles.timer}>{timerSeconds}s</span>
      </div>

      <div style={styles.gameArea}>
        {minigame.id === 'heart_catcher' && (
          <HeartCatcherGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigame.id === 'love_letter_scramble' && (
          <LoveLetterScrambleGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigame.id === 'sweet_nothings' && (
          <SweetNothingsGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigame.id === 'perfect_match' && (
          <PerfectMatchGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigame.id === 'dance_floor' && (
          <DanceFloorGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigame.id === 'gift_wrap_race' && (
          <GiftWrapRaceGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigame.id === 'compatibility_quiz' && (
          <CompatibilityQuizGame socket={socket} playerId={playerId} sharedState={sharedState} />
        )}
        {minigame.id === 'rose_garden' && (
          <RoseGardenGame socket={socket} playerId={playerId} sharedState={sharedState} />
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
