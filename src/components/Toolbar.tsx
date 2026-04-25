import React from 'react';
import { Plus, Layout, Settings, Search, BarChart2, RefreshCw } from 'lucide-react';

interface ToolbarProps {
  onCreateList: () => void;
  onToggleSidebar: () => void;
  onRefreshAll: () => void;
  isRefreshing: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onCreateList, onToggleSidebar, onRefreshAll, isRefreshing }) => {
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
      <button className="btn" title="Search">
        <Search size={20} />
      </button>
      <button className="btn" title="Settings">
        <Settings size={20} />
      </button>
    </div>
  );
};

