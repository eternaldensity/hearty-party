import { useEffect, useState } from 'react';
import type { GameSocket } from '../hooks/useSocket.js';
import { DICE_AUTO_ROLL_MS } from '@hearty-party/shared';
import type { PlayerState } from '@hearty-party/shared';

interface DiceRollProps {
  socket: GameSocket;
  player: PlayerState;
  allPlayers: PlayerState[];
}

const DICE_FACES = ['\u2680', '\u2681', '\u2682', '\u2683', '\u2684', '\u2685'];

export function DiceRoll({ socket, player, allPlayers }: DiceRollProps) {
  const [rolling, setRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DICE_AUTO_ROLL_MS / 1000);

  // Countdown timer
  useEffect(() => {
    if (player.hasRolled) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [player.hasRolled]);

  // Rolling animation
  useEffect(() => {
    if (!rolling) return;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
    }, 80);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setRolling(false);
    }, 600);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [rolling]);

  const handleRoll = () => {
    if (player.hasRolled || rolling) return;
    setRolling(true);
    socket.emit('game:roll-dice');
  };

  const shownValue = player.hasRolled ? player.lastRoll : (rolling ? displayValue : 0);
  const rollersReady = allPlayers.filter((p) => p.connected && p.hasRolled).length;
  const totalRollers = allPlayers.filter((p) => p.connected).length;

  return (
    <div style={styles.container}>
      <div style={styles.diceArea}>
        {shownValue > 0 ? (
          <span style={{ ...styles.diceFace, opacity: rolling ? 0.6 : 1 }}>
            {DICE_FACES[shownValue - 1]}
          </span>
        ) : (
          <span style={styles.dicePlaceholder}>?</span>
        )}
      </div>

      {!player.hasRolled && !rolling && (
        <button style={styles.rollButton} onClick={handleRoll}>
          Roll! ({timeLeft}s)
        </button>
      )}

      {player.hasRolled && (
        <p style={styles.result}>You rolled a {player.lastRoll}!</p>
      )}

      <p style={styles.status}>
        {rollersReady}/{totalRollers} players rolled
      </p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.5rem',
  },
  diceArea: {
    width: '80px',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1F2937',
    borderRadius: '12px',
    border: '2px solid #374151',
  },
  diceFace: {
    fontSize: '3.5rem',
    lineHeight: 1,
  },
  dicePlaceholder: {
    fontSize: '2rem',
    color: '#6B7280',
    fontWeight: 700,
  },
  rollButton: {
    padding: '0.875rem 2rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: 'linear-gradient(135deg, #F472B6, #EF4444)',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: '48px',
    minWidth: '160px',
  },
  result: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#F472B6',
  },
  status: {
    fontSize: '0.85rem',
    color: '#6B7280',
  },
};
