import React from 'react';
import { Sun, Moon, BellOff, Bell, Eye, EyeOff, X, Settings, Check } from 'lucide-react';

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
  searchExactMatch: boolean;
  onToggleSearchExactMatch: () => void;
  smaNotificationsEnabled: { sma10: boolean; sma20: boolean };
  onSmaNotificationToggle: (key: 'sma10' | 'sma20') => void;
  showButtonBar: boolean;
  onToggleButtonBar: () => void;
  buttonBarPosition: 'bottom' | 'top' | 'right';
  onButtonBarPositionChange: (position: 'bottom' | 'top' | 'right') => void;
  showPinned: boolean;
  showGroups: boolean;
  showUngrouped: boolean;
  showArchive: boolean;
  onTogglePinned: () => void;
  onToggleGroups: () => void;
  onToggleUngrouped: () => void;
  onToggleArchive: () => void;
  showTags: boolean;
  onToggleTags: () => void;
  allNotificationsEnabled: boolean;
  onToggleAllNotifications: () => void;
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
  searchExactMatch,
  onToggleSearchExactMatch,
  smaNotificationsEnabled,
  onSmaNotificationToggle,
  showButtonBar,
  onToggleButtonBar,
  buttonBarPosition,
  onButtonBarPositionChange,
  showPinned,
  showGroups,
  showUngrouped,
  showArchive,
  onTogglePinned,
  onToggleGroups,
  onToggleUngrouped,
  onToggleArchive,
  showTags,
  onToggleTags,
  allNotificationsEnabled,
  onToggleAllNotifications,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '540px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color="var(--accent)" />
            <h3 style={{ margin: 0 }}>Workbench Settings</h3>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column' }}>

        {/* ── Search Settings ── */}
        <div style={{ 
          background: 'var(--surface-subtle)', 
          borderRadius: '8px', 
          padding: '10px', 
          border: '1px solid var(--border-color)', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Search Activation Length</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => onSearchCharLimitChange(Math.max(1, searchCharLimit - 1))}
              disabled={searchCharLimit <= 1}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                cursor: searchCharLimit <= 1 ? 'not-allowed' : 'pointer',
                minWidth: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: searchCharLimit <= 1 ? 0.3 : 1
              }}
            >
              -
            </button>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={searchCharLimit} 
                onChange={(e) => onSearchCharLimitChange(parseInt(e.target.value, 10))}
                style={{ 
                  width: '100%',
                  accentColor: 'var(--accent)',
                  height: '4px',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <div style={{ 
                position: 'absolute', 
                left: `${((searchCharLimit - 1) / 4) * 100}%`, 
                top: '-24px', 
                transform: 'translateX(-50%)',
                background: 'var(--accent)',
                color: 'white',
                fontSize: '9px',
                padding: '2px 4px',
                borderRadius: '4px',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}>
                {searchCharLimit} chars
              </div>
            </div>
            <button
              onClick={() => onSearchCharLimitChange(Math.min(5, searchCharLimit + 1))}
              disabled={searchCharLimit >= 5}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                cursor: searchCharLimit >= 5 ? 'not-allowed' : 'pointer',
                minWidth: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: searchCharLimit >= 5 ? 0.3 : 1
              }}
            >
              +
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Number of characters needed to start filtering the dashboard.
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${searchExactMatch ? 'rgba(99,102,241,0.35)' : 'var(--border-color)'}`,
              background: searchExactMatch ? 'rgba(99,102,241,0.07)' : 'var(--surface-subtle)',
              transition: 'all 0.2s',
              marginTop: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {searchExactMatch ? <Check size={15} color="var(--accent)" /> : <X size={15} color="var(--text-secondary)" />}
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: searchExactMatch ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}>
                Exact Match (Ticker / Badges)
              </span>
            </div>
            <button
              onClick={onToggleSearchExactMatch}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                background: searchExactMatch ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.25s',
                flexShrink: 0
              }}
              aria-label="Toggle exact match search"
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: searchExactMatch ? '22px' : '3px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.25s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>
        </div>

        {/* ── Refresh Interval ── */}
        <div style={{ 
          background: 'var(--surface-subtle)', 
          borderRadius: '8px', 
          padding: '10px', 
          border: '1px solid var(--border-color)', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Data Refresh Interval</span>
          <select
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(e.target.value as RefreshInterval)}
            style={{ width: '100%', padding: '8px 12px' }}
          >
            <option value="manual">Manual (Default)</option>
            <option value="1m">Every 1 Minute</option>
            <option value="5m">Every 5 Minutes</option>
            <option value="15m">Every 15 Minutes</option>
          </select>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            When set to manual, data will only refresh when you click the Refresh All button in the toolbar.
          </div>
        </div>

        {/* ── Theme ── */}
        <div style={{ 
          background: 'var(--surface-subtle)', 
          borderRadius: '8px', 
          padding: '10px', 
          border: '1px solid var(--border-color)', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Theme Preferences</span>
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
        <div style={{ 
          background: 'var(--surface-subtle)', 
          borderRadius: '8px', 
          padding: '10px', 
          border: '1px solid var(--border-color)', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Interface Preferences</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: `1px solid ${showTags ? 'rgba(99,102,241,0.35)' : 'var(--border-color)'}`,
                background: showTags ? 'rgba(99,102,241,0.07)' : 'var(--surface-subtle)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {showTags ? <Eye size={15} color="var(--accent)" /> : <EyeOff size={15} color="var(--text-secondary)" />}
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: showTags ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                  Show Tags in Lists
                </span>
              </div>
              <button
                onClick={onToggleTags}
                style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  background: showTags ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.25s',
                  flexShrink: 0
                }}
                aria-label="Toggle tag visibility in lists"
              >
                <span style={{
                  position: 'absolute',
                  top: '3px',
                  left: showTags ? '22px' : '3px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.25s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
              </button>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Choose whether to show the bottom shortcut menu and the custom tags/badges within your lists.
          </div>
        </div>

        {/* ── Sidebar Sections Visibility ── */}
        <div style={{ 
          background: 'var(--surface-subtle)', 
          borderRadius: '8px', 
          padding: '10px', 
          border: '1px solid var(--border-color)', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sidebar Sections</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'pinned', label: 'Show Pinned Section', value: showPinned, toggle: onTogglePinned },
              { key: 'groups', label: 'Show Groups Section', value: showGroups, toggle: onToggleGroups },
              { key: 'ungrouped', label: 'Show Ungrouped Section', value: showUngrouped, toggle: onToggleUngrouped },
              { key: 'archive', label: 'Show Archive Section', value: showArchive, toggle: onToggleArchive },
            ].map(item => (
              <div
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1px solid ${item.value ? 'rgba(99,102,241,0.35)' : 'var(--border-color)'}`,
                  background: item.value ? 'rgba(99,102,241,0.07)' : 'var(--surface-subtle)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {item.value ? <Eye size={15} color="var(--accent)" /> : <EyeOff size={15} color="var(--text-secondary)" />}
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: item.value ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {item.label}
                  </span>
                </div>
                <button
                  onClick={item.toggle}
                  style={{
                    width: '44px',
                    height: '24px',
                    borderRadius: '12px',
                    border: 'none',
                    background: item.value ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.25s',
                    flexShrink: 0
                  }}
                  aria-label={item.label}
                >
                  <span style={{
                    position: 'absolute',
                    top: '3px',
                    left: item.value ? '22px' : '3px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.25s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Choose which sections to display in the sidebar.
          </div>
        </div>

        {/* ── Button Bar Position ── */}
        {showButtonBar && (
          <div style={{ 
            background: 'var(--surface-subtle)', 
            borderRadius: '8px', 
            padding: '10px', 
            border: '1px solid var(--border-color)', 
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Button Bar Position</span>
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
        <div style={{ 
          background: 'var(--surface-subtle)', 
          borderRadius: '8px', 
          padding: '10px', 
          border: '1px solid var(--border-color)', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Notification Settings</span>
          
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: `1px solid ${allNotificationsEnabled ? 'rgba(99,102,241,0.35)' : 'var(--border-color)'}`,
              background: allNotificationsEnabled ? 'rgba(99,102,241,0.07)' : 'var(--surface-subtle)',
              transition: 'all 0.2s',
              marginBottom: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {allNotificationsEnabled
                ? <Bell size={15} color="var(--accent)" />
                : <BellOff size={15} color="var(--text-secondary)" />}
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: allNotificationsEnabled ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}>
                All Notifications Enabled
              </span>
            </div>
            <button
              onClick={onToggleAllNotifications}
              style={{
                width: '44px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                background: allNotificationsEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.25s',
                flexShrink: 0
              }}
              aria-label="Toggle all notifications"
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: allNotificationsEnabled ? '22px' : '3px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'white',
                transition: 'left 0.25s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            opacity: allNotificationsEnabled ? 1 : 0.5,
            pointerEvents: allNotificationsEnabled ? 'auto' : 'none',
            transition: 'opacity 0.2s'
          }}>
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
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            When off, no new crossover notifications or individual alerts will be generated.
          </div>
        </div>

        {/* ── Data Management ── */}
        <div style={{ 
          background: 'var(--surface-subtle)', 
          borderRadius: '8px', 
          padding: '10px', 
          border: '1px solid var(--border-color)', 
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Data Management</span>
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

        {/* ── Storage Status ── */}
        {(() => {
          let totalChars = 0;
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              totalChars += key.length + (localStorage.getItem(key)?.length || 0);
            }
          }
          const usedBytes = totalChars * 2;
          const limitBytes = 5 * 1024 * 1024; // 5MB limit
          const percentUsed = (usedBytes / limitBytes) * 100;
          const isFullWarning = percentUsed >= 80;
          const formatBytesLocal = (bytes: number) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          };

          return (
            <div style={{ 
              background: 'var(--surface-subtle)', 
              borderRadius: '8px', 
              padding: '10px', 
              border: '1px solid var(--border-color)', 
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Local Storage Space</span>
                {isFullWarning && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 'bold' }}>⚠️ ALMOST FULL</span>}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>{formatBytesLocal(usedBytes)} / {formatBytesLocal(limitBytes)}</span>
                <span>{percentUsed.toFixed(1)}%</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', height: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{
                  width: `${percentUsed}%`,
                  background: isFullWarning ? '#ef4444' : 'var(--accent)',
                  height: '100%',
                  borderRadius: '4px',
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Browser limits localStorage to 5MB. Clear old notifications or lists to free up space.
              </div>
            </div>
          );
        })()}

        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexShrink: 0 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

