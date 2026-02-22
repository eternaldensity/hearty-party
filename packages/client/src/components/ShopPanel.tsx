import type { ItemDef, ItemId } from '@hearty-party/shared';
import type { GameSocket } from '../hooks/useSocket.js';

interface ShopPanelProps {
  socket: GameSocket;
  items: ItemDef[];
  playerTokens: number;
  onDone?: () => void;
}

export function ShopPanel({ socket, items, playerTokens, onDone }: ShopPanelProps) {
  const handleBuy = (itemId: ItemId) => {
    socket.emit('game:shop-buy', { itemId });
  };

  const handleClose = () => {
    socket.emit('game:shop-close');
    onDone?.();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={styles.title}>Gift Shop</h2>
          <span style={styles.tokens}>{playerTokens} tokens</span>
        </div>

        <div style={styles.itemList}>
          {items.map((item) => {
            const canAfford = playerTokens >= item.cost;
            return (
              <div key={item.id} style={styles.itemRow}>
                <div style={styles.itemInfo}>
                  <span style={styles.itemName}>{item.name}</span>
                  <span style={styles.itemDesc}>{item.description}</span>
                </div>
                <button
                  style={{
                    ...styles.buyButton,
                    opacity: canAfford ? 1 : 0.4,
                  }}
                  onClick={() => handleBuy(item.id)}
                  disabled={!canAfford}
                >
                  {item.cost}
                </button>
              </div>
            );
          })}
        </div>

        <button style={styles.closeButton} onClick={handleClose}>
          Done Shopping
        </button>
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
    border: '2px solid #FBBF24',
    maxHeight: '80vh',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#FBBF24',
  },
  tokens: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#FBBF24',
    background: '#374151',
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    background: '#111827',
    borderRadius: '0.5rem',
    gap: '0.75rem',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
    flex: 1,
  },
  itemName: {
    fontWeight: 700,
    fontSize: '0.9rem',
  },
  itemDesc: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
  },
  buyButton: {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: 'none',
    background: '#FBBF24',
    color: '#000',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
    minWidth: '48px',
    minHeight: '40px',
    flexShrink: 0,
  },
  closeButton: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: 'none',
    background: '#374151',
    color: '#eee',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    minHeight: '48px',
  },
};
