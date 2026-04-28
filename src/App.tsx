import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { ListPanel } from './components/ListPanel';
import { Toolbar } from './components/Toolbar';
import { storage } from './storage';
import { MOCK_TICKERS } from './types';
import type { StockList, ListGroup } from './types';
import { COUNTRY_FLAGS } from './types';
import './index.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const WATCHLIST_ID = 'permanent-watchlist';
const API_BASE_URL = 'http://localhost:8000';

const App: React.FC = () => {
  const [lists, setLists] = useState<StockList[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddTickerModalOpen, setIsAddTickerModalOpen] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState(COLORS[0]);
  const [newCountry, setNewCountry] = useState('No Country');
  const [newTickerSymbol, setNewTickerSymbol] = useState('');

  const [groups, setGroups] = useState<ListGroup[]>([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToastType(type);
    setToastMessage(message);
  };

  useEffect(() => {
    let currentLists = storage.getLists();
    let changed = false;
    
    // Find any existing Watchlist (by ID or name)
    const watchlistIndex = currentLists.findIndex(l => l.id === WATCHLIST_ID || l.name === 'Watchlist');
    
    if (watchlistIndex === -1) {
      // Create it if it doesn't exist
      const watchlist: StockList = {
        id: WATCHLIST_ID,
        name: 'Watchlist',
        color: '#6366f1',
        tickers: [],
        position: { x: 50, y: 50 },
        isCollapsed: false,
        showStats: false,
        isVisible: true,
        sortOrder: 'none',
        isProtected: true
      };
      currentLists = [watchlist, ...currentLists];
      changed = true;
    } else {
      // Update the existing one and ensure it's protected and has the right ID
      const existing = currentLists[watchlistIndex];
      if (!existing.isProtected || existing.id !== WATCHLIST_ID) {
        currentLists[watchlistIndex] = { 
          ...existing, 
          id: WATCHLIST_ID, 
          name: 'Watchlist', // Ensure name is capitalized
          isProtected: true 
        };
        changed = true;
        
        // Remove any other duplicates that might have been created
        currentLists = currentLists.filter((l, idx) => 
          idx === watchlistIndex || (l.id !== WATCHLIST_ID && l.name !== 'Watchlist')
        );
      }
    }

    if (changed) storage.saveLists(currentLists);
    
    setLists(currentLists);
    setGroups(storage.getGroups());
  }, []);

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup = storage.createGroup(newGroupName);
    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setIsCreateGroupModalOpen(false);
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('Delete this group? Lists inside will be ungrouped.')) {
      storage.deleteGroup(id);
      setGroups(groups.filter(g => g.id !== id));
    }
  };

  const handleToggleGroup = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (group) {
      const updatedGroup = { ...group, isCollapsed: !group.isCollapsed };
      storage.updateGroup(updatedGroup);
      setGroups(groups.map(g => g.id === id ? updatedGroup : g));
    }
  };

  const handleMoveListToGroup = (listId: string, groupId: string | null) => {
    const updatedGroups = groups.map(group => {
      // Remove from any existing group
      let listIds = group.listIds.filter(id => id !== listId);
      // Add to target group
      if (group.id === groupId) {
        listIds.push(listId);
      }
      const updated = { ...group, listIds };
      storage.updateGroup(updated);
      return updated;
    });
    setGroups(updatedGroups);
  };

  const handleReorderList = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const targetGroup = groups.find(g => g.listIds.includes(targetId));
    const draggedGroup = groups.find(g => g.listIds.includes(draggedId));

    if (targetGroup) {
      // Moving into or within a group
      const newListIds = [...targetGroup.listIds].filter(id => id !== draggedId);
      const targetIndex = newListIds.indexOf(targetId);
      newListIds.splice(targetIndex, 0, draggedId);
      
      const updatedGroups = groups.map(g => {
        if (g.id === targetGroup.id) {
          const updated = { ...g, listIds: newListIds };
          storage.updateGroup(updated);
          return updated;
        }
        if (draggedGroup && g.id === draggedGroup.id) {
          const updated = { ...g, listIds: g.listIds.filter(id => id !== draggedId) };
          storage.updateGroup(updated);
          return updated;
        }
        return g;
      });
      setGroups(updatedGroups);
    } else {
      // Moving into ungrouped section at a specific position
      if (draggedGroup) {
        const updatedGroups = groups.map(g => {
          if (g.id === draggedGroup.id) {
            const updated = { ...g, listIds: g.listIds.filter(id => id !== draggedId) };
            storage.updateGroup(updated);
            return updated;
          }
          return g;
        });
        setGroups(updatedGroups);
      }

      const newLists = [...lists];
      const draggedIndex = newLists.findIndex(l => l.id === draggedId);
      const [draggedList] = newLists.splice(draggedIndex, 1);
      const targetIndex = newLists.findIndex(l => l.id === targetId);
      newLists.splice(targetIndex, 0, draggedList);
      
      setLists(newLists);
      storage.saveLists(newLists);
    }
  };

  const handleReorderGroup = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const newGroups = [...groups];
    const draggedIndex = newGroups.findIndex(g => g.id === draggedId);
    const [draggedGroup] = newGroups.splice(draggedIndex, 1);
    const targetIndex = newGroups.findIndex(g => g.id === targetId);
    newGroups.splice(targetIndex, 0, draggedGroup);
    setGroups(newGroups);
    storage.saveGroups(newGroups);
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    const newList = storage.createList(newListName, newListColor, newCountry);
    setLists([...lists, newList]);
    setNewListName('');
    setNewCountry('No Country');
    setIsCreateModalOpen(false);
  };

  const handleHideList = (id: string, isVisible: boolean = false) => {
    const list = lists.find(l => l.id === id);
    if (list) {
      handleUpdateList({ ...list, isVisible });
    }
  };

  const handleUpdateList = (updatedList: StockList) => {
    storage.updateList(updatedList);
    setLists(lists.map(l => l.id === updatedList.id ? updatedList : l));
  };

  const handleOpenAddTicker = (listId: string) => {
    setActiveListId(listId);
    setIsAddTickerModalOpen(true);
  };

  const performAddTicker = async () => {
    if (!activeListId || !newTickerSymbol.trim()) return;
    
    const symbols = newTickerSymbol.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    
    setIsAddTickerModalOpen(false);
    setNewTickerSymbol('');

    for (const symbol of symbols) {
      try {
        const response = await fetch(`${API_BASE_URL}/stock/${symbol}`);
        if (response.ok) {
          const data = await response.json();
          const newTicker = {
            id: uuidv4(),
            symbol: data.symbol,
            name: data.name,
            stats: {
              price: data.price.toString(),
              change: data.change.toString(),
              changePercent: data.changePercent,
              volume: data.volume,
              marketCap: data.marketCap,
              sector: data.sector,
              sma20: data.sma20,
              sma50: data.sma50,
              sma200: data.sma200,
              perf1M: data.perf1M,
              perf3M: data.perf3M,
              perf1Y: data.perf1Y,
              lastUpdated: new Date().toISOString()
            }
          };
          
          setLists(prev => {
            const updated = prev.map(l => {
              if (l.id === activeListId) {
                if (l.tickers.some(t => t.symbol === symbol)) return l;
                return { ...l, tickers: [...l.tickers, newTicker] };
              }
              return l;
            });
            storage.saveLists(updated);
            return updated;
          });
        } else {
          // Fallback to mock if backend is down or symbol not found
          storage.addTickerToList(activeListId, symbol);
          setLists(storage.getLists());
        }
      } catch (err) {
        console.error('Fetch failed, using mock data');
        storage.addTickerToList(activeListId, symbol);
        setLists(storage.getLists());
      }
    }
  };

  const handleRefreshAll = async () => {
    const allSymbols = [...new Set(lists.flatMap(l => l.tickers.map(t => t.symbol)))];
    if (allSymbols.length === 0) return;

    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/batch?symbols=${allSymbols.join(',')}`);
      if (!response.ok) throw new Error('Backend unavaliable');
      const data = await response.json();
      
      const updatedLists = lists.map(list => ({
        ...list,
        tickers: list.tickers.map(ticker => {
          const freshData = data.find((d: any) => d.symbol === ticker.symbol);
          if (freshData) {
            return {
              ...ticker,
              name: freshData.name,
              stats: {
                ...ticker.stats,
                price: freshData.price.toString(),
                change: freshData.change.toString(),
                changePercent: freshData.changePercent,
                volume: freshData.volume,
                marketCap: freshData.marketCap,
                sector: freshData.sector,
                sma20: freshData.sma20,
                sma50: freshData.sma50,
                sma200: freshData.sma200,
                perf1M: freshData.perf1M,
                perf3M: freshData.perf3M,
                perf1Y: freshData.perf1Y,
                lastUpdated: new Date().toISOString(),
                error: undefined
              }
            };
          }
          return ticker;
        })
      }));
      
      setLists(updatedLists);
      storage.saveLists(updatedLists);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to refresh data:', error);
      showToast(`Failed to refresh data: ${errorMsg}`);
      const updatedLists = lists.map(list => ({
        ...list,
        tickers: list.tickers.map(ticker => {
          if (allSymbols.includes(ticker.symbol)) {
            return {
              ...ticker,
              stats: { ...ticker.stats, error: 'Refresh failed' }
            };
          }
          return ticker;
        })
      }));
      setLists(updatedLists);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRemoveTicker = (listId: string, tickerId: string) => {
    storage.removeTickerFromList(listId, tickerId);
    setLists(storage.getLists());
  };

  const handleTransferTicker = (fromListId: string, toListId: string, tickerId: string, isCopy: boolean) => {
    const allLists = storage.getLists();
    const fromList = allLists.find(l => l.id === fromListId);
    const toList = allLists.find(l => l.id === toListId);
    
    if (!fromList || !toList) return;
    
    const ticker = fromList.tickers.find(t => t.id === tickerId);
    if (!ticker) return;

    // Check for duplicate in target list
    const isDuplicate = toList.tickers.some(t => t.symbol === ticker.symbol);
    if (isDuplicate) return;

    if (isCopy) {
      // Create a brand new ticker object to avoid reference issues
      const copiedTicker = { ...ticker, id: uuidv4() };
      toList.tickers.push(copiedTicker);
    } else {
      // Move logic: Remove from source
      fromList.tickers = fromList.tickers.filter(t => t.id !== tickerId);
      // Add to target
      toList.tickers.push(ticker);
    }

    storage.saveLists(allLists);
    setLists(allLists);
  };

  return (
    <div className="app-container">
      <Sidebar 
        lists={lists} 
        groups={groups}
        isCollapsed={isSidebarCollapsed} 
        onCreateList={() => setIsCreateModalOpen(true)}
        onCreateGroup={() => setIsCreateGroupModalOpen(true)}
        onDeleteList={(id) => {
          if (window.confirm('Delete this list permanently?')) {
            storage.deleteList(id);
            setLists(lists.filter(l => l.id !== id));
          }
        }}
        onDeleteGroup={handleDeleteGroup}
        onToggleGroup={handleToggleGroup}
        onSelectListItem={(id) => {
          const list = lists.find(l => l.id === id);
          if (list) handleHideList(id, !list.isVisible);
        }}
        onMoveListToGroup={handleMoveListToGroup}
        onReorderList={handleReorderList}
        onReorderGroup={handleReorderGroup}
      />
      
      <main className="workbench">
        {lists.filter(list => {
          if (!searchQuery.trim()) return list.isVisible;
          return list.tickers.some(t => t.symbol.toLowerCase().includes(searchQuery.trim().toLowerCase()));
        }).map(list => (
          <ListPanel 
            key={list.id} 
            list={list} 
            onUpdate={handleUpdateList} 
            onDelete={(id) => handleHideList(id, false)}
            onAddTicker={handleOpenAddTicker}
            onRemoveTicker={handleRemoveTicker}
            onTransferTicker={handleTransferTicker}
          />
        ))}
        
        <Toolbar 
          onCreateList={() => setIsCreateModalOpen(true)} 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onRefreshAll={handleRefreshAll}
          isRefreshing={isRefreshing}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      </main>

      {/* Create List Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New List</h3>
            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>List Name</label>
              <input 
                type="text" 
                value={newListName} 
                onChange={e => setNewListName(e.target.value)}
                placeholder="e.g. My Favorites"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateList()}
              />
            </div>
            <div className="input-group">
              <label>Country</label>
              <select 
                value={newCountry} 
                onChange={e => setNewCountry(e.target.value)}
              >
                {Object.keys(COUNTRY_FLAGS).map(country => (
                  <option key={country} value={country}>
                    {COUNTRY_FLAGS[country]} {country}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>Theme Color</label>
              <div className="color-picker">
                {COLORS.map(color => (
                  <div 
                    key={color} 
                    className={`color-option ${newListColor === color ? 'selected' : ''}`}
                    style={{ background: color }}
                    onClick={() => setNewListColor(color)}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateList}>Create</button>
              <button className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }} onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ticker Modal */}
      {isAddTickerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTickerModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Ticker</h3>
            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Ticker Symbol or Name</label>
              <input 
                type="text" 
                value={newTickerSymbol} 
                onChange={e => setNewTickerSymbol(e.target.value)}
                placeholder="e.g. AAPL"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && performAddTicker()}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={performAddTicker}>Add to List</button>
              <button className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }} onClick={() => setIsAddTickerModalOpen(false)}>Cancel</button>
            </div>
            <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Suggestions: AAPL, MSFT, TSLA, GOOGL, AMZN
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateGroupModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateGroupModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create New Group</h3>
            <div className="input-group" style={{ marginTop: '20px' }}>
              <label>Group Name</label>
              <input 
                type="text" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="e.g. Technology"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreateGroup()}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleCreateGroup}>Create Group</button>
              <button className="btn" style={{ flex: 1, border: '1px solid var(--border-color)' }} onClick={() => setIsCreateGroupModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast toast-${toastType}`}>
          <span>{toastMessage}</span>
          <button className="toast-close" onClick={() => setToastMessage(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default App;
