import React from 'react';
import { Plus, Layout, Settings, Search, RefreshCw, Filter, Bell, X, Trash2, BarChart2, Trophy, Calendar, Keyboard } from 'lucide-react';

interface ToolbarProps {
  onCreateList: () => void;
  onToggleSidebar: () => void;
  onRefreshAll: () => void;
  onClearWorkbench: () => void;
  isRefreshing: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOpenFilter?: () => void;
  onOpenSettings?: () => void;
  onOpenTable?: () => void;
  onOpenNotifications?: () => void;
  onOpenAnalytics?: () => void;
  onOpenRanking?: () => void;
  onOpenEarnings?: () => void;
  unreadCount?: number;
  activeFilterCount?: number;
  isSearchExpanded: boolean;
  onSearchToggle: () => void;
  onOpenShortcuts?: () => void;
  position?: 'bottom' | 'top' | 'right';
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onCreateList, onToggleSidebar, onRefreshAll, onClearWorkbench, isRefreshing, 
  searchQuery, onSearchQueryChange, onOpenFilter, onOpenSettings, onOpenTable, 
  onOpenNotifications, onOpenAnalytics, onOpenRanking, onOpenEarnings, unreadCount = 0, activeFilterCount = 0,
  isSearchExpanded, onSearchToggle, onOpenShortcuts, position = 'bottom'
}) => {
  return (
    <div className={`toolbar position-${position}`}>
      <button className="btn" title="Toggle Sidebar (Ctrl+Shift+S)" onClick={onToggleSidebar}>
        <Layout size={20} />
      </button>
      <button className="btn" title="Refresh All Data (Ctrl+Shift+D)" onClick={onRefreshAll} disabled={isRefreshing}>
        <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
      </button>
      <button className="btn" title="Clear Workbench (Ctrl+Delete)" onClick={onClearWorkbench}>
        <Trash2 size={20} />
      </button>
      <button className="btn" title="Market Table (Ctrl+V)" onClick={onOpenTable}>
        <Layout size={20} style={{ transform: 'rotate(90deg)' }} />
      </button>
      <button className="btn" title="Analytics (Ctrl+N)" onClick={onOpenAnalytics}>
        <BarChart2 size={20} />
      </button>
      <button className="btn" title="Keyboard Shortcuts (Ctrl+K)" onClick={onOpenShortcuts}>
        <Keyboard size={20} />
      </button>
      <button 
        className="btn" 
        style={{ background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '48px', height: '48px' }}
        onClick={onCreateList}
        title="Add New List (Ctrl+L)"
      >
        <Plus size={24} />
      </button>
      <button className="btn" title="Ranking (Ctrl+R)" onClick={onOpenRanking}>
        <Trophy size={20} />
      </button>
      <button className="btn" title="Earnings Calendar (Ctrl+E)" onClick={onOpenEarnings}>
        <Calendar size={20} />
      </button>
      <button className="btn" title={isSearchExpanded ? "Close Search (Ctrl+X)" : "Search (Ctrl+X)"} onClick={onSearchToggle}>
        {isSearchExpanded ? <X size={20} /> : <Search size={20} />}
      </button>
      {isSearchExpanded && (
        <input 
          type="text" 
          placeholder="Search..." 
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          className="search-input"
          size={5}
          autoFocus
        />
      )}
      <button className="btn" title="Filter (Ctrl+F)" onClick={onOpenFilter} style={{ position: 'relative' }}>
        <Filter size={20} />
        {activeFilterCount > 0 && (
          <span style={{
            position: 'absolute', top: '0px', right: '0px', 
            background: 'var(--accent)', color: 'white', 
            fontSize: '10px', fontWeight: 'bold', width: '14px', height: '14px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            borderRadius: '50%'
          }}>
            {activeFilterCount}
          </span>
        )}
      </button>
      <button className="btn" title="Notifications (Ctrl+A)" onClick={onOpenNotifications} style={{ position: 'relative' }}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '0px', right: '0px', 
            background: '#ef4444', color: 'white', 
            fontSize: '10px', fontWeight: 'bold', width: '14px', height: '14px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            borderRadius: '50%',
            border: '2px solid var(--toolbar-border-badge)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>
      <button className="btn" title="Settings (Ctrl+S)" onClick={onOpenSettings}>
        <Settings size={20} />
      </button>
    </div>
  );
};

