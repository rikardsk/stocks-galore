import React from 'react';
import { X, Bell, Calendar, Search } from 'lucide-react';
import type { TickerNotification, Ticker } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: TickerNotification[];
  onClear: () => void;
  onMarkRead: () => void;
  onOpenAlerts: () => void;
  onSelectTicker: (ticker: Ticker) => void;
  allTickers: Ticker[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClear,
  onMarkRead,
  onOpenAlerts,
  onSelectTicker,
  allTickers
}) => {
  const [timeFilter, setTimeFilter] = React.useState<'today' | 'week' | 'all'>('all');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'price' | 'changePercent' | 'crossover'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredNotifications = React.useMemo(() => {
    let filtered = notifications;

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (timeFilter === 'week') {
        cutoff.setDate(now.getDate() - 7);
      }
      filtered = filtered.filter(n => new Date(n.timestamp) >= cutoff);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toUpperCase();
      filtered = filtered.filter(n => n.symbol.toUpperCase().includes(query));
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => {
        // Use the explicit type if available
        if (n.type) return n.type === typeFilter;
        
        // Fallback for legacy notifications
        const msg = n.message.toLowerCase();
        const isCrossover = msg.includes('crossed');
        const isPrice = msg.includes('price') && !isCrossover;
        const isPercent = (msg.includes('change') || msg.includes('%')) && !isCrossover;

        if (typeFilter === 'crossover') return isCrossover;
        if (typeFilter === 'price') return isPrice;
        if (typeFilter === 'changePercent') return isPercent;
        return false;
      });
    }

    return filtered;
  }, [notifications, timeFilter, typeFilter, searchQuery]);

  const topTickers = React.useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach(n => {
      counts[n.symbol] = (counts[n.symbol] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([symbol]) => symbol);
  }, [notifications]);

  React.useEffect(() => {
    if (isOpen && notifications.some(n => !n.isRead)) {
      onMarkRead();
    }
  }, [isOpen, notifications, onMarkRead]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '450px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--accent)" />
            <h3 style={{ margin: 0 }}>Notifications ({filteredNotifications.length})</h3>
          </div>
          <button className="btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="Search ticker..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                background: 'var(--surface-subtle)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px',
                padding: '8px 8px 8px 30px',
                fontSize: '12px',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <div style={{ display: 'flex', background: 'var(--surface-subtle)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)' }}>
            {(['today', 'week', 'all'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setTimeFilter(f)}
                style={{ 
                  padding: '4px 8px', 
                  fontSize: '10px', 
                  borderRadius: '6px',
                  background: timeFilter === f ? 'var(--accent)' : 'transparent',
                  color: timeFilter === f ? 'white' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', background: 'var(--surface-subtle)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
          {(['all', 'price', 'changePercent', 'crossover'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setTypeFilter(f)}
              style={{ 
                flex: 1,
                padding: '4px 2px', 
                fontSize: '9px', 
                borderRadius: '6px',
                background: typeFilter === f ? 'var(--surface-hover)' : 'transparent',
                color: typeFilter === f ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontWeight: typeFilter === f ? 700 : 400
              }}
            >
              {f === 'changePercent' ? '%' : f}
            </button>
          ))}
        </div>

        {topTickers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', width: '100%', marginBottom: '2px' }}>Frequent:</span>
            {topTickers.map(symbol => (
              <button
                key={symbol}
                onClick={() => setSearchQuery(symbol === searchQuery ? '' : symbol)}
                style={{
                  padding: '2px 8px',
                  fontSize: '10px',
                  borderRadius: '100px',
                  background: searchQuery === symbol ? 'var(--accent)' : 'var(--surface-subtle)',
                  border: `1px solid ${searchQuery === symbol ? 'var(--accent)' : 'var(--border-color)'}`,
                  color: searchQuery === symbol ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {symbol}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1, fontSize: '12px', padding: '8px' }}
            onClick={onOpenAlerts}
          >
            Manage Alerts
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, fontSize: '12px', padding: '8px', border: '1px solid var(--border-color)' }}
            onClick={onClear}
            disabled={notifications.length === 0}
          >
            Clear All
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Bell size={40} opacity={0.1} style={{ marginBottom: '16px' }} />
              <p>{notifications.length === 0 ? 'No notifications yet.' : 'No matching notifications.'}</p>
              {notifications.length === 0 && <p style={{ fontSize: '12px', marginTop: '8px' }}>Set up price alerts to stay updated.</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               {filteredNotifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => {
                    const ticker = allTickers.find(t => t.symbol === n.symbol);
                    if (ticker) {
                      onSelectTicker(ticker);
                      onClose();
                    }
                  }}
                  style={{ 
                    padding: '12px', 
                    background: n.isRead ? 'var(--surface-subtle)' : 'rgba(99, 102, 241, 0.1)', 
                    border: `1px solid ${n.isRead ? 'var(--border-color)' : 'rgba(99, 102, 241, 0.3)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, background 0.2s'
                  }}
                  className="notification-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.symbol}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={10} />
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {n.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`
          .notification-card:hover {
            background: var(--surface-hover) !important;
            transform: translateY(-2px);
          }
        `}</style>
      </div>
    </div>
  );
};
