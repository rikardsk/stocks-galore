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
  onReorderList: (draggedId: string, targetId: string) => void;
  onReorderGroup: (draggedId: string, targetId: string) => void;
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
  onReorderList,
  onReorderGroup
}) => {
  const protectedLists = lists.filter(list => list.isProtected);
  const regularLists = lists.filter(list => !list.isProtected);
  const ungroupedLists = regularLists
    .filter(list => !groups.some(g => g.listIds.includes(list.id)))
    .sort((a, b) => calculateAverageGain(b) - calculateAverageGain(a));

  const calculateAverageGain = (list: StockList) => {
    if (list.tickers.length === 0) return 0;
    const total = list.tickers.reduce((sum, t) => {
      const change = parseFloat(t.stats.changePercent);
      return sum + (isNaN(change) ? 0 : change);
    }, 0);
    return total / list.tickers.length;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnGroup = (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault();
    const listId = e.dataTransfer.getData('listId');
    const groupId = e.dataTransfer.getData('groupId');

    if (listId) {
      onMoveListToGroup(listId, targetGroupId);
    } else if (groupId && targetGroupId && groupId !== targetGroupId) {
      onReorderGroup(groupId, targetGroupId);
    }
  };

  const renderListItem = (list: StockList) => {
    const avgGain = calculateAverageGain(list);
    const isBigGain = avgGain > 5;
    const isBigLoss = avgGain < -5;

    return (
      <div 
        key={list.id} 
        className="sidebar-item" 
        draggable={!list.isProtected}
        onDragStart={(e) => {
          if (list.isProtected) return;
          e.dataTransfer.setData('listId', list.id);
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          if (list.isProtected) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'move';
        }}
        onDrop={(e) => {
          if (list.isProtected) return;
          e.preventDefault();
          e.stopPropagation();
          const draggedId = e.dataTransfer.getData('listId');
          if (draggedId && draggedId !== list.id) {
            onReorderList(draggedId, list.id);
          }
        }}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          background: isBigGain ? 'rgba(16, 185, 129, 0.15)' : isBigLoss ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.03)',
          border: '1px solid transparent',
          transition: 'all 0.2s',
          opacity: list.isVisible ? 1 : 0.5,
          marginLeft: '4px'
        }}
        onClick={() => onSelectListItem(list.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!list.isProtected && <GripVertical size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />}
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
            <button className="btn" style={{ padding: '4px' }} onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}>
              <Trash2 size={14} color="rgba(255,255,255,0.4)" />
            </button>
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
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnGroup(e, group.id)}
            style={{ marginBottom: '12px' }}
          >
            <div 
              className="group-header"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('groupId', group.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
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
              <div className="group-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', borderLeft: '1px solid rgba(255,255,255,0.05)', marginLeft: '16px' }}>
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

        {/* Ungrouped Lists */}
        <div 
          className="ungrouped-section"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnGroup(e, null)}
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
