import React from 'react';
import { X } from 'lucide-react';
import type { ListGroup } from '../types';

interface AssignGroupModalProps {
  groups: ListGroup[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (groupId: string | null) => void;
  onCreateGroup: () => void;
}

export const AssignGroupModal: React.FC<AssignGroupModalProps> = ({
  groups,
  isOpen,
  onClose,
  onAssign,
  onCreateGroup
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '300px' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Assign to Group</h2>
          <button className="btn" onClick={onClose} style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px' }}>
          <button 
            className="btn" 
            style={{ width: '100%', padding: '10px', justifyContent: 'flex-start', background: 'var(--surface-subtle)' }}
            onClick={() => onAssign(null)}
          >
            Ungrouped (Remove from group)
          </button>
          
          {groups.length > 0 && (
            <div style={{ margin: '8px 0 4px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Existing Groups
            </div>
          )}
          
          {groups.map(g => (
            <button 
              key={g.id}
              className="btn" 
              style={{ width: '100%', padding: '10px', justifyContent: 'flex-start', background: 'var(--surface-subtle)' }}
              onClick={() => onAssign(g.id)}
            >
              📁 {g.name}
            </button>
          ))}
          
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--surface-divider)' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '10px' }}
              onClick={onCreateGroup}
            >
              + Create New Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
