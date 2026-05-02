import React from 'react';
import { Plus, Layout, Settings, Search, RefreshCw, Filter, Bell, X, Trash2, BarChart2, Trophy } from 'lucide-react';

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
  unreadCount?: number;
  activeFilterCount?: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onCreateList, onToggleSidebar, onRefreshAll, onClearWorkbench, isRefreshing, 
  searchQuery, onSearchQueryChange, onOpenFilter, onOpenSettings, onOpenTable, 
  onOpenNotifications, onOpenAnalytics, onOpenRanking, unreadCount = 0, activeFilterCount = 0 
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);

  return (
    <div className="toolbar">
      <button className="btn" title="Toggle Sidebar" onClick={onToggleSidebar}>
        <Layout size={20} />
      </button>
      <button className="btn" title="Refresh All Data" onClick={onRefreshAll} disabled={isRefreshing}>
        <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
      </button>
      <button className="btn" title="Clear Workbench" onClick={onClearWorkbench}>
        <Trash2 size={20} />
      </button>
      <button className="btn" title="Market Table" onClick={onOpenTable}>
        <Layout size={20} style={{ transform: 'rotate(90deg)' }} />
      </button>
      <button className="btn" title="Analytics" onClick={onOpenAnalytics}>
        <BarChart2 size={20} />
      </button>
      <button 
        className="btn" 
        style={{ background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '48px', height: '48px' }}
        onClick={onCreateList}
        title="Add New List"
      >
        <Plus size={24} />
      </button>
      <button className="btn" title="Ranking" onClick={onOpenRanking}>
        <Trophy size={20} />
      </button>
      <button className="btn" title={isSearchExpanded ? "Close Search" : "Search"} onClick={() => {
        if (isSearchExpanded) {
          onSearchQueryChange('');
        }
        setIsSearchExpanded(!isSearchExpanded);
      }}>
        {isSearchExpanded ? <X size={20} /> : <Search size={20} />}
      </button>
      {isSearchExpanded && (
        <input 
          type="text" 
          placeholder="Search ticker..." 
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          className="search-input"
          autoFocus
        />
      )}
      <button className="btn" title="Filter" onClick={onOpenFilter} style={{ position: 'relative' }}>
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
      <button className="btn" title="Notifications" onClick={onOpenNotifications} style={{ position: 'relative' }}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '0px', right: '0px', 
            background: '#ef4444', color: 'white', 
            fontSize: '10px', fontWeight: 'bold', width: '14px', height: '14px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            borderRadius: '50%',
            border: '2px solid rgba(30, 30, 35, 1)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>
      <button className="btn" title="Settings" onClick={onOpenSettings}>
        <Settings size={20} />
      </button>
    </div>
  );
};

