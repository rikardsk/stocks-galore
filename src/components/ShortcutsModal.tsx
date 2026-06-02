import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutItem {
  keys: string[];
  description: string;
}

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  { keys: ['Ctrl', 'Shift', 'S'], description: 'Toggle Sidebar' },
  { keys: ['Ctrl', 'Shift', 'D'], description: 'Refresh All Data' },
  { keys: ['Ctrl', 'Delete'], description: 'Clear Workbench' },
  { keys: ['Ctrl', 'V'], description: 'Open Market Table' },
  { keys: ['Ctrl', 'N'], description: 'Open Analytics' },
  { keys: ['Ctrl', 'K'], description: 'Open Keyboard Shortcuts Map' },
  { keys: ['Ctrl', 'L'], description: 'Create New List' },
  { keys: ['Ctrl', 'R'], description: 'Open Ranking' },
  { keys: ['Ctrl', 'E'], description: 'Open Earnings Calendar' },
  { keys: ['Ctrl', 'X'], description: 'Toggle & Focus Search' },
  { keys: ['Ctrl', 'F'], description: 'Open Filter' },
  { keys: ['Ctrl', 'A'], description: 'Open Notifications' },
  { keys: ['Ctrl', 'S'], description: 'Open Settings' },
  { keys: ['Ctrl', 'Space'], description: 'Toggle Button Bar' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2200 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Keyboard size={22} color="var(--accent)" />
            <h3 style={{ margin: 0 }}>Keyboard Shortcuts</h3>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '16px' }}>
          {SHORTCUTS_DATA.map((item, index) => (
            <div key={index} className="shortcut-row">
              <span className="shortcut-desc">{item.description}</span>
              <div className="shortcut-keys">
                {item.keys.map((key, kIndex) => (
                  <React.Fragment key={kIndex}>
                    {kIndex > 0 && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>+</span>}
                    <kbd className="shortcut-kbd">{key}</kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
