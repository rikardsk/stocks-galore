import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { MoreVertical, X, ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2, ArrowUpDown, ArrowUpAZ, ArrowDownAZ, Lock } from 'lucide-react';
import type { StockList, Ticker } from '../types';
import { COUNTRY_FLAGS } from '../types';

interface ListPanelProps {
  list: StockList;
  onUpdate: (list: StockList) => void;
  onDelete: (id: string) => void;
  onAddTicker: (listId: string) => void;
  onRemoveTicker: (listId: string, tickerId: string) => void;
  onTransferTicker: (fromListId: string, toListId: string, tickerId: string, isCopy: boolean) => void;
}

export const ListPanel: React.FC<ListPanelProps> = ({
  list,
  onUpdate,
  onDelete,
  onAddTicker,
  onRemoveTicker,
  onTransferTicker
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

  // Sort tickers logic
  const sortedTickers = [...list.tickers].sort((a, b) => {
    if (list.sortOrder === 'none') return 0;
    const comparison = a.symbol.localeCompare(b.symbol);
    return list.sortOrder === 'asc' ? comparison : -comparison;
  });

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
            {list.isProtected && <Lock size={12} opacity={0.6} />}
            {list.country && COUNTRY_FLAGS[list.country]} {list.name}
            <span style={{ marginLeft: '4px', opacity: 0.6, fontSize: '12px', fontWeight: 400 }}>({list.tickers.length})</span>
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
                  <div className="ticker-price-group">
                    <div style={{ fontWeight: 600 }}>${ticker.stats.price}</div>
                    <div className={parseFloat(ticker.stats.change) >= 0 ? 'positive' : 'negative'} style={{ fontSize: '11px' }}>
                      {parseFloat(ticker.stats.change) >= 0 ? '+' : ''}{ticker.stats.change} ({ticker.stats.changePercent})
                    </div>
                  </div>
                  <button className="btn" style={{ padding: '4px', marginLeft: '8px' }} onClick={() => onRemoveTicker(list.id, ticker.id)}>
                    <Trash2 size={12} opacity={0.5} />
                  </button>
                </div>
                
                {showStats && (
                  <div className="ticker-stats">
                    <div className="stat-item">
                      <span className="stat-label">Cap</span>
                      <span>{ticker.stats.marketCap}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Vol</span>
                      <span>{ticker.stats.volume}</span>
                    </div>
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
