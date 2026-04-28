import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { MoreVertical, X, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2, ArrowUpDown, ArrowUpAZ, ArrowDownAZ, Lock, AlertCircle } from 'lucide-react';
import type { StockList, Ticker, StockFilters } from '../types';
import { COUNTRY_FLAGS, tickerMatchesFilters } from '../types';

interface ListPanelProps {
  list: StockList;
  onUpdate: (list: StockList) => void;
  onDelete: (id: string) => void;
  onAddTicker: (listId: string) => void;
  onRemoveTicker: (listId: string, tickerId: string) => void;
  onTransferTicker: (fromListId: string, toListId: string, tickerId: string, isCopy: boolean) => void;
  globalFilters?: StockFilters;
}

export const ListPanel: React.FC<ListPanelProps> = ({
  list,
  onUpdate,
  onDelete,
  onAddTicker,
  onRemoveTicker,
  onTransferTicker,
  globalFilters
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
          background: list.color + '22', 
          borderBottom: `2px solid ${list.color}`,
          cursor: list.isProtected ? 'default' : 'grab'
        }}>
          <div className="panel-title" style={{ color: list.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              className="status-bullet" 
              style={{ background: hasData ? (isFresh ? '#10b981' : '#ef4444') : 'transparent', border: hasData ? 'none' : '1px solid rgba(255,255,255,0.2)' }}
              title={hasData ? (isFresh ? 'Updated in last 24h' : 'Stale data (>24h)') : 'No data fetched yet'}
            />
            {list.isProtected && <Lock size={12} opacity={0.6} />}
            {list.country && COUNTRY_FLAGS[list.country]} {list.name}
            <span style={{ marginLeft: '4px', opacity: 0.6, fontSize: '12px', fontWeight: 400 }}>
              ({filteredTickers.length})
            </span>
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
            <button className="btn" onClick={handleToggleCollapse}>
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
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
                style={{ cursor: 'grab' }}
              >
                <div className="ticker-info">
                  <div>
                    <div className="ticker-symbol">{ticker.symbol}</div>
                    <div className="ticker-name">{ticker.name}</div>
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
                        <span>{ticker.stats.marketCap}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Vol</span>
                        <span>{ticker.stats.volume}</span>
                      </div>
                    </div>
                    {ticker.stats.sma20 && (
                      <>
                        <div className="stat-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                          <div className="stat-item" title="SMA20">
                            <span className="stat-label">S20</span>
                            <span className={parseFloat(ticker.stats.price) > ticker.stats.sma20 ? 'positive' : 'negative'}>
                              {ticker.stats.sma20}
                            </span>
                          </div>
                          <div className="stat-item" title="SMA50">
                            <span className="stat-label">S50</span>
                            <span className={parseFloat(ticker.stats.price) > ticker.stats.sma50 ? 'positive' : 'negative'}>
                              {ticker.stats.sma50}
                            </span>
                          </div>
                          <div className="stat-item" title="SMA200">
                            <span className="stat-label">S200</span>
                            <span className={parseFloat(ticker.stats.price) > ticker.stats.sma200 ? 'positive' : 'negative'}>
                              {ticker.stats.sma200}
                            </span>
                          </div>
                        </div>
                        <div className="stat-row" style={{ paddingBottom: '4px' }}>
                          <div className="stat-item" title="% from SMA20">
                            <span className="stat-label">%</span>
                            <span className={parseFloat(ticker.stats.price) > ticker.stats.sma20 ? 'positive' : 'negative'}>
                              {(((parseFloat(ticker.stats.price) - ticker.stats.sma20) / ticker.stats.sma20) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="stat-item" title="% from SMA50">
                            <span className="stat-label">%</span>
                            <span className={parseFloat(ticker.stats.price) > ticker.stats.sma50 ? 'positive' : 'negative'}>
                              {(((parseFloat(ticker.stats.price) - ticker.stats.sma50) / ticker.stats.sma50) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="stat-item" title="% from SMA200">
                            <span className="stat-label">%</span>
                            <span className={parseFloat(ticker.stats.price) > ticker.stats.sma200 ? 'positive' : 'negative'}>
                              {(((parseFloat(ticker.stats.price) - ticker.stats.sma200) / ticker.stats.sma200) * 100).toFixed(1)}%
                            </span>
                          </div>
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
            
            <button 
              className="btn" 
              style={{ width: '100%', padding: '12px', color: 'var(--text-secondary)', gap: '8px', fontSize: '13px' }}
              onClick={() => onAddTicker(list.id)}
            >
              <Plus size={14} />
              Add Ticker
            </button>
          </div>
        )}
      </div>
    </Draggable>
  );
};
