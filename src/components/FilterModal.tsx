import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { StockFilters, FilterRule } from '../types';

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
      sectors: [],
      rules: []
    });
  };

  const handleAddRule = () => {
    const newRule: FilterRule = {
      id: Math.random().toString(36).substring(7),
      metric: 'sma20_dist',
      operator: 'above',
      value: ''
    };
    setLocalFilters(prev => ({
      ...prev,
      rules: [...(prev.rules || []), newRule]
    }));
  };

  const handleUpdateRule = (id: string, updates: Partial<FilterRule>) => {
    setLocalFilters(prev => ({
      ...prev,
      rules: (prev.rules || []).map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  const handleRemoveRule = (id: string) => {
    setLocalFilters(prev => ({
      ...prev,
      rules: (prev.rules || []).filter(r => r.id !== id)
    }));
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
    localFilters.sectors.length + 
    (localFilters.rules ? localFilters.rules.length : 0);

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

        <div style={{ marginBottom: '24px' }}>
          <button 
            className={`btn ${localFilters.ownedOnly ? 'btn-primary' : ''}`}
            style={{ 
              width: '100%',
              padding: '10px', 
              fontSize: '14px', 
              gap: '8px',
              border: '1px solid var(--border-color)',
              background: localFilters.ownedOnly ? 'var(--accent)' : 'rgba(0,0,0,0.2)'
            }}
            onClick={() => setLocalFilters({ ...localFilters, ownedOnly: !localFilters.ownedOnly })}
          >
            {localFilters.ownedOnly ? '★ Showing Portfolio Only' : '☆ Show Portfolio Only'}
          </button>
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

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ margin: 0 }}>Advanced Rules</label>
            <button className="btn" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }} onClick={handleAddRule}>
              <Plus size={14} /> Add Rule
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {(localFilters.rules || []).length === 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic', padding: '4px 0' }}>
                No advanced rules active.
              </div>
            )}
            {(localFilters.rules || []).map(rule => (
              <div key={rule.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  value={rule.metric} 
                  onChange={e => handleUpdateRule(rule.id, { metric: e.target.value as FilterRule['metric'] })}
                  style={{ flex: 2 }}
                >
                  <option value="sma10_dist">SMA10 Dist (%)</option>
                  <option value="sma20_dist">SMA20 Dist (%)</option>
                  <option value="sma50_dist">SMA50 Dist (%)</option>
                  <option value="sma100_dist">SMA100 Dist (%)</option>
                  <option value="sma200_dist">SMA200 Dist (%)</option>
                  <option value="perf1M">1M Perf (%)</option>
                  <option value="perf3M">3M Perf (%)</option>
                  <option value="perf1Y">1Y Perf (%)</option>
                  <option value="dividendYield">Dividend Yield (%)</option>
                </select>
                <select 
                  value={rule.operator} 
                  onChange={e => handleUpdateRule(rule.id, { operator: e.target.value as FilterRule['operator'] })}
                  style={{ flex: 1 }}
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                <input 
                  type="number" 
                  value={rule.value} 
                  onChange={e => handleUpdateRule(rule.id, { value: e.target.value })}
                  placeholder="%"
                  style={{ flex: 1, width: '60px' }}
                />
                <button className="btn" style={{ padding: '8px' }} onClick={() => handleRemoveRule(rule.id)}>
                  <Trash2 size={16} opacity={0.5} />
                </button>
              </div>
            ))}
          </div>
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
