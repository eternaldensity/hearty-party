import type { BoardSpace as BoardSpaceType, PlayerState } from '@hearty-party/shared';
import { SPACE_COLORS, CHARACTERS } from '@hearty-party/shared';

interface BoardSpaceProps {
  space: BoardSpaceType;
  players: PlayerState[];
  isActive: boolean;
}

const SPACE_LABELS: Record<string, string> = {
  blank: '',
  date_spot: '\u2665',
  gift_shop: '\u2606',
  event: '!',
  love_nest: '\u2764',
  charm_fountain: '\u2B50',
  rival: '\u2694',
};

const PLAYER_COLORS = [
  '#F87171', '#60A5FA', '#34D399', '#FBBF24',
  '#A78BFA', '#FB923C', '#2DD4BF', '#F472B6',
];

export function BoardSpace({ space, players, isActive }: BoardSpaceProps) {
  const color = SPACE_COLORS[space.type] ?? '#9CA3AF';
  const label = SPACE_LABELS[space.type] ?? '';
  const character = space.characterId
    ? CHARACTERS.find((c) => c.id === space.characterId)
    : undefined;

  return (
    <div
      style={{
        ...styles.space,
        borderColor: color,
        boxShadow: isActive ? `0 0 12px ${color}` : 'none',
      }}
    >
      <span style={{ ...styles.label, color }}>{label}</span>
      {character && (
        <span style={{ ...styles.charName, color: character.color }}>
          {character.name[0]}
        </span>
      )}
      {space.index === 0 && <span style={styles.startLabel}>GO</span>}
      {players.length > 0 && (
        <div style={styles.tokens}>
          {players.map((p, i) => (
            <div
              key={p.id}
              style={{
                ...styles.token,
                background: PLAYER_COLORS[i % PLAYER_COLORS.length],
              }}
              title={p.name}
            >
              {p.name[0]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  space: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    border: '2px solid',
    background: '#1F2937',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    fontSize: '0.75rem',
    flexShrink: 0,
  },
  label: {
    fontSize: '1rem',
    fontWeight: 700,
    lineHeight: 1,
  },
  charName: {
    fontSize: '0.6rem',
    fontWeight: 700,
    position: 'absolute',
    bottom: '2px',
  },
  startLabel: {
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#FFF',
  },
  tokens: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    display: 'flex',
    gap: '1px',
  },
  token: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.5rem',
    fontWeight: 700,
    color: '#000',
    border: '1px solid #111827',
  },
};
