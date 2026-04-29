import React, { useState, useMemo } from 'react';
import { X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Ticker, StockFilters } from '../types';
import { tickerMatchesFilters } from '../types';

interface TableViewProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker[];
  filters?: StockFilters;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc' | 'none';
};

export const TableView: React.FC<TableViewProps> = ({ isOpen, onClose, tickers, filters }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'symbol', direction: 'asc' });

  const filteredTickers = useMemo(() => {
    if (!filters) return tickers;
    return tickers.filter(t => tickerMatchesFilters(t, filters));
  }, [tickers, filters]);

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
      } else {
        aVal = (a as any)[sortConfig.key] || (a.stats as any)[sortConfig.key];
        bVal = (b as any)[sortConfig.key] || (b.stats as any)[sortConfig.key];
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Market Overview Table ({filteredTickers.length} Tickers)</h2>
          <button className="btn" onClick={onClose}><X /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1c1c21', zIndex: 1 }}>
              <tr>
                <th onClick={() => requestSort('symbol')} style={thStyle}>Symbol {getSortIcon('symbol')}</th>
                <th onClick={() => requestSort('name')} style={thStyle}>Name {getSortIcon('name')}</th>
                <th onClick={() => requestSort('price')} style={thStyle}>Price {getSortIcon('price')}</th>
                <th onClick={() => requestSort('changePercent')} style={thStyle}>Change % {getSortIcon('changePercent')}</th>
                <th onClick={() => requestSort('marketCap')} style={thStyle}>Cap {getSortIcon('marketCap')}</th>
                <th onClick={() => requestSort('sector')} style={thStyle}>Sector {getSortIcon('sector')}</th>
                {[10, 20, 50, 100, 200].map(p => (
                  <th key={p} onClick={() => requestSort(`sma${p}`)} style={thStyle}>S{p} % {getSortIcon(`sma${p}`)}</th>
                ))}
                <th onClick={() => requestSort('perf1M')} style={thStyle}>1M % {getSortIcon('perf1M')}</th>
                <th onClick={() => requestSort('perf3M')} style={thStyle}>3M % {getSortIcon('perf3M')}</th>
                <th onClick={() => requestSort('perf1Y')} style={thStyle}>1Y % {getSortIcon('perf1Y')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTickers.map(ticker => {
                const price = parseFloat(ticker.stats.price);
                return (
                  <tr key={ticker.id} className="table-row">
                    <td style={tdStyle}><strong>{ticker.symbol}</strong></td>
                    <td style={tdStyle}>{ticker.name}</td>
                    <td style={tdStyle}>${ticker.stats.price}</td>
                    <td style={{ ...tdStyle, color: parseFloat(ticker.stats.changePercent) >= 0 ? '#10b981' : '#ef4444' }}>
                      {ticker.stats.changePercent}
                    </td>
                    <td style={tdStyle}>{ticker.stats.marketCap}</td>
                    <td style={tdStyle}>{ticker.stats.sector}</td>
                    {[10, 20, 50, 100, 200].map(p => {
                      const sma = ticker.stats[`sma${p}` as keyof typeof ticker.stats] as number | undefined;
                      const dist = sma ? ((price - sma) / sma) * 100 : null;
                      return (
                        <td key={p} style={{ ...tdStyle, color: dist !== null ? (dist >= 0 ? '#10b981' : '#ef4444') : 'inherit' }}>
                          {dist !== null ? dist.toFixed(1) + '%' : '-'}
                        </td>
                      );
                    })}
                    <td style={{ ...tdStyle, color: (ticker.stats.perf1M || 0) >= 0 ? '#10b981' : '#ef4444' }}>{ticker.stats.perf1M}%</td>
                    <td style={{ ...tdStyle, color: (ticker.stats.perf3M || 0) >= 0 ? '#10b981' : '#ef4444' }}>{ticker.stats.perf3M}%</td>
                    <td style={{ ...tdStyle, color: (ticker.stats.perf1Y || 0) >= 0 ? '#10b981' : '#ef4444' }}>{ticker.stats.perf1Y}%</td>
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
