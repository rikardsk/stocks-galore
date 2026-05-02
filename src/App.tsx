import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Sidebar } from './components/Sidebar';
import { ListPanel } from './components/ListPanel';
import { Toolbar } from './components/Toolbar';
import { storage } from './storage';
import { EMPTY_FILTERS, countActiveFilters } from './types';
import type { StockList, ListGroup, StockFilters, StockAlert, TickerNotification, Ticker } from './types';
import { COUNTRY_FLAGS } from './types';
import { FilterModal } from './components/FilterModal';
import { SettingsModal, type RefreshInterval } from './components/SettingsModal';
import { TableView } from './components/TableView';
import { NotificationsModal } from './components/NotificationsModal';
import { AlertsModal } from './components/AlertsModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import './index.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const WATCHLIST_ID = 'permanent-watchlist';
const PORTFOLIO_ID = 'permanent-portfolio';
const API_BASE_URL = 'http://localhost:8000';

const App: React.FC = () => {
  const [lists, setLists] = useState<StockList[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddTickerModalOpen, setIsAddTickerModalOpen] = useState(false);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'success'>('error');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [globalFilters, setGlobalFilters] = useState<StockFilters>(EMPTY_FILTERS);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>('manual');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);
  
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [notifications, setNotifications] = useState<TickerNotification[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  
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
        showStats: true,
        isVisible: true,
        sortOrder: 'none',
        isProtected: true
      };
      currentLists = [watchlist, ...currentLists];
      changed = true;
    } else {
      // Update the existing one and ensure it's protected and has the right ID
      const existing = currentLists[watchlistIndex];
      if (!existing.isProtected || existing.id !== WATCHLIST_ID || existing.position.y !== 50) {
        currentLists[watchlistIndex] = { 
          ...existing, 
          id: WATCHLIST_ID, 
          name: 'Watchlist',
          isProtected: true,
          position: { ...existing.position, y: 50 }
        };
        changed = true;
        
        // Remove any other duplicates that might have been created
        currentLists = currentLists.filter((l, idx) => 
          idx === watchlistIndex || (l.id !== WATCHLIST_ID && l.name !== 'Watchlist')
        );
      }
    }

    // Find any existing Portfolio (by ID or name)
    const portfolioIndex = currentLists.findIndex(l => l.id === PORTFOLIO_ID || l.name === 'Portfolio');
    
    if (portfolioIndex === -1) {
      // Create it if it doesn't exist
      const portfolio: StockList = {
        id: PORTFOLIO_ID,
        name: 'Portfolio',
        color: '#f59e0b',
        tickers: [],
        position: { x: 450, y: 50 }, // Offset from Watchlist (50, 50)
        isCollapsed: false,
        showStats: true,
        isVisible: true,
        sortOrder: 'none',
        isProtected: true
      };
      
      // Place it right after Watchlist if it exists
      const wIdx = currentLists.findIndex(l => l.id === WATCHLIST_ID);
      if (wIdx !== -1) {
        currentLists.splice(wIdx + 1, 0, portfolio);
      } else {
        currentLists.push(portfolio);
      }
      changed = true;
    } else {
      // Update the existing one and ensure it's protected and has the right ID
      const existing = currentLists[portfolioIndex];
      if (!existing.isProtected || existing.id !== PORTFOLIO_ID || existing.position.y !== 50) {
        currentLists[portfolioIndex] = { 
          ...existing, 
          id: PORTFOLIO_ID, 
          name: 'Portfolio',
          isProtected: true,
          position: { ...existing.position, y: 50 }
        };
        changed = true;

        // Remove any other duplicates that might have been created
        currentLists = currentLists.filter((l, idx) => 
          idx === portfolioIndex || (l.id !== PORTFOLIO_ID && l.name !== 'Portfolio')
        );
      }
    }

    if (changed) storage.saveLists(currentLists);
    
    setLists(currentLists);
    setGroups(storage.getGroups());
    setAlerts(storage.getAlerts());
    setNotifications(storage.getNotifications());
  }, []);

  // Compute available sectors across all lists for the filter modal
  const availableSectors = React.useMemo(() => {
    const sectors = new Set<string>();
    lists.forEach(l => l.tickers.forEach(t => {
      if (t.stats.sector && t.stats.sector !== 'N/A') sectors.add(t.stats.sector);
    }));
    return Array.from(sectors).sort();
  }, [lists]);

  // Unique tickers across all lists for the Table View
  const allUniqueTickers = React.useMemo(() => {
    const seen = new Set<string>();
    const unique: Ticker[] = [];
    lists.forEach(l => l.tickers.forEach(t => {
      if (!seen.has(t.symbol)) {
        seen.add(t.symbol);
        unique.push(t);
      }
    }));
    return unique;
  }, [lists]);

  // Handle auto-refresh based on interval
  useEffect(() => {
    if (refreshInterval === 'manual') return;
    
    let ms = 60000;
    if (refreshInterval === '5m') ms = 300000;
    if (refreshInterval === '15m') ms = 900000;

    const timer = setInterval(() => {
      handleRefreshAll();
    }, ms);

    return () => clearInterval(timer);
  }, [refreshInterval, lists]);

  const checkAlerts = (updatedTickers: Ticker[]) => {
    const activeAlerts = storage.getAlerts();
    if (activeAlerts.length === 0) return;

    let triggeredCount = 0;
    const updatedAlerts = activeAlerts.map(alert => {
      const ticker = updatedTickers.find(t => t.symbol === alert.symbol);
      if (!ticker) return alert;

      let isMet = false;
      let currentValue = 0;

      if (alert.metric === 'price') {
        currentValue = parseFloat(ticker.stats.price);
        if (alert.operator === 'above' && currentValue > alert.value) isMet = true;
        if (alert.operator === 'below' && currentValue < alert.value) isMet = true;
      } else if (alert.metric === 'changePercent') {
        currentValue = parseFloat(ticker.stats.changePercent);
        if (alert.operator === 'above' && currentValue > alert.value) isMet = true;
        if (alert.operator === 'below' && currentValue < alert.value) isMet = true;
      }

      if (isMet && !alert.isTriggered) {
        triggeredCount++;
        const message = `${alert.symbol} ${alert.metric === 'price' ? 'Price' : 'Change'} is ${alert.operator} ${alert.metric === 'price' ? '$' : ''}${alert.value}${alert.metric === 'changePercent' ? '%' : ''} (Current: ${alert.metric === 'price' ? '$' : ''}${currentValue}${alert.metric === 'changePercent' ? '%' : ''})`;
        
        storage.addNotification({
          alertId: alert.id,
          symbol: alert.symbol,
          message
        });
        return { ...alert, isTriggered: true };
      }
      
      if (!isMet && alert.isTriggered) {
        return { ...alert, isTriggered: false };
      }

      return alert;
    });

    if (triggeredCount > 0) {
      storage.saveAlerts(updatedAlerts);
      setAlerts(updatedAlerts);
    }

    // --- Automatic Crossover Detection ---
    updatedTickers.forEach(ticker => {
      const price = parseFloat(ticker.stats.price);
      const change = parseFloat(ticker.stats.change);
      const prevPrice = price - change;

      [10, 20, 50, 100, 200].forEach(period => {
        const smaKey = `sma${period}` as keyof typeof ticker.stats;
        const smaVal = ticker.stats[smaKey] as number | undefined;

        if (smaVal && prevPrice < smaVal && price > smaVal) {
          // Check if we already notified about this today to avoid spamming on every refresh
          // For simplicity, we'll check if a notification with this message already exists from today
          const message = `${ticker.symbol} crossed ABOVE SMA${period} (Price: $${price}, SMA: ${smaVal})`;
          const existingNotifs = storage.getNotifications();
          const today = new Date().toISOString().split('T')[0];
          
          const isAlreadyNotified = existingNotifs.some(n => 
            n.symbol === ticker.symbol && 
            n.message.includes(`crossed ABOVE SMA${period}`) &&
            n.timestamp.startsWith(today)
          );

          if (!isAlreadyNotified) {
            triggeredCount++;
            storage.addNotification({
              alertId: `cross-${ticker.symbol}-${period}`,
              symbol: ticker.symbol,
              message
            });
          }
        }
      });
    });

    if (triggeredCount > 0) {
      setNotifications(storage.getNotifications());
      showToast(`${triggeredCount} new notification(s)!`, 'success');
    }
  };

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
    // 1. Determine the source of truth for owned status
    const ownedStatusMap: Record<string, boolean> = {};
    
    // Check all lists (except the one being updated) for current owned status
    lists.forEach(l => {
      if (l.id !== updatedList.id) {
        l.tickers.forEach(t => {
          if (t.isOwned) ownedStatusMap[t.symbol] = true;
        });
      }
    });

    // Update with the changes from the updated list
    updatedList.tickers.forEach(t => {
      ownedStatusMap[t.symbol] = !!t.isOwned;
    });

    // If we are updating the Portfolio list itself, any ticker in it MUST be owned
    if (updatedList.id === PORTFOLIO_ID) {
      updatedList.tickers.forEach(t => {
        t.isOwned = true;
        ownedStatusMap[t.symbol] = true;
      });
    }

    // 2. Sync isOwned across ALL lists and collect all owned tickers
    const allOwnedTickersMap: Record<string, Ticker> = {};
    
    let syncedLists = lists.map(l => {
      const currentList = l.id === updatedList.id ? updatedList : l;
      
      const updatedTickers = currentList.tickers.map(t => {
        const shouldBeOwned = !!ownedStatusMap[t.symbol];
        if (t.isOwned !== shouldBeOwned) {
          return { ...t, isOwned: shouldBeOwned };
        }
        return t;
      });

      // Collect owned tickers for the Portfolio list (ignoring the portfolio list itself for now)
      if (currentList.id !== PORTFOLIO_ID) {
        updatedTickers.forEach(t => {
          if (t.isOwned && !allOwnedTickersMap[t.symbol]) {
            allOwnedTickersMap[t.symbol] = { ...t };
          }
        });
      }

      return { ...currentList, tickers: updatedTickers };
    });

    // 3. Ensure the Portfolio list contains exactly the owned tickers
    syncedLists = syncedLists.map(l => {
      if (l.id === PORTFOLIO_ID) {
        const ownedTickers = Object.values(allOwnedTickersMap);
        // We only update if the contents actually changed to avoid unnecessary re-renders
        const currentSymbols = l.tickers.map(t => t.symbol).sort().join(',');
        const newSymbols = ownedTickers.map(t => t.symbol).sort().join(',');
        
        if (currentSymbols !== newSymbols) {
          return { ...l, tickers: ownedTickers };
        }
      }
      return l;
    });

    storage.saveLists(syncedLists);
    setLists(syncedLists);
  };

  const handleClearWorkbench = () => {
    if (window.confirm('Clear all lists from the workbench?')) {
      const updatedLists = lists.map(list => ({ ...list, isVisible: false }));
      setLists(updatedLists);
      storage.saveLists(updatedLists);
    }
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
              sma10: data.sma10,
              sma20: data.sma20,
              sma50: data.sma50,
              sma100: data.sma100,
              sma200: data.sma200,
              perf1M: data.perf1M,
              perf3M: data.perf3M,
              perf1Y: data.perf1Y,
              dividendYield: data.dividendYield,
              lastUpdated: new Date().toISOString(),
              sparkline: data.sparkline
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
            
            // Check alerts for the newly added ticker
            checkAlerts([newTicker]);
            
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
    setRefreshProgress(0);
    
    const CHUNK_SIZE = 15;
    const chunks = [];
    for (let i = 0; i < allSymbols.length; i += CHUNK_SIZE) {
      chunks.push(allSymbols.slice(i, i + CHUNK_SIZE));
    }

    let allFreshData: any[] = [];
    let processedCount = 0;

    try {
      for (const chunk of chunks) {
        const response = await fetch(`${API_BASE_URL}/batch?symbols=${chunk.join(',')}`);
        if (!response.ok) throw new Error('Backend unavailable');
        const data = await response.json();
        allFreshData = [...allFreshData, ...data];
        
        processedCount += chunk.length;
        setRefreshProgress(Math.round((processedCount / allSymbols.length) * 100));
      }
      
      const updatedLists = lists.map(list => ({
        ...list,
        tickers: list.tickers.map(ticker => {
          const freshData = allFreshData.find((d: any) => d.symbol === ticker.symbol);
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
                sma10: freshData.sma10,
                sma20: freshData.sma20,
                sma50: freshData.sma50,
                sma100: freshData.sma100,
                sma200: freshData.sma200,
                perf1M: freshData.perf1M,
                perf3M: freshData.perf3M,
                perf1Y: freshData.perf1Y,
                dividendYield: freshData.dividendYield,
                lastUpdated: new Date().toISOString(),
                sparkline: freshData.sparkline,
                error: undefined
              }
            };
          }
          return ticker;
        })
      }));
      
      setLists(updatedLists);
      storage.saveLists(updatedLists);

      // Check alerts for all refreshed tickers
      const allRefreshedTickers = updatedLists.flatMap(l => l.tickers);
      checkAlerts(allRefreshedTickers);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to refresh data:', error);
      showToast(`Failed to refresh data: ${errorMsg}`);
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshProgress(0), 1000);
    }
  };

  const handleRemoveTicker = (listId: string, tickerId: string) => {
    const list = lists.find(l => l.id === listId);
    if (list) {
      const updatedList = {
        ...list,
        tickers: list.tickers.filter(t => t.id !== tickerId)
      };
      handleUpdateList(updatedList);
    }
  };

  const handleTransferTicker = (fromListId: string, toListId: string, tickerId: string, isCopy: boolean) => {
    const fromList = lists.find(l => l.id === fromListId);
    const toList = lists.find(l => l.id === toListId);
    
    if (!fromList || !toList) return;
    
    const ticker = fromList.tickers.find(t => t.id === tickerId);
    if (!ticker) return;

    // Check for duplicate in target list
    const isDuplicate = toList.tickers.some(t => t.symbol === ticker.symbol);
    if (isDuplicate) return;

    if (isCopy) {
      const copiedTicker = { ...ticker, id: uuidv4() };
      const updatedToList = { ...toList, tickers: [...toList.tickers, copiedTicker] };
      handleUpdateList(updatedToList);
    } else {
      // Move: Update both lists. We can do this by updating toList and the sync logic will handle the rest
      // but we need to remove from fromList first.
      const updatedFromList = { ...fromList, tickers: fromList.tickers.filter(t => t.id !== tickerId) };
      const updatedToList = { ...toList, tickers: [...toList.tickers, ticker] };
      
      // We'll update the fromList first, then the toList to ensure sync
      storage.updateList(updatedFromList);
      handleUpdateList(updatedToList);
    }
  };

  const handleToggleWatchlist = (ticker: Ticker) => {
    const watchlist = lists.find(l => l.id === WATCHLIST_ID);
    if (!watchlist) return;

    const isInWatchlist = watchlist.tickers.some(t => t.symbol === ticker.symbol);
    
    if (isInWatchlist) {
      // Remove from watchlist
      const updatedWatchlist = {
        ...watchlist,
        tickers: watchlist.tickers.filter(t => t.symbol !== ticker.symbol)
      };
      handleUpdateList(updatedWatchlist);
    } else {
      // Add to watchlist
      const newTicker = { ...ticker, id: uuidv4() };
      const updatedWatchlist = {
        ...watchlist,
        tickers: [...watchlist.tickers, newTicker]
      };
      handleUpdateList(updatedWatchlist);
    }
  };

  const handleImportData = (data: any) => {
    if (storage.importData(data)) {
      setLists(storage.getLists());
      setGroups(storage.getGroups());
      showToast('Data imported successfully!', 'success');
      setIsSettingsModalOpen(false);
    } else {
      showToast('Import failed: Invalid data format', 'error');
    }
  };

  const watchlistSymbols = React.useMemo(() => {
    const watchlist = lists.find(l => l.id === WATCHLIST_ID);
    return new Set(watchlist?.tickers.map(t => t.symbol) || []);
  }, [lists]);

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
      
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {isRefreshing && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: '3px', 
            background: 'rgba(255,255,255,0.1)', 
            zIndex: 1000,
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              background: 'var(--accent)', 
              width: `${refreshProgress}%`,
              transition: 'width 0.3s ease-out',
              boxShadow: '0 0 10px var(--accent)'
            }} />
          </div>
        )}
        <main className="workbench">
          <div className="canvas">
            {lists.filter(list => {
              if (!searchQuery.trim()) return list.isVisible;
              return list.tickers.some(t => t.symbol.toLowerCase().includes(searchQuery.trim().toLowerCase()));
            }).map(list => (
              <ListPanel 
                key={list.id} 
                list={list} 
                globalFilters={globalFilters}
                watchlistSymbols={watchlistSymbols}
                onUpdate={handleUpdateList} 
                onDelete={(id) => handleHideList(id, false)}
                onAddTicker={handleOpenAddTicker}
                onRemoveTicker={handleRemoveTicker}
                onTransferTicker={handleTransferTicker}
                onToggleWatchlist={handleToggleWatchlist}
              />
            ))}
          </div>
        </main>
        
        <Toolbar 
          onCreateList={() => setIsCreateModalOpen(true)} 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onRefreshAll={handleRefreshAll}
          onClearWorkbench={handleClearWorkbench}
          isRefreshing={isRefreshing}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onOpenFilter={() => setIsFilterModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenTable={() => setIsTableViewOpen(true)}
          onOpenNotifications={() => setIsNotificationsModalOpen(true)}
          onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          unreadCount={notifications.filter(n => !n.isRead).length}
          activeFilterCount={countActiveFilters(globalFilters)}
        />

        {isTableViewOpen && (
          <TableView 
            isOpen={isTableViewOpen}
            onClose={() => setIsTableViewOpen(false)}
            tickers={allUniqueTickers}
            filters={globalFilters}
            lists={lists}
            groups={groups}
            watchlistSymbols={watchlistSymbols}
            onApplyFilters={setGlobalFilters}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleOwned={(ticker) => {
              const updatedTicker = { ...ticker, isOwned: !ticker.isOwned };
              // We need to find a list that contains this ticker to update it
              // Or just call handleUpdateList with a partial list update logic?
              // handleUpdateList expects a full StockList.
              // Let's find the first list containing this ticker.
              const listWithTicker = lists.find(l => l.tickers.some(t => t.symbol === ticker.symbol));
              if (listWithTicker) {
                const updatedTickers = listWithTicker.tickers.map(t => 
                  t.symbol === ticker.symbol ? { ...t, isOwned: !t.isOwned } : t
                );
                handleUpdateList({ ...listWithTicker, tickers: updatedTickers });
              }
            }}
          />
        )}
      </div>

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

      <FilterModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
        filters={globalFilters} 
        onApplyFilters={setGlobalFilters} 
        availableSectors={availableSectors} 
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        refreshInterval={refreshInterval} 
        onRefreshIntervalChange={setRefreshInterval}
        onImportData={handleImportData}
      />

      <TableView 
        isOpen={isTableViewOpen} 
        onClose={() => setIsTableViewOpen(false)} 
        tickers={allUniqueTickers}
        filters={globalFilters}
        lists={lists}
        groups={groups}
        watchlistSymbols={watchlistSymbols}
        onApplyFilters={setGlobalFilters}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleOwned={(ticker) => {
          const listWithTicker = lists.find(l => l.tickers.some(t => t.symbol === ticker.symbol));
          if (listWithTicker) {
            const updatedTickers = listWithTicker.tickers.map(t => 
              t.symbol === ticker.symbol ? { ...t, isOwned: !t.isOwned } : t
            );
            handleUpdateList({ ...listWithTicker, tickers: updatedTickers });
          }
        }}
      />

      <AnalyticsModal 
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        tickers={allUniqueTickers}
        lists={lists}
        groups={groups}
      />

      <NotificationsModal 
        isOpen={isNotificationsModalOpen} 
        onClose={() => setIsNotificationsModalOpen(false)} 
        notifications={notifications}
        onClear={() => {
          storage.clearNotifications();
          setNotifications([]);
        }}
        onMarkRead={() => {
          storage.markNotificationsRead();
          setNotifications(storage.getNotifications());
        }}
        onOpenAlerts={() => {
          setIsNotificationsModalOpen(false);
          setIsAlertsModalOpen(true);
        }}
      />

      <AlertsModal 
        isOpen={isAlertsModalOpen} 
        onClose={() => setIsAlertsModalOpen(false)} 
        alerts={alerts}
        onAddAlert={(a) => {
          storage.addAlert(a);
          setAlerts(storage.getAlerts());
        }}
        onDeleteAlert={(id) => {
          storage.deleteAlert(id);
          setAlerts(storage.getAlerts());
        }}
      />

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
