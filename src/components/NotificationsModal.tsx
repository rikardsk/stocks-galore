import React from 'react';
import { X, Bell, Calendar } from 'lucide-react';
import type { TickerNotification } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: TickerNotification[];
  onClear: () => void;
  onMarkRead: () => void;
  onOpenAlerts: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClear,
  onMarkRead,
  onOpenAlerts
}) => {
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
            <h3 style={{ margin: 0 }}>Notifications</h3>
          </div>
          <button className="btn" onClick={onClose}><X size={20} /></button>
        </div>

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
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Bell size={40} opacity={0.1} style={{ marginBottom: '16px' }} />
              <p>No notifications yet.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>Set up price alerts to stay updated.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  style={{ 
                    padding: '12px', 
                    background: n.isRead ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.1)', 
                    border: `1px solid ${n.isRead ? 'var(--border-color)' : 'rgba(99, 102, 241, 0.3)'}`,
                    borderRadius: '8px'
                  }}
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
      </div>
    </div>
  );
};
