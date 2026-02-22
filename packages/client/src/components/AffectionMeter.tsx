import { CHARACTERS, MAX_AFFECTION } from '@hearty-party/shared';

interface AffectionMeterProps {
  affection: Record<string, number>;
  compact?: boolean;
}

export function AffectionMeter({ affection, compact }: AffectionMeterProps) {
  return (
    <div style={styles.container}>
      {CHARACTERS.map((char) => {
        const value = affection[char.id] ?? 0;
        const pct = Math.min(100, (value / MAX_AFFECTION) * 100);
        return (
          <div key={char.id} style={styles.row}>
            <span style={{ ...styles.name, color: char.color }}>
              {compact ? char.name[0] : char.name}
            </span>
            <div style={styles.barBg}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${pct}%`,
                  background: char.color,
                }}
              />
            </div>
            {!compact && <span style={styles.value}>{value}</span>}
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  name: {
    fontSize: '0.7rem',
    fontWeight: 700,
    width: '50px',
    textAlign: 'right',
  },
  barBg: {
    flex: 1,
    height: '8px',
    background: '#374151',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  value: {
    fontSize: '0.7rem',
    color: '#9CA3AF',
    width: '24px',
  },
};
