import React, { useMemo, useState } from 'react';
import { X, Calendar, Briefcase, Star, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-react';
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
  const [showEarnings, setShowEarnings] = useState<boolean>(true);
  const [showExDiv, setShowExDiv] = useState<boolean>(true);
  const [showPayDiv, setShowPayDiv] = useState<boolean>(true);
  const [baseOffset, setBaseOffset] = useState<number>(0);

  const days = useMemo(() => {
    const list = [];
    const baseTime = Date.now();
    for (let offset = -1; offset <= 3; offset++) {
      const date = new Date(baseTime + (offset + baseOffset) * 86400000);
      const dateStr = getLocalDateString(date);
      const totalOffset = offset + baseOffset;
      const labels = getDayLabels(date, totalOffset);
      list.push({ offset: totalOffset, dateStr, ...labels });
    }
    return list;
  }, [baseOffset]);

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
          height: '80vh',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>Earnings & Dividend Calendar</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={() => setBaseOffset(prev => prev - 1)}
                    style={{
                      background: 'var(--surface-inset)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    className="nav-btn"
                    title="Previous Day"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => setBaseOffset(0)}
                    disabled={baseOffset === 0}
                    style={{
                      background: baseOffset === 0 ? 'var(--surface-inset)' : 'rgba(99, 102, 241, 0.1)',
                      border: baseOffset === 0 ? '1px solid var(--border-color)' : '1px solid rgba(99, 102, 241, 0.2)',
                      color: baseOffset === 0 ? 'var(--text-secondary)' : 'var(--accent)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: baseOffset === 0 ? 'default' : 'pointer',
                      opacity: baseOffset === 0 ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    Today
                  </button>
                  <button 
                    onClick={() => setBaseOffset(prev => prev + 1)}
                    style={{
                      background: 'var(--surface-inset)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    className="nav-btn"
                    title="Next Day"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Earnings and dividend schedule relative to Today
              </p>
            </div>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close modal"><X /></button>
        </div>

        {/* Filter and Toggle buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px', 
          flexShrink: 0,
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Calendar Event Types */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginRight: '4px' }}>SHOW EVENTS:</span>
            <ToggleButton active={showEarnings} onClick={() => setShowEarnings(!showEarnings)}>Earnings</ToggleButton>
            <ToggleButton active={showExDiv} onClick={() => setShowExDiv(!showExDiv)}>Ex-Dividend Date</ToggleButton>
            <ToggleButton active={showPayDiv} onClick={() => setShowPayDiv(!showPayDiv)}>Pay Date</ToggleButton>
          </div>
          
          {/* Target Filter */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 700, marginRight: '4px' }}>FILTER STOCKS:</span>
            <FilterButton active={filterMode === 'all'} onClick={() => setFilterMode('all')}>All Stocks</FilterButton>
            <FilterButton active={filterMode === 'owned'} onClick={() => setFilterMode('owned')}>
              <Briefcase size={12} style={{ marginRight: '6px' }} /> Owned Stocks
            </FilterButton>
            <FilterButton active={filterMode === 'watchlist'} onClick={() => setFilterMode('watchlist')}>
              <Star size={12} style={{ marginRight: '6px' }} /> Watchlist Stocks
            </FilterButton>
          </div>
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
              showEarnings={showEarnings}
              showExDiv={showExDiv}
              showPayDiv={showPayDiv}
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

const ToggleButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button 
    onClick={onClick}
    style={{
      padding: '6px 12px',
      borderRadius: '20px',
      border: active ? '1px solid var(--accent)' : '1px solid var(--border-color)',
      background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-secondary)',
      fontSize: '12px',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}
  >
    <div style={{
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: active ? 'var(--accent)' : 'transparent',
      border: active ? 'none' : '1.5px solid var(--text-secondary)',
      marginRight: '8px'
    }} />
    {children}
  </button>
);

interface EarningsColumnProps {
  day: { title: string; subtitle: string; dateStr: string; offset: number };
  tickers: Ticker[];
  filterMode: FilterMode;
  watchlistSymbols: Set<string>;
  onSelectTicker: (ticker: Ticker) => void;
  showEarnings: boolean;
  showExDiv: boolean;
  showPayDiv: boolean;
}

const EarningsColumn: React.FC<EarningsColumnProps> = ({ 
  day, 
  tickers, 
  filterMode, 
  watchlistSymbols, 
  onSelectTicker,
  showEarnings,
  showExDiv,
  showPayDiv
}) => {
  const filtered = useMemo(() => {
    return tickers.filter(t => {
      if (filterMode === 'owned' && !t.isOwned) return false;
      if (filterMode === 'watchlist' && !watchlistSymbols.has(t.symbol)) return false;

      const hasEarnings = showEarnings && t.stats.earningsDate && t.stats.earningsDate.trim() === day.dateStr;
      const hasExDiv = showExDiv && t.stats.exDividendDate && t.stats.exDividendDate.trim() === day.dateStr;
      const hasPayDiv = showPayDiv && t.stats.dividendDate && t.stats.dividendDate.trim() === day.dateStr;

      return hasEarnings || hasExDiv || hasPayDiv;
    });
  }, [tickers, day.dateStr, filterMode, watchlistSymbols, showEarnings, showExDiv, showPayDiv]);

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
            No events
          </div>
        ) : (
          filtered.map(ticker => (
            <TickerRow key={ticker.id} ticker={ticker} dayDateStr={day.dateStr} onSelectTicker={onSelectTicker} />
          ))
        )}
      </div>
    </div>
  );
};

const TickerRow: React.FC<{ ticker: Ticker; dayDateStr: string; onSelectTicker: (ticker: Ticker) => void }> = ({ 
  ticker, 
  dayDateStr, 
  onSelectTicker 
}) => {
  const gain = parseFloat(ticker.stats.changePercent.replace('%', '')) || 0;
  const isPos = gain >= 0;

  const isEarnings = ticker.stats.earningsDate && ticker.stats.earningsDate.trim() === dayDateStr;
  const isExDiv = ticker.stats.exDividendDate && ticker.stats.exDividendDate.trim() === dayDateStr;
  const isPayDiv = ticker.stats.dividendDate && ticker.stats.dividendDate.trim() === dayDateStr;

  const dividendYield = ticker.stats.dividendYield;
  const yieldStr = typeof dividendYield === 'number' && dividendYield > 0 ? dividendYield.toFixed(2) + '%' : null;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
          {isEarnings && (
            <span 
              title={
                ticker.stats.earningsTime === 'BMO' ? 'Before Market Open' :
                ticker.stats.earningsTime === 'AMC' ? 'After Market Close' :
                'Earnings Date'
              }
              style={{ 
                fontSize: '8px', 
                color: 'var(--accent)', 
                background: 'rgba(99, 102, 241, 0.1)', 
                padding: '2px 5px', 
                borderRadius: '4px', 
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {ticker.stats.earningsTime === 'BMO' && <Sun size={10} color="#f59e0b" style={{ flexShrink: 0 }} />}
              {ticker.stats.earningsTime === 'AMC' && <Moon size={10} color="#a5b4fc" style={{ flexShrink: 0 }} />}
              EARNINGS
            </span>
          )}
          {isExDiv && (
            <span style={{ 
              fontSize: '8px', 
              color: '#3b82f6', 
              background: 'rgba(59, 130, 246, 0.1)', 
              padding: '1px 4px', 
              borderRadius: '4px', 
              fontWeight: 700 
            }}>EX-DIV {yieldStr && `(${yieldStr})`}</span>
          )}
          {isPayDiv && (
            <span style={{ 
              fontSize: '8px', 
              color: '#10b981', 
              background: 'rgba(16, 185, 129, 0.1)', 
              padding: '1px 4px', 
              borderRadius: '4px', 
              fontWeight: 700 
            }}>PAY-DATE {yieldStr && `(${yieldStr})`}</span>
          )}
        </div>
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
