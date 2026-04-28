import React from 'react';
import { Plus, Layout, Settings, Search, BarChart2, RefreshCw, Filter, X } from 'lucide-react';

interface ToolbarProps {
  onCreateList: () => void;
  onToggleSidebar: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOpenFilter?: () => void;
  onOpenSettings?: () => void;
  activeFilterCount?: number;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onCreateList, onToggleSidebar, onRefreshAll, isRefreshing, 
  searchQuery, onSearchQueryChange, onOpenFilter, onOpenSettings, activeFilterCount = 0 
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
      <button 
        className="btn" 
        style={{ background: 'var(--accent)', color: 'white', borderRadius: '50%', width: '48px', height: '48px' }}
        onClick={onCreateList}
        title="Add New List"
      >
        <Plus size={24} />
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
      <button className="btn" title="Settings" onClick={onOpenSettings}>
        <Settings size={20} />
      </button>
    </div>
  );
};

