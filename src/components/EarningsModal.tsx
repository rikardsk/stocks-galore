import React, { useMemo, useState } from 'react';
import { X, Calendar, Briefcase, Star, ChevronRight } from 'lucide-react';
import type { Ticker } from '../types';

interface EarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker[];
  watchlistSymbols: Set<string>;
  onSelectTicker: (ticker: Ticker) => void;
}

type FilterMode = 'all' | 'owned' | 'watchlist';

const getLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDayLabels = (date: Date, offset: number): { title: string; subtitle: string } => {
  const isYesterday = offset === -1;
  const isToday = offset === 0;
  const isTomorrow = offset === 1;

  let title = '';
  if (isYesterday) {
    title = 'Yesterday';
  } else if (isToday) {
    title = 'Today';
  } else if (isTomorrow) {
    title = 'Tomorrow';
  } else {
    title = date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  const subtitle = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { title, subtitle };
};

export const EarningsModal: React.FC<EarningsModalProps> = ({
  isOpen,
  onClose,
  tickers,
  watchlistSymbols,
  onSelectTicker
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const days = useMemo(() => {
    const list = [];
    const baseTime = Date.now();
    for (let offset = -1; offset <= 3; offset++) {
      const date = new Date(baseTime + offset * 86400000);
      const dateStr = getLocalDateString(date);
      const labels = getDayLabels(date, offset);
      list.push({ offset, dateStr, ...labels });
    }
    return list;
  }, []);

  const uniqueTickers = useMemo(() => {
    const seen = new Set<string>();
    return tickers.filter(t => {
      if (seen.has(t.symbol)) return false;
      seen.add(t.symbol);
      return true;
    });
  }, [tickers]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxWidth: '1300px', 
          width: '95%', 
          background: 'var(--surface-modal)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Calendar size={24} color="var(--accent)" />
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>Earnings Calendar</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Earnings schedule from Yesterday to the next 3 days
              </p>
            </div>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close modal"><X /></button>
        </div>

        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexShrink: 0 }}>
          <FilterButton active={filterMode === 'all'} onClick={() => setFilterMode('all')}>All Stocks</FilterButton>
          <FilterButton active={filterMode === 'owned'} onClick={() => setFilterMode('owned')}>
            <Briefcase size={12} style={{ marginRight: '6px' }} /> Owned Stocks
          </FilterButton>
          <FilterButton active={filterMode === 'watchlist'} onClick={() => setFilterMode('watchlist')}>
            <Star size={12} style={{ marginRight: '6px' }} /> Watchlist Stocks
          </FilterButton>
        </div>

        {/* 5-column layout */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))', 
            gap: '16px', 
            overflowY: 'auto',
            flex: 1,
            paddingRight: '4px'
          }}
        >
          {days.map(day => (
            <EarningsColumn
              key={day.dateStr}
              day={day}
              tickers={uniqueTickers}
              filterMode={filterMode}
              watchlistSymbols={watchlistSymbols}
              onSelectTicker={onSelectTicker}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const FilterButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button 
    onClick={onClick}
    style={{
      padding: '6px 12px',
      borderRadius: '20px',
      border: active ? '1px solid var(--accent)' : '1px solid var(--border-color)',
      background: active ? 'var(--accent)' : 'var(--surface-subtle)',
      color: active ? '#ffffff' : 'var(--text-secondary)',
      fontSize: '12px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
  >
    {children}
  </button>
);

interface EarningsColumnProps {
  day: { title: string; subtitle: string; dateStr: string; offset: number };
  tickers: Ticker[];
  filterMode: FilterMode;
  watchlistSymbols: Set<string>;
  onSelectTicker: (ticker: Ticker) => void;
}

const EarningsColumn: React.FC<EarningsColumnProps> = ({ day, tickers, filterMode, watchlistSymbols, onSelectTicker }) => {
  const filtered = useMemo(() => {
    return tickers.filter(t => {
      if (!t.stats.earningsDate) return false;
      const earningsDate = t.stats.earningsDate.trim();
      if (earningsDate !== day.dateStr) return false;
      if (filterMode === 'owned' && !t.isOwned) return false;
      if (filterMode === 'watchlist' && !watchlistSymbols.has(t.symbol)) return false;
      return true;
    });
  }, [tickers, day.dateStr, filterMode, watchlistSymbols]);

  const isToday = day.offset === 0;

  return (
    <div 
      style={{ 
        background: 'var(--surface-subtle)', 
        borderRadius: '12px', 
        border: isToday ? '2px solid var(--accent)' : '1px solid var(--border-color)', 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '250px',
        overflow: 'hidden'
      }}
    >
      <div 
        style={{ 
          padding: '12px', 
          background: isToday ? 'rgba(99, 102, 241, 0.1)' : 'var(--surface-inset)', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: isToday ? 'var(--accent)' : 'var(--text-primary)' }}>
            {day.title}
          </h4>
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{day.subtitle}</span>
        </div>
        <span 
          style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            background: isToday ? 'var(--accent)' : 'var(--border-color)', 
            color: '#fff', 
            padding: '2px 6px', 
            borderRadius: '10px' 
          }}
        >
          {filtered.length}
        </span>
      </div>

      <div style={{ padding: '8px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '11px', fontStyle: 'italic' }}>
            No earnings
          </div>
        ) : (
          filtered.map(ticker => (
            <TickerRow key={ticker.id} ticker={ticker} onSelectTicker={onSelectTicker} />
          ))
        )}
      </div>
    </div>
  );
};

const TickerRow: React.FC<{ ticker: Ticker; onSelectTicker: (ticker: Ticker) => void }> = ({ ticker, onSelectTicker }) => {
  const gain = parseFloat(ticker.stats.changePercent.replace('%', '')) || 0;
  const isPos = gain >= 0;

  return (
    <div
      onClick={() => onSelectTicker(ticker)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        borderRadius: '8px',
        background: 'var(--surface-inset)',
        borderLeft: ticker.isOwned ? '3px solid #f59e0b' : 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: 0
      }}
      className="earnings-row"
    >
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, marginRight: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{ticker.symbol}</span>
          {ticker.isOwned && <span style={{ fontSize: '8px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>OWNED</span>}
        </div>
        <span 
          style={{ 
            fontSize: '10px', 
            color: 'var(--text-secondary)', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}
          title={ticker.name}
        >
          {ticker.name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <span 
          style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: isPos ? '#10b981' : '#ef4444',
            background: isPos ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
        >
          {isPos ? '+' : ''}{gain.toFixed(2)}%
        </span>
        <ChevronRight size={12} color="var(--text-secondary)" />
      </div>
      <style>{`
        .earnings-row:hover {
          background: var(--surface-hover) !important;
          transform: translateX(2px);
        }
      `}</style>
    </div>
  );
};
