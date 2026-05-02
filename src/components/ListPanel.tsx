import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { X, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2, ArrowUpDown, ArrowUpAZ, ArrowDownAZ, Lock, AlertCircle, Briefcase, Star } from 'lucide-react';
import { Sparkline } from './Sparkline';
import type { StockList, StockFilters } from '../types';
import { COUNTRY_FLAGS, tickerMatchesFilters, formatMarketCap } from '../types';

interface ListPanelProps {
  list: StockList;
  onUpdate: (list: StockList) => void;
  onDelete: (id: string) => void;
  onAddTicker: (listId: string) => void;
  onRemoveTicker: (listId: string, tickerId: string) => void;
  onTransferTicker: (fromListId: string, toListId: string, tickerId: string, isCopy: boolean) => void;
  globalFilters?: StockFilters;
  watchlistSymbols: Set<string>;
  onToggleWatchlist: (ticker: any) => void;
}

export const ListPanel: React.FC<ListPanelProps> = ({
  list,
  onUpdate,
  onDelete,
  onAddTicker,
  onRemoveTicker,
  onTransferTicker,
  globalFilters,
  watchlistSymbols,
  onToggleWatchlist
}) => {
  const [isCollapsed, setIsCollapsed] = useState(list.isCollapsed);
  const [showStats, setShowStats] = useState(list.showStats);
  const nodeRef = useRef(null);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onUpdate({ ...list, isCollapsed: !isCollapsed });
  };

  const handleToggleStats = () => {
    setShowStats(!showStats);
    onUpdate({ ...list, showStats: !showStats });
  };

  const handleToggleSort = () => {
    let nextOrder: 'asc' | 'desc' | 'none' = 'asc';
    if (list.sortOrder === 'asc') nextOrder = 'desc';
    else if (list.sortOrder === 'desc') nextOrder = 'none';
    
    onUpdate({ ...list, sortOrder: nextOrder });
  };

  const handleDrag = (_e: any, data: { x: number; y: number }) => {
    onUpdate({ ...list, position: { x: data.x, y: data.y } });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.ctrlKey ? 'copy' : 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const tickerData = e.dataTransfer.getData('ticker');
    if (tickerData) {
      const { listId: fromListId, tickerId } = JSON.parse(tickerData);
      if (fromListId !== list.id || e.ctrlKey) {
        onTransferTicker(fromListId, list.id, tickerId, e.ctrlKey);
      }
    }
  };

  // Filter and Sort tickers logic
  const filteredTickers = globalFilters 
    ? list.tickers.filter(t => tickerMatchesFilters(t, globalFilters))
    : list.tickers;

  const sortedTickers = [...filteredTickers].sort((a, b) => {
    if (list.sortOrder === 'none') return 0;
    const comparison = a.symbol.localeCompare(b.symbol);
    return list.sortOrder === 'asc' ? comparison : -comparison;
  });

  const lastUpdatedTimes = list.tickers.map(t => t.stats.lastUpdated ? new Date(t.stats.lastUpdated).getTime() : 0);
  const maxLastUpdated = Math.max(...lastUpdatedTimes, 0);
  const isFresh = maxLastUpdated > Date.now() - 24 * 60 * 60 * 1000;
  const hasData = maxLastUpdated > 0;
  
  const avgGain = filteredTickers.length > 0 
    ? filteredTickers.reduce((sum, t) => sum + (parseFloat(t.stats.changePercent) || 0), 0) / filteredTickers.length 
    : 0;
  
  const isBigGain = avgGain > 5;
  const isBigLoss = avgGain < -5;

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".panel-header"
      defaultPosition={list.position}
      onStop={handleDrag}
      bounds="parent"
      disabled={list.isProtected}
    >
      <div 
        className="list-panel" 
        ref={nodeRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="panel-header" style={{ 
          background: isBigGain 
            ? 'rgba(16, 185, 129, 0.25)' 
            : isBigLoss 
              ? 'rgba(239, 68, 68, 0.25)' 
              : list.color + '22', 
          borderBottom: `2px solid ${isBigGain ? '#10b981' : isBigLoss ? '#ef4444' : list.color}`,
          cursor: list.isProtected ? 'default' : 'grab'
        }}
        >
          <div className="panel-title" style={{ color: isBigGain ? '#10b981' : isBigLoss ? '#ef4444' : list.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              className="status-bullet" 
              style={{ background: hasData ? (isFresh ? '#10b981' : '#ef4444') : 'transparent', border: hasData ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
              title={hasData ? (isFresh ? 'Updated in last 24h' : 'Stale data (>24h)') : 'No data fetched yet'}
            />
            {list.isProtected && <Lock size={12} opacity={0.6} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                {list.country && COUNTRY_FLAGS[list.country]} {list.name}
              </span>
              <span style={{ opacity: 0.6, fontSize: '11px', fontWeight: 400 }}>
                ({filteredTickers.length})
              </span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                color: avgGain >= 0 ? '#10b981' : '#ef4444' 
              }}>
                {avgGain >= 0 ? '+' : ''}{avgGain.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="panel-actions">
            <button className="btn" onClick={handleToggleSort} title={`Sort: ${list.sortOrder}`}>
              {list.sortOrder === 'asc' && <ArrowUpAZ size={16} />}
              {list.sortOrder === 'desc' && <ArrowDownAZ size={16} />}
              {list.sortOrder === 'none' && <ArrowUpDown size={16} />}
            </button>
            <button className="btn" onClick={handleToggleStats} title="Toggle Stats">
              {showStats ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button className="btn" onClick={() => onDelete(list.id)}>
              <X size={16} />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <div className="panel-content">
            {sortedTickers.map((ticker) => (
              <div 
                key={ticker.id} 
                className="ticker-row"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('ticker', JSON.stringify({ listId: list.id, tickerId: ticker.id }));
                  e.dataTransfer.effectAllowed = 'copyMove';
                }}
                style={{ 
                  cursor: 'grab',
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
                <div className="ticker-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      className="btn" 
                      style={{ padding: '4px', color: ticker.isOwned ? '#f59e0b' : 'var(--text-secondary)', opacity: ticker.isOwned ? 1 : 0.3 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedTickers = list.tickers.map(t => 
                          t.id === ticker.id ? { ...t, isOwned: !t.isOwned } : t
                        );
                        onUpdate({ ...list, tickers: updatedTickers });
                      }}
                      title={ticker.isOwned ? "Remove from Portfolio" : "Add to Portfolio"}
                    >
                      <Briefcase size={14} fill={ticker.isOwned ? "#f59e0b" : "none"} />
                    </button>
                    <button 
                      className="btn" 
                      style={{ 
                        padding: '4px', 
                        color: watchlistSymbols.has(ticker.symbol) ? '#6366f1' : 'var(--text-secondary)', 
                        opacity: watchlistSymbols.has(ticker.symbol) ? 1 : 0.3,
                        marginLeft: '-4px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(ticker);
                      }}
                      title={watchlistSymbols.has(ticker.symbol) ? "Remove from Watchlist" : "Add to Watchlist"}
                    >
                      <Star size={14} fill={watchlistSymbols.has(ticker.symbol) ? "#6366f1" : "none"} />
                    </button>
                    <div>
                      <div className="ticker-symbol" style={{ color: ticker.isOwned ? '#f59e0b' : '#fff' }}>{ticker.symbol}</div>
                      <div className="ticker-name">{ticker.name}</div>
                    </div>
                    {ticker.stats.sparkline && (
                      <div style={{ marginLeft: '4px', opacity: 0.8 }}>
                        <Sparkline 
                          data={ticker.stats.sparkline} 
                          color={parseFloat(ticker.stats.changePercent) >= 0 ? '#10b981' : '#ef4444'} 
                        />
                      </div>
                    )}
                  </div>
                  {ticker.name !== 'Unknown Company' && (
                    <div className="ticker-price-group">
                      <div style={{ fontWeight: 600 }}>${ticker.stats.price}</div>
                      <div className={parseFloat(ticker.stats.change) >= 0 ? 'positive' : 'negative'} style={{ fontSize: '11px' }}>
                        {parseFloat(ticker.stats.change) >= 0 ? '+' : ''}{ticker.stats.change} ({ticker.stats.changePercent})
                      </div>
                    </div>
                  )}
                  {ticker.name === 'Unknown Company' && (
                    <div className="ticker-name" style={{ fontStyle: 'italic', opacity: 0.5 }}>Symbol not found</div>
                  )}
                  {ticker.stats.error && (
                    <div className="negative" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={12} /> {ticker.stats.error}
                    </div>
                  )}
                  <button className="btn" style={{ padding: '4px', marginLeft: '8px' }} onClick={() => onRemoveTicker(list.id, ticker.id)}>
                    <Trash2 size={12} opacity={0.5} />
                  </button>
                </div>
                
                {showStats && (
                  <div className="ticker-stats">
                    {ticker.stats.sector && ticker.stats.sector !== 'N/A' && (
                      <div className="stat-row">
                        <div className="stat-item" style={{ flex: '1 1 100%' }}>
                          <span className="stat-label">Sector</span>
                          <span>{ticker.stats.sector}</span>
                        </div>
                      </div>
                    )}
                    <div className="stat-row">
                      <div className="stat-item">
                        <span className="stat-label">Cap</span>
                        <span>{formatMarketCap(ticker.stats.marketCap)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Vol</span>
                        <span>{ticker.stats.volume}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Yld</span>
                        <span style={{ color: '#f59e0b' }}>{ticker.stats.dividendYield ? ticker.stats.dividendYield.toFixed(2) + '%' : '0.00%'}</span>
                      </div>
                    </div>
                    {ticker.stats.sma10 !== undefined && (
                      <>
                        <div className="stat-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                          {[10, 20, 50, 100, 200].map(period => {
                            const smaKey = `sma${period}` as keyof typeof ticker.stats;
                            const smaVal = ticker.stats[smaKey] as number | undefined;
                            if (smaVal === undefined) return null;
                            return (
                              <div key={period} className="stat-item" title={`SMA${period}`} style={{ gap: '2px' }}>
                                <span className="stat-label" style={{ fontSize: '9px' }}>S{period}</span>
                                <span className={parseFloat(ticker.stats.price) > smaVal ? 'positive' : 'negative'}>
                                  {smaVal}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="stat-row" style={{ paddingBottom: '4px' }}>
                          {[10, 20, 50, 100, 200].map(period => {
                            const smaKey = `sma${period}` as keyof typeof ticker.stats;
                            const smaVal = ticker.stats[smaKey] as number | undefined;
                            if (smaVal === undefined) return null;
                            const dist = ((parseFloat(ticker.stats.price) - smaVal) / smaVal) * 100;
                            return (
                              <div key={period} className="stat-item" title={`% from SMA${period}`}>
                                <span className="stat-label" style={{ fontSize: '9px' }}>%</span>
                                <span className={dist >= 0 ? 'positive' : 'negative'}>
                                  {dist.toFixed(1)}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="stat-row" style={{ paddingBottom: '4px', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '4px' }}>
                          {[10, 20, 50, 100, 200].map(period => {
                            const smaKey = `sma${period}` as keyof typeof ticker.stats;
                            const smaVal = ticker.stats[smaKey] as number | undefined;
                            if (smaVal === undefined) return null;
                            const prevPrice = parseFloat(ticker.stats.price) - parseFloat(ticker.stats.change);
                            const isCross = prevPrice < smaVal && parseFloat(ticker.stats.price) > smaVal;
                            return (
                              <div key={period} className="stat-item" title={`Crossover SMA${period}`}>
                                <span className="stat-label" style={{ fontSize: '9px' }}>X</span>
                                <span className={isCross ? 'positive' : 'negative'}>
                                  {isCross ? 'YES' : 'NO'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {ticker.stats.perf1M !== undefined && (
                      <div className="stat-row">
                        <div className="stat-item">
                          <span className="stat-label">1M</span>
                          <span className={ticker.stats.perf1M >= 0 ? 'positive' : 'negative'}>{ticker.stats.perf1M}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">3M</span>
                          <span className={ticker.stats.perf3M !== undefined && ticker.stats.perf3M >= 0 ? 'positive' : 'negative'}>{ticker.stats.perf3M}%</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">1Y</span>
                          <span className={ticker.stats.perf1Y !== undefined && ticker.stats.perf1Y >= 0 ? 'positive' : 'negative'}>{ticker.stats.perf1Y}%</span>
                        </div>
                      </div>
                    )}
                    {ticker.stats.lastUpdated && (
                      <div style={{ fontSize: '9px', opacity: 0.4, textAlign: 'right', marginTop: '2px' }}>
                        Updated: {ticker.stats.lastUpdated}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', padding: '8px', background: 'rgba(0,0,0,0.1)', borderTop: '1px solid rgba(255,255,255,0.05)', borderRadius: '0 0 12px 12px' }}>
          <button 
            className="btn" 
            style={{ flex: 1, padding: '10px', color: 'var(--text-secondary)', gap: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.03)' }}
            onClick={() => onAddTicker(list.id)}
          >
            <Plus size={14} /> Add Ticker
          </button>
          <button 
            className="btn" 
            style={{ padding: '10px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)' }}
            onClick={handleToggleCollapse}
            title={isCollapsed ? "Expand" : "Minimize"}
          >
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
    </Draggable>
  );
};
