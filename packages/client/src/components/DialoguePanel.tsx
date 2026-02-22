import type { DialoguePrompt } from '@hearty-party/shared';
import { CHARACTERS } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface DialoguePanelProps {
  socket: GameSocket;
  prompt: DialoguePrompt;
  onDone?: () => void;
}

export function DialoguePanel({ socket, prompt, onDone }: DialoguePanelProps) {
  const character = CHARACTERS.find((c) => c.id === prompt.characterId);

  const handleChoice = (index: number) => {
    socket.emit('game:dialogue-choice', { choiceIndex: index });
    onDone?.();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div
            style={{
              ...styles.avatar,
              background: character?.color ?? '#6B7280',
            }}
          >
            {character?.name[0] ?? '?'}
          </div>
          <span style={{ ...styles.charName, color: character?.color ?? '#eee' }}>
            {character?.name ?? 'Someone'}
          </span>
        </div>

        <p style={styles.text}>{prompt.text}</p>

        <div style={styles.choices}>
          {prompt.choices.map((choice, i) => (
            <button
              key={i}
              style={styles.choiceButton}
              onClick={() => handleChoice(i)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '1rem',
  },
  panel: {
    background: '#1F2937',
    borderRadius: '1rem',
    padding: '1.5rem',
    maxWidth: '400px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    border: '2px solid #374151',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#000',
  },
  charName: {
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  text: {
    fontSize: '0.95rem',
    lineHeight: 1.5,
    color: '#D1D5DB',
  },
  choices: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  choiceButton: {
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid #4B5563',
    background: '#111827',
    color: '#eee',
    fontSize: '0.9rem',
    cursor: 'pointer',
    textAlign: 'left',
    lineHeight: 1.4,
    minHeight: '48px',
  },
};
