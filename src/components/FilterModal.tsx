import React from 'react';
import type { StockFilters } from '../types';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: StockFilters;
  onApplyFilters: (filters: StockFilters) => void;
  availableSectors: string[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  availableSectors
}) => {
  const [localFilters, setLocalFilters] = React.useState<StockFilters>(filters);

  // Sync when reopened
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    setLocalFilters({
      priceMin: '',
      priceMax: '',
      marketCapMin: '',
      marketCapMax: '',
      sectors: []
    });
  };

  const handleToggleSector = (sector: string) => {
    setLocalFilters(prev => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter(s => s !== sector)
        : [...prev.sectors, sector]
    }));
  };

  const activeCount = 
    (localFilters.priceMin ? 1 : 0) + 
    (localFilters.priceMax ? 1 : 0) + 
    (localFilters.marketCapMin ? 1 : 0) + 
    (localFilters.marketCapMax ? 1 : 0) + 
    localFilters.sectors.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Global Item Filters</h3>
          {activeCount > 0 && (
            <span style={{ fontSize: '12px', background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
              {activeCount} active
            </span>
          )}
        </div>

        <div className="input-group">
          <label>Price Range ($)</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="number" 
              placeholder="Min" 
              value={localFilters.priceMin} 
              onChange={e => setLocalFilters({ ...localFilters, priceMin: e.target.value })}
            />
            <span style={{ color: 'var(--text-secondary)' }}>to</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={localFilters.priceMax} 
              onChange={e => setLocalFilters({ ...localFilters, priceMax: e.target.value })}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Market Cap Range (Billions)</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input 
              type="number" 
              placeholder="Min (B)" 
              value={localFilters.marketCapMin} 
              onChange={e => setLocalFilters({ ...localFilters, marketCapMin: e.target.value })}
            />
            <span style={{ color: 'var(--text-secondary)' }}>to</span>
            <input 
              type="number" 
              placeholder="Max (B)" 
              value={localFilters.marketCapMax} 
              onChange={e => setLocalFilters({ ...localFilters, marketCapMax: e.target.value })}
            />
          </div>
        </div>

        <div className="input-group">
          <label>Sectors</label>
          {availableSectors.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic', padding: '8px 0' }}>
              No sectors available from loaded stocks.
            </div>
          ) : (
            <div className="sector-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '8px' }}>
              {availableSectors.map(sector => (
                <label key={sector} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, padding: '4px 0' }}>
                  <input 
                    type="checkbox" 
                    checked={localFilters.sectors.includes(sector)}
                    onChange={() => handleToggleSector(sector)}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{sector}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onApplyFilters(localFilters); onClose(); }}>
            Apply Filters
          </button>
          <button className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }} onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
