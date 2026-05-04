import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, FolderPlus, Folder, GripVertical } from 'lucide-react';
import type { StockList, ListGroup } from '../types';
import { COUNTRY_FLAGS } from '../types';

interface SidebarProps {
  lists: StockList[];
  groups: ListGroup[];
  isCollapsed: boolean;
  onCreateList: () => void;
  onCreateGroup: () => void;
  onDeleteList: (id: string) => void;
  onDeleteGroup: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onSelectListItem: (id: string) => void;
  onMoveListToGroup: (listId: string, groupId: string | null) => void;
  onAssignList: (listId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  lists,
  groups,
  isCollapsed,
  onCreateList,
  onCreateGroup,
  onDeleteList,
  onDeleteGroup,
  onToggleGroup,
  onSelectListItem,
  onMoveListToGroup,
  onAssignList
}) => {
  const calculateAverageGain = (list: StockList) => {
    if (!list || !list.tickers || list.tickers.length === 0) return 0;
    const total = list.tickers.reduce((sum, t) => {
      if (!t || !t.stats) return sum;
      const change = parseFloat(t.stats.changePercent);
      return sum + (isNaN(change) ? 0 : change);
    }, 0);
    return total / list.tickers.length;
  };

  const protectedLists = lists.filter(list => list.isProtected);
  const regularLists = lists.filter(list => !list.isProtected);
  const ungroupedLists = regularLists
    .filter(list => !groups.some(g => g.listIds.includes(list.id)))
    .sort((a, b) => calculateAverageGain(b) - calculateAverageGain(a));



  const renderListItem = (list: StockList) => {
    const avgGain = calculateAverageGain(list);
    const isBigGain = avgGain > 5;
    const isBigLoss = avgGain < -5;

    return (
      <div 
        key={list.id} 
        className="sidebar-item" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          background: isBigGain ? 'rgba(16, 185, 129, 0.15)' : isBigLoss ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-subtle)',
          border: '1px solid transparent',
          transition: 'all 0.2s',
          opacity: list.isVisible ? 1 : 0.5,
          marginLeft: '4px'
        }}
        onClick={() => onSelectListItem(list.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: list.color }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>
              {list.country && COUNTRY_FLAGS[list.country]} {list.name}
            </span>
            <span style={{ opacity: 0.5, fontSize: '12px' }}>({list.tickers.length})</span>
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: avgGain >= 0 ? '#10b981' : '#ef4444' 
            }}>
              {avgGain >= 0 ? '+' : ''}{avgGain.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="item-actions" style={{ display: 'flex', gap: '4px' }}>
          {!list.isProtected && (
            <>
              <button className="btn" style={{ padding: '4px' }} onClick={(e) => { e.stopPropagation(); onAssignList(list.id); }} title="Assign to Group">
                <Plus size={14} color="var(--text-secondary)" opacity={0.5} />
              </button>
              <button className="btn" style={{ padding: '4px' }} onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}>
                <Trash2 size={14} color="var(--text-secondary)" opacity={0.5} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Workbench</h2>
      </div>
      
      <div className="sidebar-content">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button className="btn btn-primary" style={{ flex: 1, gap: '8px', padding: '12px 8px', borderRadius: '10px' }} onClick={onCreateList}>
            <Plus size={18} />
            <span style={{ fontSize: '13px' }}>List</span>
          </button>
          <button className="btn" style={{ flex: 1, gap: '8px', padding: '12px 8px', border: '1px solid var(--border-color)', borderRadius: '10px' }} onClick={onCreateGroup}>
            <FolderPlus size={18} />
            <span style={{ fontSize: '13px' }}>Group</span>
          </button>
        </div>

        {/* Static Section: Watchlist & Portfolio */}
        {protectedLists.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div className="sidebar-section-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Pinned
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {protectedLists.map(renderListItem)}
            </div>
          </div>
        )}

        {/* Groups */}
        {groups.map(group => (
          <div 
            key={group.id} 
            className="sidebar-group" 
            style={{ marginBottom: '12px' }}
          >
            <div 
              className="group-header"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '6px 8px',
                cursor: 'pointer',
                borderRadius: '6px'
              }}
              onClick={() => onToggleGroup(group.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {group.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                <Folder size={16} color="var(--accent)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {group.name} 
                  <span style={{ marginLeft: '4px', opacity: 0.5, fontWeight: 400 }}>({group.listIds.length})</span>
                </span>
              </div>
              <button className="btn" style={{ padding: '4px' }} onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }}>
                <Trash2 size={12} color="rgba(255,255,255,0.3)" />
              </button>
            </div>
            
            {!group.isCollapsed && (
              <div className="group-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', borderLeft: '1px solid var(--surface-divider)', marginLeft: '16px' }}>
                {group.listIds
                  .map(id => lists.find(l => l.id === id))
                  .filter((l): l is StockList => !!l)
                  .sort((a, b) => calculateAverageGain(b) - calculateAverageGain(a))
                  .map(renderListItem)
                }
                {group.listIds.length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    Drop lists here
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        <div 
          className="ungrouped-section"
          style={{ minHeight: '100px' }}
        >
          <div className="sidebar-section-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '16px 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Ungrouped
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {ungroupedLists.map(renderListItem)}
            {ungroupedLists.length === 0 && groups.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No lists created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
