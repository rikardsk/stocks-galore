import React, { useState } from 'react';
import { Sun, Moon, Pin, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import type { StockList } from '../types';

export type RefreshInterval = 'manual' | '1m' | '5m' | '15m';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInterval: RefreshInterval;
  onRefreshIntervalChange: (interval: RefreshInterval) => void;
  onImportData: (data: any) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  refreshInterval,
  onRefreshIntervalChange,
  onImportData,
  theme,
  onToggleTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '440px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h3 style={{ margin: 0, marginBottom: '24px' }}>Workbench Settings</h3>

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
