import React from 'react';
import { X, Building2 } from 'lucide-react';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

interface SearchChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  results: SearchResult[];
  onSelect: (symbol: string) => void;
}

export const SearchChoiceModal: React.FC<SearchChoiceModalProps> = ({ 
  isOpen, onClose, query, results, onSelect 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%', background: 'var(--surface-modal)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} color="var(--accent)" />
            <h2 style={{ margin: 0, fontSize: '18px', color: 'var(--text-primary)' }}>Select Company</h2>
          </div>
          <button className="btn" onClick={onClose}><X size={18} /></button>
        </div>
        
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Found multiple results for "<span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{query}</span>". Please choose the correct one:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
          {results.map((res) => (
            <button
              key={res.symbol}
              onClick={() => onSelect(res.symbol)}
              className="search-choice-item"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                width: '100%',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{res.symbol}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {res.name}
                </div>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600, background: 'rgba(99, 102, 241, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                {res.exchange}
              </div>
            </button>
          ))}
        </div>

        <style>{`
          .search-choice-item:hover {
            background: var(--surface-hover) !important;
            border-color: var(--accent) !important;
            transform: translateY(-1px);
          }
          .search-choice-item:active {
            transform: translateY(0);
          }
        `}</style>
      </div>
    </div>
  );
};
