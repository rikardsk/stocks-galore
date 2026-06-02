import React from 'react';
import { Sun, Moon, BellOff, Bell, Eye, EyeOff } from 'lucide-react';

export type RefreshInterval = 'manual' | '1m' | '5m' | '15m';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInterval: RefreshInterval;
  onRefreshIntervalChange: (interval: RefreshInterval) => void;
  onImportData: (data: any) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  searchCharLimit: number;
  onSearchCharLimitChange: (limit: number) => void;
  smaNotificationsEnabled: { sma10: boolean; sma20: boolean };
  onSmaNotificationToggle: (key: 'sma10' | 'sma20') => void;
  showButtonBar: boolean;
  onToggleButtonBar: () => void;
  buttonBarPosition: 'bottom' | 'top' | 'right';
  onButtonBarPositionChange: (position: 'bottom' | 'top' | 'right') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  refreshInterval,
  onRefreshIntervalChange,
  onImportData,
  theme,
  onToggleTheme,
  searchCharLimit,
  onSearchCharLimitChange,
  smaNotificationsEnabled,
  onSmaNotificationToggle,
  showButtonBar,
  onToggleButtonBar,
  buttonBarPosition,
  onButtonBarPositionChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '440px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ margin: 0, marginBottom: '24px' }}>Workbench Settings</h3>

        {/* ── Search Settings ── */}
        <div className="input-group" style={{ marginTop: '24px' }}>
          <label>Search Activation Length</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="range" 
              min="1" 
              max="5" 
              value={searchCharLimit} 
              onChange={(e) => onSearchCharLimitChange(parseInt(e.target.value, 10))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)', minWidth: '20px', textAlign: 'center' }}>
              {searchCharLimit}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Number of characters needed to start filtering the dashboard.
          </div>
        </div>

        {/* ── Refresh Interval ── */}
        <div className="input-group" style={{ marginTop: '24px' }}>
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

        {/* ── Theme ── */}
        <div className="input-group" style={{ marginTop: '24px' }}>
          <label style={{ marginBottom: '12px', display: 'block' }}>Theme Preferences</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => theme !== 'dark' && onToggleTheme()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '10px',
                border: `2px solid ${theme === 'dark' ? 'var(--accent)' : 'var(--border-color)'}`,
                background: theme === 'dark' ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-subtle)',
                color: theme === 'dark' ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: theme === 'dark' ? 700 : 400,
                transition: 'all 0.2s',
              }}
            >
              <Moon size={16} /> Dark
            </button>
            <button
              onClick={() => theme !== 'light' && onToggleTheme()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                borderRadius: '10px',
                border: `2px solid ${theme === 'light' ? 'var(--accent)' : 'var(--border-color)'}`,
                background: theme === 'light' ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-subtle)',
                color: theme === 'light' ? 'var(--accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: theme === 'light' ? 700 : 400,
                transition: 'all 0.2s',
              }}
            >
              <Sun size={16} /> Light
            </button>
          </div>
        </div>

        {/* ── Interface Preferences ── */}
        <div className="input-group" style={{ marginTop: '24px' }}>
          <label style={{ marginBottom: '12px', display: 'block' }}>Interface Preferences</label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${showButtonBar ? 'rgba(99,102,241,0.35)' : 'var(--border-color)'}`,
              background: showButtonBar ? 'rgba(99,102,241,0.07)' : 'var(--surface-subtle)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {showButtonBar ? <Eye size={15} color="var(--accent)" /> : <EyeOff size={15} color="var(--text-secondary)" />}
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: showButtonBar ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}>
                Show Button Bar
              </span>
            </div>
            {/* Toggle switch */}
            <button
              onClick={onToggleButtonBar}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                background: showButtonBar ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.25s',
                flexShrink: 0
              }}
              aria-label="Toggle button bar visibility"
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: showButtonBar ? '22px' : '3px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.25s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            When disabled, the bottom shortcut menu is hidden from view.
          </div>
        </div>

        {/* ── Button Bar Position ── */}
        {showButtonBar && (
          <div className="input-group" style={{ marginTop: '24px' }}>
            <label style={{ marginBottom: '12px', display: 'block' }}>Button Bar Position</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['bottom', 'top', 'right'] as const).map(pos => {
                const isActive = buttonBarPosition === pos;
                return (
                  <button
                    key={pos}
                    onClick={() => onButtonBarPositionChange(pos)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border-color)'}`,
                      background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-subtle)',
                      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 400,
                      textTransform: 'capitalize',
                      transition: 'all 0.2s',
                    }}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Notification Alerts ── */}
        <div className="input-group" style={{ marginTop: '24px' }}>
          <label style={{ marginBottom: '12px', display: 'block' }}>Crossover Notification Alerts</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['sma10', 'sma20'] as const).map(key => {
              const isOn = smaNotificationsEnabled[key];
              const label = key === 'sma10' ? 'SMA 10 Crossover' : 'SMA 20 Crossover';
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${isOn ? 'rgba(99,102,241,0.35)' : 'var(--border-color)'}`,
                    background: isOn ? 'rgba(99,102,241,0.07)' : 'var(--surface-subtle)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isOn
                      ? <Bell size={15} color="var(--accent)" />
                      : <BellOff size={15} color="var(--text-secondary)" />}
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isOn ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}>
                      {label}
                    </span>
                  </div>
                  {/* Toggle switch */}
                  <button
                    onClick={() => onSmaNotificationToggle(key)}
                    style={{
                      width: '44px',
                      height: '24px',
                      borderRadius: '12px',
                      border: 'none',
                      background: isOn ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.25s',
                      flexShrink: 0
                    }}
                    aria-label={`Toggle ${label} notifications`}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '3px',
                      left: isOn ? '22px' : '3px',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left 0.25s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }} />
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            When off, no new crossover notifications will be generated for that SMA.
          </div>
        </div>

        {/* ── Data Management ── */}
        <div className="input-group" style={{ marginTop: '24px' }}>
          <label>Data Management</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '13px', justifyContent: 'center' }}
              onClick={() => {
                import('../storage').then(({ storage }) => storage.exportData());
              }}
            >
              Export Complete Workbench (JSON)
            </button>

            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept=".json"
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const json = JSON.parse(event.target?.result as string);
                      if (window.confirm('This will replace your current workbench data. Are you sure?')) {
                        onImportData(json);
                      }
                    } catch {
                      alert('Invalid JSON file');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <button className="btn" style={{ width: '100%', border: '1px solid var(--border-color)', padding: '10px', fontSize: '13px', justifyContent: 'center' }}>
                Import Workbench JSON File
              </button>
            </div>
          </div>
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
