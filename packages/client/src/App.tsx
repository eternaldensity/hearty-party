import { useSocket } from './hooks/useSocket.js';
import { useGameState } from './hooks/useGameState.js';
import { Landing } from './screens/Landing.js';
import { Lobby } from './screens/Lobby.js';
import { Board } from './screens/Board.js';
import { GameOver } from './screens/GameOver.js';
import { MinigameScreen } from './screens/MinigameScreen.js';
import { ResultsScreen } from './screens/ResultsScreen.js';

export function App() {
  const { socket, connected } = useSocket();
  const { screen, roomState, gameState, playerId, error, confession, minigameStartData, minigameEndData, clearError } = useGameState(socket);

  if (!socket || !connected) {
    return (
      <div style={styles.connecting}>
        <div style={styles.spinner} />
        <p>Connecting to server...</p>
      </div>
    );
  }

  switch (screen) {
    case 'landing':
      return <Landing socket={socket} error={error} clearError={clearError} />;
    case 'lobby':
      if (roomState && playerId) {
        return (
          <Lobby
            socket={socket}
            roomState={roomState}
            playerId={playerId}
            error={error}
            clearError={clearError}
          />
        );
      }
      return <Landing socket={socket} error={error} clearError={clearError} />;
    case 'board':
      if (gameState && playerId) {
        return <Board socket={socket} gameState={gameState} playerId={playerId} />;
      }
      return <Landing socket={socket} error={error} clearError={clearError} />;
    case 'minigame':
      if (gameState && playerId) {
        return <MinigameScreen socket={socket} gameState={gameState} playerId={playerId} minigameStartData={minigameStartData} />;
      }
      return <Landing socket={socket} error={error} clearError={clearError} />;
    case 'results':
      if (gameState && playerId) {
        return <ResultsScreen socket={socket} gameState={gameState} playerId={playerId} minigameEndData={minigameEndData} />;
      }
      return <Landing socket={socket} error={error} clearError={clearError} />;
    case 'game_over':
      if (gameState && playerId) {
        return <GameOver gameState={gameState} playerId={playerId} confession={confession} />;
      }
      return <Landing socket={socket} error={error} clearError={clearError} />;
    default:
      return (
        <div style={styles.connecting}>
          <p>Screen &quot;{screen}&quot; coming soon...</p>
        </div>
      );
  }
}

const styles: Record<string, React.CSSProperties> = {
  connecting: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: '1rem',
    color: '#9CA3AF',
  },
  spinner: {
    width: '2rem',
    height: '2rem',
    border: '3px solid #374151',
    borderTop: '3px solid #F472B6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};
