import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, ChevronRight, FolderPlus, Folder, GripVertical } from 'lucide-react';
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
  onMoveGroup?: (groupId: string, direction: 'up' | 'down') => void;
  onMoveListToGroup: (listId: string, groupId: string | null) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onRenameList: (listId: string, newName: string, color?: string) => void;
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
  onMoveGroup,
  onMoveListToGroup,
  onRenameGroup,
  onRenameList,
  onAssignList
}) => {
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isUngroupedEditMode, setIsUngroupedEditMode] = React.useState(false);
  const [isGroupsSectionCollapsed, setIsGroupsSectionCollapsed] = React.useState(false);
  const [isUngroupedSectionCollapsed, setIsUngroupedSectionCollapsed] = React.useState(false);
  const [isArchiveSectionCollapsed, setIsArchiveSectionCollapsed] = React.useState(true);
  const [isPinnedSectionCollapsed, setIsPinnedSectionCollapsed] = React.useState(false);
  
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);
  const [editingListId, setEditingListId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
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
  
  const archivedLists = regularLists
    .filter(list => list.isArchived)
    .sort((a, b) => calculateAverageGain(b) - calculateAverageGain(a));

  const activeLists = regularLists.filter(list => !list.isArchived);
  
  const ungroupedLists = activeLists
    .filter(list => !groups.some(g => g.listIds.includes(list.id)))
    .sort((a, b) => calculateAverageGain(b) - calculateAverageGain(a));



  const renderListItem = (list: StockList, isEditingMode: boolean = false) => {
    const avgGain = calculateAverageGain(list);
    const isBigGain = avgGain > 5;
    const isBigLoss = avgGain < -5;
    const isEditing = editingListId === list.id;

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
          border: isEditing ? '1px solid var(--accent)' : '1px solid transparent',
          transition: 'all 0.2s',
          opacity: list.isVisible ? 1 : 0.5,
          marginLeft: '4px'
        }}
        onClick={() => !isEditing && onSelectListItem(list.id)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div 
            style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: list.color, 
              flexShrink: 0,
              cursor: isEditingMode && !list.isProtected ? 'pointer' : 'default',
              border: '1px solid rgba(255,255,255,0.1)'
            }} 
            onClick={(e) => {
              if (isEditingMode && !list.isProtected) {
                e.stopPropagation();
                const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                const currentIndex = colors.indexOf(list.color);
                const nextColor = colors[(currentIndex + 1) % colors.length];
                onRenameList(list.id, list.name, nextColor);
              }
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
            {isEditing ? (
              <input 
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onRenameList(list.id, editValue);
                    setEditingListId(null);
                  } else if (e.key === 'Escape') {
                    setEditingListId(null);
                  }
                }}
                onBlur={() => {
                  onRenameList(list.id, editValue);
                  setEditingListId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'var(--surface-input)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  padding: '2px 6px',
                  width: '100%',
                  outline: 'none',
                  fontWeight: 500
                }}
              />
            ) : (
              <span 
                style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                title={list.name}
                onClick={(e) => {
                  if (isEditingMode && !list.isProtected) {
                    e.stopPropagation();
                    setEditingListId(list.id);
                    setEditValue(list.name);
                  }
                }}
              >
                {list.country && COUNTRY_FLAGS[list.country]} {list.name}
              </span>
            )}
            <span style={{ opacity: 0.5, fontSize: '12px', flexShrink: 0 }}>({list.tickers.length})</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {!isEditing && (
            <span style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: avgGain >= 0 ? '#10b981' : '#ef4444' 
            }}>
              {avgGain >= 0 ? '+' : ''}{avgGain.toFixed(2)}%
            </span>
          )}
          <div className="item-actions" style={{ display: 'flex', gap: '4px' }}>
            {!list.isProtected && isEditingMode && (
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
            <div 
              className="sidebar-section-label" 
              style={{ 
                fontSize: '11px', 
                color: 'var(--text-secondary)', 
                margin: '0 0 8px 0', 
                textTransform: 'uppercase', 
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => setIsPinnedSectionCollapsed(!isPinnedSectionCollapsed)}
            >
              {isPinnedSectionCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              Pinned ({protectedLists.length})
            </div>
            {!isPinnedSectionCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {protectedLists.map(l => renderListItem(l))}
              </div>
            )}
          </div>
        )}

        {/* Groups */}
        {groups.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px 0', paddingRight: '8px' }}>
            <div 
              className="sidebar-section-label" 
              style={{ 
                fontSize: '11px', 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => setIsGroupsSectionCollapsed(!isGroupsSectionCollapsed)}
            >
              {isGroupsSectionCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              Groups ({groups.length})
            </div>
            <button 
              className="btn" 
              style={{ 
                fontSize: '11px', 
                padding: '2px 8px', 
                color: isEditMode ? 'var(--accent)' : 'var(--text-secondary)', 
                background: isEditMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent', 
                borderRadius: '4px',
                border: isEditMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'
              }}
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Done' : 'Edit'}
            </button>
          </div>
        )}

        {!isGroupsSectionCollapsed && groups.map((group, index) => (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                {group.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                <Folder size={16} color="var(--accent)" />
                {isEditMode && editingGroupId === group.id ? (
                  <input 
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onRenameGroup(group.id, editValue);
                        setEditingGroupId(null);
                      } else if (e.key === 'Escape') {
                        setEditingGroupId(null);
                      }
                    }}
                    onBlur={() => {
                      onRenameGroup(group.id, editValue);
                      setEditingGroupId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'var(--surface-input)',
                      border: '1px solid var(--accent)',
                      borderRadius: '4px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      padding: '2px 6px',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <span 
                    style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    onClick={(e) => {
                      if (isEditMode) {
                        e.stopPropagation();
                        setEditingGroupId(group.id);
                        setEditValue(group.name);
                      }
                    }}
                  >
                    {group.name} 
                    <span style={{ marginLeft: '4px', opacity: 0.5, fontWeight: 400 }}>({group.listIds.length})</span>
                  </span>
                )}
              </div>
              {isEditMode && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button 
                    className="btn" 
                    style={{ padding: '2px', opacity: index === 0 ? 0.3 : 0.7 }}
                    onClick={(e) => { e.stopPropagation(); onMoveGroup?.(group.id, 'up'); }}
                    disabled={index === 0}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button 
                    className="btn" 
                    style={{ padding: '2px', opacity: index === groups.length - 1 ? 0.3 : 0.7 }}
                    onClick={(e) => { e.stopPropagation(); onMoveGroup?.(group.id, 'down'); }}
                    disabled={index === groups.length - 1}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button className="btn" style={{ padding: '4px' }} onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.id); }}>
                    <Trash2 size={12} color="rgba(255,255,255,0.3)" />
                  </button>
                </div>
              )}
            </div>
            
            {!group.isCollapsed && (
              <div className="group-content" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', borderLeft: '1px solid var(--surface-divider)', marginLeft: '16px' }}>
                {group.listIds
                  .map(id => lists.find(l => l.id === id))
                  .filter((l): l is StockList => !!l)
                  .sort((a, b) => calculateAverageGain(b) - calculateAverageGain(a))
                  .map(l => renderListItem(l, isEditMode))
                }
                {group.listIds.length === 0 && (
                  <div style={{ height: '8px' }} />
                )}
              </div>
            )}
          </div>
        ))}

        <div 
          className="ungrouped-section"
          style={{ minHeight: '40px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 0 8px 0', paddingRight: '8px' }}>
            <div 
              className="sidebar-section-label" 
              style={{ 
                fontSize: '11px', 
                color: 'var(--text-secondary)', 
                textTransform: 'uppercase', 
                letterSpacing: '1px', 
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => setIsUngroupedSectionCollapsed(!isUngroupedSectionCollapsed)}
            >
              {isUngroupedSectionCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              Ungrouped ({ungroupedLists.length})
            </div>
            {ungroupedLists.length > 0 && (
              <button 
                className="btn" 
                style={{ 
                  fontSize: '11px', 
                  padding: '2px 8px', 
                  color: isUngroupedEditMode ? 'var(--accent)' : 'var(--text-secondary)', 
                  background: isUngroupedEditMode ? 'rgba(59, 130, 246, 0.1)' : 'transparent', 
                  borderRadius: '4px',
                  border: isUngroupedEditMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'
                }}
                onClick={() => setIsUngroupedEditMode(!isUngroupedEditMode)}
              >
                {isUngroupedEditMode ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
          {!isUngroupedSectionCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {ungroupedLists.map(l => renderListItem(l, isUngroupedEditMode))}
            </div>
          )}
        </div>

        {/* Archive Section */}
        <div 
          className="archive-section"
          style={{ marginTop: '16px' }}
        >
          <div 
            className="sidebar-section-label" 
            style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)', 
              textTransform: 'uppercase', 
              letterSpacing: '1px', 
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              userSelect: 'none',
              opacity: archivedLists.length === 0 ? 0.5 : 1
            }}
            onClick={() => archivedLists.length > 0 && setIsArchiveSectionCollapsed(!isArchiveSectionCollapsed)}
          >
            {isArchiveSectionCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
            Archive ({archivedLists.length})
          </div>
          {!isArchiveSectionCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {archivedLists.map(l => renderListItem(l, false))}
            </div>
          )}
        </div>

        {activeLists.length === 0 && groups.length === 0 && archivedLists.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No lists created yet.
          </div>
        )}
      </div>
    </aside>
  );
};
