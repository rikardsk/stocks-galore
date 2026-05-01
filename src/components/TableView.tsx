import React, { useState, useMemo } from 'react';
import { X, ArrowUpDown, ArrowUp, ArrowDown, Briefcase, Star, Printer } from 'lucide-react';
import type { Ticker, StockFilters, StockList, ListGroup } from '../types';
import { tickerMatchesFilters } from '../types';

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
  onToggleOwned 
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'symbol', direction: 'asc' });
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedListId, setSelectedListId] = useState<string>('all');

  const filteredTickers = useMemo(() => {
    let result = tickers;

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

    if (!filters) return result;
    return result.filter(t => {
      try {
        return tickerMatchesFilters(t, filters);
      } catch (e) {
        console.error('Error matching filters for ticker:', t.symbol, e);
        return false;
      }
    });
  }, [tickers, filters, selectedGroupId, selectedListId, lists, groups]);

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
      } else if (sortConfig.key === 'marketCap') {
        // Simple string comparison for now, or we could parse it
        aVal = a.stats.marketCap;
        bVal = b.stats.marketCap;
      } else if (sortConfig.key.startsWith('perf')) {
        aVal = a.stats[sortConfig.key as keyof typeof a.stats] || 0;
        bVal = b.stats[sortConfig.key as keyof typeof b.stats] || 0;
      } else if (sortConfig.key === 'dividendYield') {
        aVal = a.stats.dividendYield || 0;
        bVal = b.stats.dividendYield || 0;
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
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px' }}>
          <h2 style={{ margin: 0, whiteSpace: 'nowrap' }} className="print-title">
            Market Overview Table ({filteredTickers.length})
          </h2>
          
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
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '4px 8px' }}
              >
                <option value="all">All Groups</option>
                {groups.map(g => (
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
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '4px 8px' }}
              >
                <option value="all">All Lists</option>
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
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
                background: filters.ownedOnly ? 'var(--accent)' : 'rgba(255,255,255,0.05)'
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
                background: filters.watchlistOnly ? '#6366f1' : 'rgba(255,255,255,0.05)'
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
                background: 'rgba(255,255,255,0.05)'
              }}
              onClick={() => window.print()}
              title="Print current table (first 6 columns)"
            >
              <Printer size={14} /> Print
            </button>
          </div>

          <button className="btn no-print" onClick={onClose}><X /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1c1c21', zIndex: 1 }}>
              <tr>
                <th onClick={() => requestSort('symbol')} style={thStyle} className="print-col">Symbol {getSortIcon('symbol')}</th>
                <th onClick={() => requestSort('name')} style={thStyle} className="print-col">Name {getSortIcon('name')}</th>
                <th onClick={() => requestSort('price')} style={thStyle} className="print-col">Price {getSortIcon('price')}</th>
                <th onClick={() => requestSort('changePercent')} style={thStyle} className="print-col">Change % {getSortIcon('changePercent')}</th>
                <th onClick={() => requestSort('marketCap')} style={thStyle} className="print-col">Cap {getSortIcon('marketCap')}</th>
                <th onClick={() => requestSort('sector')} style={thStyle} className="print-col">Sector {getSortIcon('sector')}</th>
                {[10, 20, 50, 100, 200].map(p => (
                  <th key={p} onClick={() => requestSort(`sma${p}`)} style={{ ...thStyle }} className="no-print">S{p} % {getSortIcon(`sma${p}`)}</th>
                ))}
                <th onClick={() => requestSort('perf1M')} style={thStyle} className="no-print">1M % {getSortIcon('perf1M')}</th>
                <th onClick={() => requestSort('perf3M')} style={thStyle} className="no-print">3M % {getSortIcon('perf3M')}</th>
                <th onClick={() => requestSort('perf1Y')} style={thStyle} className="no-print">1Y % {getSortIcon('perf1Y')}</th>
                <th onClick={() => requestSort('dividendYield')} style={thStyle} className="no-print">Yield % {getSortIcon('dividendYield')}</th>
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
                        <strong style={{ marginLeft: '4px' }}>{ticker.symbol}</strong>
                      </div>
                      <div className="only-print" style={{ fontWeight: 'bold' }}>{ticker.symbol}</div>
                    </td>
                    <td style={tdStyle} className="print-col">{ticker.name}</td>
                    <td style={tdStyle} className="print-col">${ticker.stats?.price || '0.00'}</td>
                    <td style={{ ...tdStyle, color: changePct >= 0 ? '#10b981' : '#ef4444' }} className="print-col">
                      {ticker.stats?.changePercent || '0.00%'}
                    </td>
                    <td style={tdStyle} className="print-col">{ticker.stats?.marketCap}</td>
                    <td style={tdStyle} className="print-col">{ticker.stats?.sector}</td>
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
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  whiteSpace: 'nowrap'
};
