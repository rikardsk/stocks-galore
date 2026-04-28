import React from 'react';

export type RefreshInterval = 'manual' | '1m' | '5m' | '15m';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInterval: RefreshInterval;
  onRefreshIntervalChange: (interval: RefreshInterval) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  refreshInterval,
  onRefreshIntervalChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
        <h3 style={{ margin: 0, marginBottom: '24px' }}>Workbench Settings</h3>

        <div className="input-group">
          <label>Data Refresh Interval</label>
          <select 
            value={refreshInterval} 
            onChange={(e) => onRefreshIntervalChange(e.target.value as RefreshInterval)}
          >
            <option value="manual">Manual (Default)</option>
            <option value="1m">Every 1 Minute</option>
            <option value="5m">Every 5 Minutes</option>
            <option value="15m">Every 15 Minutes</option>
          </select>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            When set to manual, data will only refresh when you click the Refresh All button in the toolbar.
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '24px', opacity: 0.5 }}>
          <label>Theme Preferences (Coming Soon)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
              <input type="radio" checked readOnly/> Dark Mode
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed', margin: 0 }}>
              <input type="radio" disabled/> Light Mode
            </label>
          </div>
        </div>

        <div className="input-group" style={{ marginTop: '24px', opacity: 0.5 }}>
          <label>Advanced (Coming Soon)</label>
           <button className="btn" style={{ width: '100%', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '10px', fontSize: '13px' }} disabled>
            Export Complete Workbench JSON Data
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
