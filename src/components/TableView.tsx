import React, { useState, useMemo } from 'react';
import { X, ArrowUpDown, ArrowUp, ArrowDown, Briefcase, Star, Printer } from 'lucide-react';
import type { Ticker, StockFilters, StockList, ListGroup } from '../types';
import { tickerMatchesFilters, formatMarketCap, formatPrice } from '../types';

interface TableViewProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker[];
  filters: StockFilters;
  lists: StockList[];
  groups: ListGroup[];
  onApplyFilters: (filters: StockFilters) => void;
  watchlistSymbols: Set<string>;
  onToggleWatchlist: (ticker: Ticker) => void;
  onToggleOwned: (ticker: Ticker) => void;
  onSelectTicker: (ticker: Ticker) => void;
  theme: 'dark' | 'light';
  customSymbolsFilter?: string[] | null;
  onClearCustomSymbolsFilter?: () => void;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | 'none';
};

export const TableView: React.FC<TableViewProps> = ({ 
  isOpen, 
  onClose, 
  tickers = [], 
  filters, 
  lists = [], 
  groups = [], 
  onApplyFilters, 
  watchlistSymbols = new Set<string>(), 
  onToggleWatchlist, 
  onToggleOwned,
  onSelectTicker,
  theme: _theme = 'dark',
  customSymbolsFilter = null,
  onClearCustomSymbolsFilter
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'symbol', direction: 'asc' });
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<string>('all');

  const allBadges = useMemo(() => {
    const badges = new Set<string>();
    tickers.forEach(t => {
      if (t.badges) {
        t.badges.forEach(b => badges.add(b));
      }
    });
    return Array.from(badges).sort();
  }, [tickers]);

  const filteredTickers = useMemo(() => {
    let result = tickers;

    if (customSymbolsFilter) {
      const symbolsSet = new Set(customSymbolsFilter);
      result = result.filter(t => symbolsSet.has(t.symbol));
    }

    // Filter by group/list first
    if (selectedGroupId !== 'all') {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        const listIds = group.listIds;
        const groupTickers = lists
          .filter(l => listIds.includes(l.id))
          .flatMap(l => l.tickers.map(t => t.symbol));
        const uniqueGroupSymbols = new Set(groupTickers);
        result = result.filter(t => uniqueGroupSymbols.has(t.symbol));
      }
    } else if (selectedListId !== 'all') {
      const list = lists.find(l => l.id === selectedListId);
      if (list) {
        const listSymbols = new Set(list.tickers.map(t => t.symbol));
        result = result.filter(t => listSymbols.has(t.symbol));
      }
    }

    if (filters.watchlistOnly) {
      result = result.filter(t => watchlistSymbols.has(t.symbol));
    }

    if (selectedBadge !== 'all') {
      result = result.filter(t => t.badges?.includes(selectedBadge));
    }

    if (!filters) return result;
    return result.filter(t => {
      try {
        return tickerMatchesFilters(t, filters);
      } catch (e) {
        console.error('Error matching filters for ticker:', t.symbol, e);
        return false;
      }
    });
  }, [tickers, filters, selectedGroupId, selectedListId, selectedBadge, lists, groups, customSymbolsFilter]);

  const sortedTickers = useMemo(() => {
    if (sortConfig.direction === 'none') return filteredTickers;

    return [...filteredTickers].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      // Extract values based on key
      if (sortConfig.key.startsWith('sma')) {
        const period = sortConfig.key.replace('sma', '');
        const key = `sma${period}` as keyof typeof a.stats;
        const aSma = a.stats[key] as number | undefined;
        const bSma = b.stats[key] as number | undefined;
        if (aSma === undefined || bSma === undefined) return 0;
        // Compare distances
        aVal = ((parseFloat(a.stats.price) - aSma) / aSma) * 100;
        bVal = ((parseFloat(b.stats.price) - bSma) / bSma) * 100;
      } else if (sortConfig.key === 'price') {
        aVal = parseFloat(a.stats.price);
        bVal = parseFloat(b.stats.price);
      } else if (sortConfig.key === 'changePercent') {
        aVal = parseFloat(a.stats.changePercent);
        bVal = parseFloat(b.stats.changePercent);
      } else if (sortConfig.key === 'pe') {
        aVal = a.stats.pe ?? Infinity;
        bVal = b.stats.pe ?? Infinity;
      } else if (sortConfig.key === 'week52Range') {
        // Sort by 52w high descending by default
        aVal = a.stats.high52 ?? 0;
        bVal = b.stats.high52 ?? 0;
      } else if (sortConfig.key === 'marketCap') {
        // Simple string comparison for now, or we could parse it
        aVal = a.stats.marketCap;
        bVal = b.stats.marketCap;
      } else if (sortConfig.key.startsWith('perf')) {
        aVal = a.stats[sortConfig.key as keyof typeof a.stats] || 0;
        bVal = b.stats[sortConfig.key as keyof typeof b.stats] || 0;
      } else if (sortConfig.key === 'earningsDate') {
        aVal = a.stats.earningsDate || '9999-99-99'; // Put N/A at the end
        bVal = b.stats.earningsDate || '9999-99-99';
      } else if (sortConfig.key === 'exDividendDate') {
        aVal = a.stats.exDividendDate || '9999-99-99';
        bVal = b.stats.exDividendDate || '9999-99-99';
      } else if (sortConfig.key === 'dividendDate') {
        aVal = a.stats.dividendDate || '9999-99-99';
        bVal = b.stats.dividendDate || '9999-99-99';
      } else if (sortConfig.key === 'dividendYield') {
        aVal = a.stats.dividendYield || 0;
        bVal = b.stats.dividendYield || 0;
      } else if (sortConfig.key === 'ipoDate') {
        aVal = a.stats.ipoDate || '0000-00-00'; // Put oldest first or N/A first?
        bVal = b.stats.ipoDate || '0000-00-00';
      } else {
        const stats = a.stats || {};
        const bStats = b.stats || {};
        aVal = (a as any)[sortConfig.key] || (stats as any)[sortConfig.key];
        bVal = (b as any)[sortConfig.key] || (bStats as any)[sortConfig.key];
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTickers, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | 'none' = 'asc';
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') direction = 'desc';
      else if (sortConfig.direction === 'desc') direction = 'none';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key || sortConfig.direction === 'none') return <ArrowUpDown size={14} opacity={0.3} />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ padding: '40px' }} onClick={onClose}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          width: '100%', 
          maxWidth: '1200px', 
          height: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          background: 'var(--surface-modal)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h2 style={{ margin: 0, whiteSpace: 'nowrap' }} className="print-title">
              Market Overview Table ({filteredTickers.length})
            </h2>
            {customSymbolsFilter && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="no-print">
                <span style={{ 
                  fontSize: '11px', 
                  background: 'rgba(99,102,241,0.15)', 
                  color: 'var(--accent)', 
                  padding: '2px 8px', 
                  borderRadius: '12px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(99,102,241,0.3)'
                }}>
                  Filtered by Notifications ({customSymbolsFilter.length} stocks)
                  <button 
                    onClick={onClearCustomSymbolsFilter} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      color: 'var(--accent)', 
                      cursor: 'pointer', 
                      padding: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      lineHeight: 1
                    }}
                    title="Clear Filter"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flex: 1, justifyContent: 'center' }} className="no-print">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Group:</span>
              <select 
                value={selectedGroupId} 
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setSelectedListId('all'); // Reset list when group changes
                }}
                className="btn"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-color)', padding: '4px 8px' }}
              >
                <option value="all">All Groups</option>
                {[...groups].sort((a, b) => a.name.localeCompare(b.name)).map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>List:</span>
              <select 
                value={selectedListId} 
                onChange={(e) => {
                  setSelectedListId(e.target.value);
                  setSelectedGroupId('all'); // Reset group when list changes
                }}
                className="btn"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-color)', padding: '4px 8px' }}
              >
                <option value="all">All Lists</option>
                {[...lists].filter(l => !l.isProtected && !l.isArchived).sort((a, b) => a.name.localeCompare(b.name)).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tag:</span>
              <select 
                value={selectedBadge} 
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="btn"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-color)', padding: '4px 8px' }}
              >
                <option value="all">All Tags</option>
                {allBadges.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <button 
              className={`btn ${filters.ownedOnly ? 'btn-primary' : ''}`}
              style={{ 
                padding: '4px 12px', 
                fontSize: '12px', 
                gap: '6px',
                border: '1px solid var(--border-color)',
                background: filters.ownedOnly ? 'var(--accent)' : 'var(--surface-subtle)'
              }}
              onClick={() => {
                const nextOwnedOnly = !filters.ownedOnly;
                onApplyFilters({ 
                  ...filters, 
                  ownedOnly: nextOwnedOnly,
                  watchlistOnly: nextOwnedOnly ? false : filters.watchlistOnly 
                });
              }}
              title="Show only stocks you own"
            >
              <Briefcase size={14} fill={filters.ownedOnly ? "white" : "none"} /> Portfolio
            </button>

            <button 
              className={`btn ${filters.watchlistOnly ? 'btn-primary' : ''}`}
              style={{ 
                padding: '4px 12px', 
                fontSize: '12px', 
                gap: '6px',
                border: '1px solid var(--border-color)',
                background: filters.watchlistOnly ? 'var(--accent)' : 'var(--surface-subtle)'
              }}
              onClick={() => {
                const nextWatchlistOnly = !filters.watchlistOnly;
                onApplyFilters({ 
                  ...filters, 
                  watchlistOnly: nextWatchlistOnly,
                  ownedOnly: nextWatchlistOnly ? false : filters.ownedOnly 
                });
              }}
              title="Show only stocks in your watchlist"
            >
              <Star size={14} fill={filters.watchlistOnly ? "white" : "none"} /> Watchlist
            </button>

            <button 
              className="btn"
              style={{ 
                padding: '4px 12px', 
                fontSize: '12px', 
                gap: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface-subtle)'
              }}
              onClick={() => window.print()}
              title="Print current table (first 6 columns)"
            >
              <Printer size={14} /> Print
            </button>
          </div>

          <button className="btn no-print" onClick={onClose}><X /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', background: 'var(--surface-inset)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-modal)', zIndex: 1 }}>
              <tr>
                <th onClick={() => requestSort('symbol')} style={thStyle} className="print-col">Symbol {getSortIcon('symbol')}</th>
                <th onClick={() => requestSort('name')} style={thStyle} className="print-col">Name {getSortIcon('name')}</th>
                <th onClick={() => requestSort('price')} style={thStyle} className="print-col">Price {getSortIcon('price')}</th>
                <th onClick={() => requestSort('changePercent')} style={thStyle} className="print-col">Change % {getSortIcon('changePercent')}</th>
                <th onClick={() => requestSort('week52Range')} style={thStyle} className="no-print">52W Range {getSortIcon('week52Range')}</th>
                <th onClick={() => requestSort('pe')} style={thStyle} className="no-print">P/E {getSortIcon('pe')}</th>
                <th onClick={() => requestSort('marketCap')} style={thStyle} className="print-col">Cap {getSortIcon('marketCap')}</th>
                <th onClick={() => requestSort('sector')} style={thStyle} className="print-col">Sector {getSortIcon('sector')}</th>
                <th style={thStyle}>Tags</th>
                {[10, 20, 50, 100, 200].map(p => (
                  <th key={p} onClick={() => requestSort(`sma${p}`)} style={{ ...thStyle }} className="no-print">S{p} % {getSortIcon(`sma${p}`)}</th>
                ))}
                <th onClick={() => requestSort('perf1M')} style={thStyle} className="no-print">1M % {getSortIcon('perf1M')}</th>
                <th onClick={() => requestSort('perf3M')} style={thStyle} className="no-print">3M % {getSortIcon('perf3M')}</th>
                <th onClick={() => requestSort('perf1Y')} style={thStyle} className="no-print">1Y % {getSortIcon('perf1Y')}</th>
                <th onClick={() => requestSort('dividendYield')} style={thStyle} className="no-print">Yield % {getSortIcon('dividendYield')}</th>
                <th onClick={() => requestSort('exDividendDate')} style={thStyle} className="no-print">Ex-Dividend {getSortIcon('exDividendDate')}</th>
                <th onClick={() => requestSort('dividendDate')} style={thStyle} className="no-print">Pay Date {getSortIcon('dividendDate')}</th>
                <th onClick={() => requestSort('earningsDate')} style={thStyle} className="no-print">Earnings {getSortIcon('earningsDate')}</th>
                <th onClick={() => requestSort('ipoDate')} style={thStyle} className="no-print">IPO {getSortIcon('ipoDate')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTickers.map(ticker => {
                if (!ticker || !ticker.stats) return null;
                const priceStr = ticker.stats.price || '0';
                const price = parseFloat(priceStr);
                const changePct = parseFloat(ticker.stats.changePercent || '0');
                const dividendYield = ticker.stats.dividendYield;
                const yieldStr = typeof dividendYield === 'number' ? dividendYield.toFixed(2) + '%' : '0.00%';
                
                return (
                  <tr 
                    key={ticker.id} 
                    className="table-row"
                    style={{
                      borderLeft: ticker.isOwned ? '3px solid #f59e0b' : 'none',
                      background: ticker.isOwned 
                        ? 'rgba(245, 158, 11, 0.05)'
                        : (ticker.stats.perf1M !== undefined && ticker.stats.perf3M !== undefined && ticker.stats.perf1Y !== undefined)
                          ? (ticker.stats.perf1M > 0 && ticker.stats.perf3M > 0 && ticker.stats.perf1Y > 0)
                            ? 'rgba(16, 185, 129, 0.08)'
                            : (ticker.stats.perf1M < 0 && ticker.stats.perf3M < 0 && ticker.stats.perf1Y < 0)
                              ? 'rgba(239, 68, 68, 0.08)'
                              : 'transparent'
                          : 'transparent'
                    }}
                  >
                    <td style={tdStyle} className="print-col">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="no-print">
                        <button 
                          className="btn no-print" 
                          style={{ padding: '2px', color: ticker.isOwned ? '#f59e0b' : 'var(--text-secondary)', opacity: ticker.isOwned ? 1 : 0.2 }}
                          onClick={() => onToggleOwned(ticker)}
                          title={ticker.isOwned ? "Remove from Portfolio" : "Add to Portfolio"}
                        >
                          <Briefcase size={12} fill={ticker.isOwned ? "#f59e0b" : "none"} />
                        </button>
                         <button 
                          className="btn no-print" 
                          style={{ 
                            padding: '2px', 
                            color: watchlistSymbols.has(ticker.symbol) ? '#6366f1' : 'var(--text-secondary)', 
                            opacity: watchlistSymbols.has(ticker.symbol) ? 1 : 0.2
                          }}
                          onClick={() => onToggleWatchlist(ticker)}
                          title={watchlistSymbols.has(ticker.symbol) ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          <Star size={12} fill={watchlistSymbols.has(ticker.symbol) ? "#6366f1" : "none"} />
                        </button>
                        <strong 
                          style={{ marginLeft: '4px', cursor: 'pointer', color: ticker.isOwned ? '#f59e0b' : 'var(--text-primary)' }}
                          onClick={() => onSelectTicker(ticker)}
                        >
                          {ticker.symbol}
                        </strong>
                      </div>
                      <div className="only-print" style={{ fontWeight: 'bold' }}>{ticker.symbol}</div>
                    </td>
                    <td style={tdStyle} className="print-col">{ticker.name}</td>
                    <td style={tdStyle} className="print-col">{formatPrice(ticker.stats?.price, ticker.stats?.currency)}</td>
                    <td style={{ ...tdStyle, color: changePct >= 0 ? '#10b981' : '#ef4444' }} className="print-col">
                      {ticker.stats?.changePercent || '0.00%'}
                    </td>
                    <td style={{ ...tdStyle, minWidth: '140px' }} className="no-print">
                      {(ticker.stats?.low52 != null && ticker.stats?.high52 != null) ? (() => {
                        const low = ticker.stats.low52!;
                        const high = ticker.stats.high52!;
                        const pct = high > low ? Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100)) : 50;
                        const dotColor = pct <= 30 ? '#ef4444' : pct >= 70 ? '#10b981' : '#f59e0b';
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div style={{ position: 'relative', height: '4px', borderRadius: '2px', background: 'var(--border-color)' }}>
                              <div style={{
                                position: 'absolute',
                                left: 0, top: 0, bottom: 0,
                                width: `${pct}%`,
                                borderRadius: '2px',
                                background: `linear-gradient(to right, #ef4444, ${dotColor})`
                              }} />
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: `${pct}%`,
                                transform: 'translate(-50%, -50%)',
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: dotColor,
                                boxShadow: `0 0 4px ${dotColor}`,
                                border: '1.5px solid var(--surface-modal)'
                              }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                              <span style={{ color: '#ef4444' }}>{formatPrice(low, ticker.stats?.currency, 0)}</span>
                              <span style={{ color: dotColor, fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                              <span style={{ color: '#10b981' }}>{formatPrice(high, ticker.stats?.currency, 0)}</span>
                            </div>
                          </div>
                        );
                      })() : <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>N/A</span>}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }} className="no-print">
                      {ticker.stats?.pe != null ? ticker.stats.pe.toFixed(1) : 'N/A'}
                    </td>
                    <td style={tdStyle} className="print-col">{formatMarketCap(ticker.stats?.marketCap)}</td>
                    <td style={tdStyle} className="print-col">{ticker.stats?.sector}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {ticker.badges?.map(badge => (
                          <span 
                            key={badge}
                            style={{ 
                              fontSize: '10px', 
                              fontWeight: 700, 
                              padding: '2px 6px', 
                              borderRadius: '4px',
                              background: badge === 'EARNINGS BEAT' ? '#10b981' : (badge === 'EARNINGS MISS' || badge === 'NOT PROFITABLE' ? '#ef4444' : 'var(--accent)'),
                              color: 'white'
                            }}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    </td>
                    {[10, 20, 50, 100, 200].map(p => {
                      const sma = ticker.stats ? (ticker.stats[`sma${p}` as keyof typeof ticker.stats] as number | undefined) : undefined;
                      const dist = (sma && price) ? ((price - sma) / sma) * 100 : null;
                      return (
                        <td key={p} style={{ ...tdStyle, color: dist !== null ? (dist >= 0 ? '#10b981' : '#ef4444') : 'inherit' }} className="no-print">
                          {dist !== null ? dist.toFixed(1) + '%' : '-'}
                        </td>
                      );
                    })}
                    <td style={{ ...tdStyle, color: (ticker.stats?.perf1M || 0) >= 0 ? '#10b981' : '#ef4444' }} className="no-print">{ticker.stats?.perf1M || 0}%</td>
                    <td style={{ ...tdStyle, color: (ticker.stats?.perf3M || 0) >= 0 ? '#10b981' : '#ef4444' }} className="no-print">{ticker.stats?.perf3M || 0}%</td>
                    <td style={{ ...tdStyle, color: (ticker.stats?.perf1Y || 0) >= 0 ? '#10b981' : '#ef4444' }} className="no-print">{ticker.stats?.perf1Y || 0}%</td>
                    <td style={{ ...tdStyle, color: '#f59e0b' }} className="no-print">{yieldStr}</td>
                    <td style={{ ...tdStyle, color: '#3b82f6' }} className="no-print">{ticker.stats.exDividendDate || 'N/A'}</td>
                    <td style={{ ...tdStyle, color: '#10b981' }} className="no-print">{ticker.stats.dividendDate || 'N/A'}</td>
                    <td style={{ ...tdStyle, color: 'var(--accent)' }} className="no-print">{ticker.stats.earningsDate || 'N/A'}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }} className="no-print">{ticker.stats.ipoDate || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  borderBottom: '1px solid var(--border-color)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  userSelect: 'none'
};

const tdStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderBottom: '1px solid var(--surface-divider)',
  whiteSpace: 'nowrap'
};
