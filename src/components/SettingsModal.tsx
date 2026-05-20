import React, { useState } from 'react';
import { Sun, Moon, Pin, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { StockList } from '../types';

export type RefreshInterval = 'manual' | '1m' | '5m' | '15m';

const SYSTEM_PINNED_IDS = new Set(['permanent-watchlist', 'permanent-portfolio', 'permanent-today']);

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInterval: RefreshInterval;
  onRefreshIntervalChange: (interval: RefreshInterval) => void;
  onImportData: (data: any) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  pinnedLists: StockList[];
  onTogglePinnedVisibility: (id: string, visible: boolean) => void;
  onAddPinnedList: (name: string) => void;
  onDeletePinnedList: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  refreshInterval,
  onRefreshIntervalChange,
  onImportData,
  theme,
  onToggleTheme,
  pinnedLists,
  onTogglePinnedVisibility,
  onAddPinnedList,
  onDeletePinnedList,
}) => {
  const [newPinnedName, setNewPinnedName] = useState('');

  if (!isOpen) return null;

  const handleAddPinned = () => {
    const trimmed = newPinnedName.trim();
    if (!trimmed) return;
    onAddPinnedList(trimmed);
    setNewPinnedName('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '440px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ margin: 0, marginBottom: '24px' }}>Workbench Settings</h3>

        {/* ── Pinned Lists ── */}
        <div className="input-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Pin size={14} color="var(--accent)" />
            Pinned Lists
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '4px' }}>
              — toggle sidebar visibility
            </span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pinnedLists.map(list => {
              const isSystem = SYSTEM_PINNED_IDS.has(list.id);
              const shownInSidebar = !list.isPinnedHidden;
              return (
                <div
                  key={list.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: 'var(--surface-subtle)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {/* Colour dot */}
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: list.color, flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.15)'
                  }} />

                  {/* Name */}
                  <span style={{ flex: 1, fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {list.name}
                    {isSystem && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 400 }}>
                        system
                      </span>
                    )}
                  </span>

                  {/* Visibility toggle */}
                  <button
                    className="btn"
                    title={shownInSidebar ? 'Hide from sidebar' : 'Show in sidebar'}
                    onClick={() => onTogglePinnedVisibility(list.id, !shownInSidebar)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      borderRadius: '7px',
                      border: `1px solid ${shownInSidebar ? 'var(--accent)' : 'var(--border-color)'}`,
                      background: shownInSidebar ? 'rgba(99,102,241,0.12)' : 'transparent',
                      color: shownInSidebar ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: shownInSidebar ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {shownInSidebar ? <Eye size={13} /> : <EyeOff size={13} />}
                    {shownInSidebar ? 'Shown' : 'Hidden'}
                  </button>

                  {/* Delete — only for custom pinned lists */}
                  {!isSystem && (
                    <button
                      className="btn"
                      title="Remove pinned list"
                      onClick={() => {
                        if (window.confirm(`Remove pinned list "${list.name}"? The list and its tickers will be deleted.`)) {
                          onDeletePinnedList(list.id);
                        }
                      }}
                      style={{
                        padding: '5px',
                        borderRadius: '7px',
                        border: '1px solid transparent',
                        color: 'var(--text-secondary)',
                        opacity: 0.5,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add custom pinned list */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              type="text"
              placeholder="New pinned list name…"
              value={newPinnedName}
              onChange={e => setNewPinnedName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPinned()}
              style={{
                flex: 1,
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              className="btn btn-primary"
              onClick={handleAddPinned}
              disabled={!newPinnedName.trim()}
              style={{
                padding: '8px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                opacity: newPinnedName.trim() ? 1 : 0.4,
              }}
            >
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Custom pinned lists appear at the top of the sidebar, like Watchlist and Portfolio.
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
