import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { StockFilters, FilterRule } from '../types';
import { countActiveFilters } from '../types';

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
      rules: [],
      ownedOnly: false,
      earningsOnly: false,
      perfFilterValue: 0,
      perfFilterDirection: 'none',
      perfFilterTimeframe: 'today',
      fiftyTwoWeekFilter: 50,
      fiftyTwoWeekDirection: 'none',
      peFilter: 20,
      peDirection: 'none',
      volumeFilter: 'none'
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

  const activeCount = countActiveFilters(localFilters);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '540px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ margin: 0 }}>Global Item Filters</h3>
            {activeCount > 0 && (
              <span style={{ fontSize: '12px', background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                {activeCount} active
              </span>
            )}
          </div>
          <button className="btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', marginBottom: '8px', display: 'flex', flexDirection: 'column' }}>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
          <button 
            className={`btn ${localFilters.ownedOnly ? 'btn-primary' : ''}`}
            style={{ 
              flex: 1,
              padding: '10px', 
              fontSize: '13px', 
              gap: '6px',
              border: '1px solid var(--border-color)',
              background: localFilters.ownedOnly ? 'var(--accent)' : 'rgba(0,0,0,0.2)'
            }}
            onClick={() => setLocalFilters({ ...localFilters, ownedOnly: !localFilters.ownedOnly })}
          >
            {localFilters.ownedOnly ? '★ Portfolio' : '☆ Portfolio'}
          </button>
          <button 
            className={`btn ${localFilters.earningsOnly ? 'btn-primary' : ''}`}
            style={{ 
              flex: 1,
              padding: '10px', 
              fontSize: '13px', 
              gap: '6px',
              border: '1px solid var(--border-color)',
              background: localFilters.earningsOnly ? 'var(--accent)' : 'rgba(0,0,0,0.2)'
            }}
            onClick={() => setLocalFilters({ ...localFilters, earningsOnly: !localFilters.earningsOnly })}
          >
            {localFilters.earningsOnly ? '📈 Earnings' : '📉 Earnings'}
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

        <div style={{ 
          background: 'var(--surface-subtle)', 
          borderRadius: '8px', 
          padding: '10px', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              PERCENTAGE GAIN / LOSS
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {([
                  { label: 'Today', value: 'today' },
                  { label: 'Yesterday', value: 'yesterday' },
                  { label: '1M', value: '1M' },
                  { label: '3M', value: '3M' },
                  { label: '1Y', value: '1Y' }
                ] as const).map(t => (
                  <button
                    key={t.value}
                    onClick={() => setLocalFilters({ ...localFilters, perfFilterTimeframe: t.value })}
                    style={{
                      padding: '2px 6px',
                      fontSize: '9px',
                      borderRadius: '4px',
                      background: localFilters.perfFilterTimeframe === t.value ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      color: localFilters.perfFilterTimeframe === t.value ? 'white' : 'var(--text-secondary)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {(['above', 'below'] as const).map(dir => {
                  const isActive = localFilters.perfFilterDirection === dir;
                  return (
                    <button
                      key={dir}
                      onClick={() => setLocalFilters({
                        ...localFilters,
                        perfFilterDirection: localFilters.perfFilterDirection === dir ? 'none' : dir
                      })}
                      style={{
                        padding: '2px 8px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {dir}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setLocalFilters({
                ...localFilters,
                perfFilterValue: Math.max(-100, (localFilters.perfFilterValue ?? 0) - 1)
              })}
              disabled={localFilters.perfFilterDirection === 'none'}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                cursor: localFilters.perfFilterDirection === 'none' ? 'not-allowed' : 'pointer',
                minWidth: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: localFilters.perfFilterDirection === 'none' ? 0.3 : 1
              }}
            >
              -
            </button>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="-100"
                max="100"
                value={localFilters.perfFilterValue ?? 0}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  perfFilterValue: parseInt(e.target.value)
                })}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent)',
                  height: '4px',
                  borderRadius: '2px',
                  outline: 'none',
                  opacity: localFilters.perfFilterDirection === 'none' ? 0.3 : 1,
                  cursor: localFilters.perfFilterDirection === 'none' ? 'not-allowed' : 'pointer'
                }}
                disabled={localFilters.perfFilterDirection === 'none'}
              />
              {localFilters.perfFilterDirection !== 'none' && (
                <div style={{
                  position: 'absolute',
                  left: `${((localFilters.perfFilterValue ?? 0) + 100) / 2}%`,
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
                  {(localFilters.perfFilterValue ?? 0) > 0 ? '+' : ''}{localFilters.perfFilterValue}%
                </div>
              )}
            </div>
            <button
              onClick={() => setLocalFilters({
                ...localFilters,
                perfFilterValue: Math.min(100, (localFilters.perfFilterValue ?? 0) + 1)
              })}
              disabled={localFilters.perfFilterDirection === 'none'}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                cursor: localFilters.perfFilterDirection === 'none' ? 'not-allowed' : 'pointer',
                minWidth: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: localFilters.perfFilterDirection === 'none' ? 0.3 : 1
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* 52 Week Range Filter */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>52 WEEK RANGE</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setLocalFilters({ ...localFilters, fiftyTwoWeekFilter: 99, fiftyTwoWeekDirection: 'above' })}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    borderRadius: '4px',
                    background: localFilters.fiftyTwoWeekFilter === 99 && localFilters.fiftyTwoWeekDirection === 'above' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: localFilters.fiftyTwoWeekFilter === 99 && localFilters.fiftyTwoWeekDirection === 'above' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ATH
                </button>
                <button
                  onClick={() => setLocalFilters({ ...localFilters, fiftyTwoWeekFilter: 1, fiftyTwoWeekDirection: 'below' })}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    borderRadius: '4px',
                    background: localFilters.fiftyTwoWeekFilter === 1 && localFilters.fiftyTwoWeekDirection === 'below' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: localFilters.fiftyTwoWeekFilter === 1 && localFilters.fiftyTwoWeekDirection === 'below' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ATL
                </button>
              </div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {(['above', 'below'] as const).map(dir => {
                  const isActive = localFilters.fiftyTwoWeekDirection === dir;
                  return (
                    <button
                      key={dir}
                      onClick={() => setLocalFilters({
                        ...localFilters,
                        fiftyTwoWeekDirection: localFilters.fiftyTwoWeekDirection === dir ? 'none' : dir
                      })}
                      style={{
                        padding: '2px 8px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {dir}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setLocalFilters({
                ...localFilters,
                fiftyTwoWeekFilter: Math.max(0, (localFilters.fiftyTwoWeekFilter ?? 50) - 1)
              })}
              disabled={localFilters.fiftyTwoWeekDirection === 'none' || (localFilters.fiftyTwoWeekFilter ?? 50) <= 0}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                cursor: localFilters.fiftyTwoWeekDirection === 'none' || (localFilters.fiftyTwoWeekFilter ?? 50) <= 0 ? 'not-allowed' : 'pointer',
                minWidth: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: localFilters.fiftyTwoWeekDirection === 'none' ? 0.3 : 1
              }}
            >
              -
            </button>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={localFilters.fiftyTwoWeekFilter ?? 50}
                onChange={(e) => setLocalFilters({ ...localFilters, fiftyTwoWeekFilter: parseInt(e.target.value) })}
                style={{ 
                  width: '100%',
                  accentColor: 'var(--accent)',
                  height: '4px',
                  borderRadius: '2px',
                  outline: 'none',
                  opacity: localFilters.fiftyTwoWeekDirection === 'none' ? 0.3 : 1,
                  cursor: localFilters.fiftyTwoWeekDirection === 'none' ? 'not-allowed' : 'pointer'
                }}
                disabled={localFilters.fiftyTwoWeekDirection === 'none'}
              />
              {localFilters.fiftyTwoWeekDirection !== 'none' && (
                <div style={{ 
                  position: 'absolute', 
                  left: `${localFilters.fiftyTwoWeekFilter ?? 50}%`, 
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
                  {localFilters.fiftyTwoWeekFilter}%
                </div>
              )}
            </div>
            <button
              onClick={() => setLocalFilters({
                ...localFilters,
                fiftyTwoWeekFilter: Math.min(100, (localFilters.fiftyTwoWeekFilter ?? 50) + 1)
              })}
              disabled={localFilters.fiftyTwoWeekDirection === 'none' || (localFilters.fiftyTwoWeekFilter ?? 50) >= 100}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                cursor: localFilters.fiftyTwoWeekDirection === 'none' || (localFilters.fiftyTwoWeekFilter ?? 50) >= 100 ? 'not-allowed' : 'pointer',
                minWidth: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: localFilters.fiftyTwoWeekDirection === 'none' ? 0.3 : 1
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* P/E Ratio Filter */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>P/E RATIO FILTER</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={() => setLocalFilters({ ...localFilters, peFilter: 15, peDirection: localFilters.peDirection === 'none' ? 'below' : localFilters.peDirection })}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    borderRadius: '4px',
                    background: localFilters.peFilter === 15 && localFilters.peDirection !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: localFilters.peFilter === 15 && localFilters.peDirection !== 'none' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  PE 15
                </button>
                <button
                  onClick={() => setLocalFilters({ ...localFilters, peFilter: 20, peDirection: localFilters.peDirection === 'none' ? 'below' : localFilters.peDirection })}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    borderRadius: '4px',
                    background: localFilters.peFilter === 20 && localFilters.peDirection !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: localFilters.peFilter === 20 && localFilters.peDirection !== 'none' ? 'white' : 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  PE 20
                </button>
              </div>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {(['above', 'below'] as const).map(dir => {
                  const isActive = localFilters.peDirection === dir;
                  return (
                    <button
                      key={dir}
                      onClick={() => setLocalFilters({
                        ...localFilters,
                        peDirection: localFilters.peDirection === dir ? 'none' : dir
                      })}
                      style={{
                        padding: '2px 8px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: isActive ? 'var(--accent)' : 'transparent',
                        color: isActive ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {dir}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setLocalFilters({
                ...localFilters,
                peFilter: Math.max(0, (localFilters.peFilter ?? 20) - 1)
              })}
              disabled={localFilters.peDirection === 'none' || (localFilters.peFilter ?? 20) <= 0}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                cursor: localFilters.peDirection === 'none' || (localFilters.peFilter ?? 20) <= 0 ? 'not-allowed' : 'pointer',
                minWidth: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: localFilters.peDirection === 'none' ? 0.3 : 1
              }}
            >
              -
            </button>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={localFilters.peFilter ?? 20}
                onChange={(e) => setLocalFilters({ ...localFilters, peFilter: parseInt(e.target.value) })}
                style={{ 
                  width: '100%',
                  accentColor: 'var(--accent)',
                  height: '4px',
                  borderRadius: '2px',
                  outline: 'none',
                  opacity: localFilters.peDirection === 'none' ? 0.3 : 1,
                  cursor: localFilters.peDirection === 'none' ? 'not-allowed' : 'pointer'
                }}
                disabled={localFilters.peDirection === 'none'}
              />
              {localFilters.peDirection !== 'none' && (
                <div style={{ 
                  position: 'absolute', 
                  left: `${localFilters.peFilter ?? 20}%`, 
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
                  P/E: {localFilters.peFilter}
                </div>
              )}
            </div>
            <button
              onClick={() => setLocalFilters({
                ...localFilters,
                peFilter: Math.min(100, (localFilters.peFilter ?? 20) + 1)
              })}
              disabled={localFilters.peDirection === 'none' || (localFilters.peFilter ?? 20) >= 100}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-primary)',
                cursor: localFilters.peDirection === 'none' || (localFilters.peFilter ?? 20) >= 100 ? 'not-allowed' : 'pointer',
                minWidth: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: localFilters.peDirection === 'none' ? 0.3 : 1
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Volume Ratio Filter */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>VOLUME VS AVG VOLUME</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['none', '2x', '3x', '4x', '5x'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setLocalFilters({ ...localFilters, volumeFilter: localFilters.volumeFilter === v ? 'none' : v })}
                  style={{
                    padding: '2px 8px',
                    fontSize: '9px',
                    borderRadius: '4px',
                    background: localFilters.volumeFilter === v ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: localFilters.volumeFilter === v ? 'white' : 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}
                >
                  {v === 'none' ? 'OFF' : v}
                </button>
              ))}
            </div>
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

        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexShrink: 0 }}>
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
