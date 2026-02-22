import { useEffect, useState } from 'react';
import type { GameState, PlayerState, GamePhase } from '@hearty-party/shared';
import { SPACE_COLORS, BOARD_SIZE } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';
import { BoardSpace } from '../components/BoardSpace.js';
import { DiceRoll } from '../components/DiceRoll.js';
import { AffectionMeter } from '../components/AffectionMeter.js';

interface BoardProps {
  socket: GameSocket;
  gameState: GameState;
  playerId: string;
}

const PHASE_LABELS: Partial<Record<GamePhase, string>> = {
  game_start: 'Game Starting...',
  round_start: 'Round Starting...',
  dice_phase: 'Roll the Dice!',
  move_phase: 'Moving...',
  space_phase: 'Space Events',
  round_end: 'Round Complete',
};

const PLAYER_COLORS = [
  '#F87171', '#60A5FA', '#34D399', '#FBBF24',
  '#A78BFA', '#FB923C', '#2DD4BF', '#F472B6',
];

export function Board({ socket, gameState, playerId }: BoardProps) {
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
  const [movingPath, setMovingPath] = useState<number[]>([]);
  const [animPos, setAnimPos] = useState<number | null>(null);

  const myPlayer = gameState.players.find((p) => p.id === playerId);
  const activePlayer = gameState.players[gameState.activePlayerIndex];

  // Listen for movement animation events
  useEffect(() => {
    const onMoving = ({ playerId: pid, path, finalSpace }: { playerId: string; path: number[]; finalSpace: number }) => {
      setMovingPlayerId(pid);
      setMovingPath(path);
      // Animate step by step
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step < path.length) {
          setAnimPos(path[step]);
        } else {
          clearInterval(interval);
          setAnimPos(null);
          setMovingPlayerId(null);
          setMovingPath([]);
        }
      }, 300);
    };

    socket.on('game:player-moving', onMoving);
    return () => { socket.off('game:player-moving', onMoving); };
  }, [socket]);

  // Listen for dice results
  useEffect(() => {
    const onDice = ({ rolls }: { rolls: Array<{ playerId: string; value: number }> }) => {
      // The gameState update from server will reflect the rolls
    };
    socket.on('game:dice-results', onDice);
    return () => { socket.off('game:dice-results', onDice); };
  }, [socket]);

  // Get effective player position (accounting for animation)
  const getPlayerPosition = (p: PlayerState): number => {
    if (p.id === movingPlayerId && animPos !== null) return animPos;
    return p.position;
  };

  // Build the board display — main loop spaces arranged in a rectangle
  const mainSpaces = gameState.board.spaces.slice(0, BOARD_SIZE);
  const branchSpaces = gameState.board.spaces.slice(BOARD_SIZE);

  // Layout: arrange 30 spaces in a rounded rectangle path
  // Top: 0-7, Right: 8-14, Bottom: 15-22, Left: 23-29
  const topRow = mainSpaces.slice(0, 8);
  const rightCol = mainSpaces.slice(8, 15);
  const bottomRow = mainSpaces.slice(15, 23).reverse();
  const leftCol = mainSpaces.slice(23, 30).reverse();

  const playersOnSpace = (spaceIdx: number) =>
    gameState.players.filter((p) => getPlayerPosition(p) === spaceIdx);

  const isActiveSpace = (spaceIdx: number) =>
    gameState.phase === 'move_phase' && activePlayer && getPlayerPosition(activePlayer) === spaceIdx;

  // Branch path choice UI
  const needsPathChoice =
    gameState.phase === 'move_phase' &&
    activePlayer?.id === playerId &&
    activePlayer.lastRoll > 0 &&
    !movingPlayerId;

  const handlePathChoice = (pathIndex: number) => {
    socket.emit('game:choose-path', { pathIndex });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.roundLabel}>
          Round {gameState.currentRound}/{gameState.totalRounds}
        </span>
        <span style={styles.phaseLabel}>
          {PHASE_LABELS[gameState.phase] ?? gameState.phase}
        </span>
        <span style={styles.tokens}>
          {myPlayer ? `${myPlayer.charmTokens} tokens` : ''}
        </span>
      </div>

      {/* Dice Phase UI */}
      {gameState.phase === 'dice_phase' && myPlayer && (
        <DiceRoll
          socket={socket}
          player={myPlayer}
          allPlayers={gameState.players}
        />
      )}

      {/* Move Phase — show who's moving */}
      {gameState.phase === 'move_phase' && activePlayer && !needsPathChoice && (
        <div style={styles.moveInfo}>
          <p>{activePlayer.name} is moving... (rolled {activePlayer.lastRoll})</p>
        </div>
      )}

      {/* Board */}
      <div style={styles.boardContainer}>
        <div style={styles.board}>
          {/* Top row */}
          <div style={styles.topRow}>
            {topRow.map((space) => (
              <BoardSpace
                key={space.index}
                space={space}
                players={playersOnSpace(space.index)}
                isActive={isActiveSpace(space.index)}
              />
            ))}
          </div>

          {/* Middle section: left col, center area, right col */}
          <div style={styles.middleSection}>
            <div style={styles.leftCol}>
              {leftCol.map((space) => (
                <BoardSpace
                  key={space.index}
                  space={space}
                  players={playersOnSpace(space.index)}
                  isActive={isActiveSpace(space.index)}
                />
              ))}
            </div>

            {/* Center area — branch paths + player info */}
            <div style={styles.centerArea}>
              {/* Branch spaces */}
              {branchSpaces.length > 0 && (
                <div style={styles.branches}>
                  <div style={styles.branchGroup}>
                    <span style={styles.branchLabel}>Path A</span>
                    <div style={styles.branchPath}>
                      {branchSpaces.slice(0, 3).map((space) => (
                        <BoardSpace
                          key={space.index}
                          space={space}
                          players={playersOnSpace(space.index)}
                          isActive={isActiveSpace(space.index)}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={styles.branchGroup}>
                    <span style={styles.branchLabel}>Path B</span>
                    <div style={styles.branchPath}>
                      {branchSpaces.slice(3, 6).map((space) => (
                        <BoardSpace
                          key={space.index}
                          space={space}
                          players={playersOnSpace(space.index)}
                          isActive={isActiveSpace(space.index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Affection meters in center */}
              {myPlayer && (
                <div style={styles.myAffection}>
                  <AffectionMeter affection={myPlayer.affection} compact />
                </div>
              )}
            </div>

            <div style={styles.rightCol}>
              {rightCol.map((space) => (
                <BoardSpace
                  key={space.index}
                  space={space}
                  players={playersOnSpace(space.index)}
                  isActive={isActiveSpace(space.index)}
                />
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div style={styles.bottomRow}>
            {bottomRow.map((space) => (
              <BoardSpace
                key={space.index}
                space={space}
                players={playersOnSpace(space.index)}
                isActive={isActiveSpace(space.index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Player standings */}
      <div style={styles.standings}>
        {gameState.players.map((p, i) => {
          const total = Object.values(p.affection).reduce((s, v) => s + v, 0);
          return (
            <div
              key={p.id}
              style={{
                ...styles.standingRow,
                borderLeft: `3px solid ${PLAYER_COLORS[i % PLAYER_COLORS.length]}`,
                opacity: p.connected ? 1 : 0.5,
              }}
            >
              <span style={styles.standingName}>
                {p.name}{p.id === playerId ? ' (you)' : ''}
              </span>
              <span style={styles.standingScore}>{total}</span>
            </div>
          );
        })}
      </div>

      {/* Space phase events */}
      {gameState.phase === 'space_phase' && activePlayer && (
        <div style={styles.spaceEvent}>
          <p>{activePlayer.name} landed on a space...</p>
        </div>
      )}

      {/* Round end */}
      {gameState.phase === 'round_end' && (
        <div style={styles.roundEnd}>
          <p>Round {gameState.currentRound} complete!</p>
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
    padding: '0.75rem',
    gap: '0.5rem',
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
  },
  roundLabel: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#F472B6',
  },
  phaseLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#D1D5DB',
  },
  tokens: {
    fontSize: '0.8rem',
    color: '#FBBF24',
  },
  moveInfo: {
    textAlign: 'center',
    padding: '0.5rem',
    color: '#9CA3AF',
    fontSize: '0.9rem',
  },
  boardContainer: {
    overflow: 'auto',
    padding: '0.25rem',
  },
  board: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 'fit-content',
  },
  topRow: {
    display: 'flex',
    gap: '2px',
    justifyContent: 'center',
  },
  middleSection: {
    display: 'flex',
    gap: '2px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  centerArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '0.5rem',
    minHeight: '200px',
  },
  branches: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    alignItems: 'center',
  },
  branchGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  branchLabel: {
    fontSize: '0.6rem',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  branchPath: {
    display: 'flex',
    gap: '2px',
  },
  myAffection: {
    width: '100%',
    maxWidth: '200px',
  },
  standings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  standingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.35rem 0.5rem',
    background: '#1F2937',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  standingName: {
    fontWeight: 600,
  },
  standingScore: {
    color: '#F472B6',
    fontWeight: 700,
  },
  spaceEvent: {
    textAlign: 'center',
    padding: '0.75rem',
    background: '#1F2937',
    borderRadius: '8px',
    color: '#A78BFA',
  },
  roundEnd: {
    textAlign: 'center',
    padding: '0.75rem',
    color: '#FBBF24',
    fontWeight: 600,
  },
};
