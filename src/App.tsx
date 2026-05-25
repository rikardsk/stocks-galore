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
import { RankingModal } from './components/RankingModal';
import { StockDetailModal } from './components/StockDetailModal';
import { SearchChoiceModal } from './components/SearchChoiceModal';
import { AssignGroupModal } from './components/AssignGroupModal';
import { EarningsModal } from './components/EarningsModal';
import './index.css';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const WATCHLIST_ID = 'permanent-watchlist';
const PORTFOLIO_ID = 'permanent-portfolio';
const TODAY_ID = 'permanent-today';
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
  const [toastType, setToastType] = useState<'error' | 'success' | 'warning'>('error');
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
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  
  // Search Fallback state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');
  const [selectedDetailTicker, setSelectedDetailTicker] = useState<Ticker | null>(null);
  const [shouldReopenNotifications, setShouldReopenNotifications] = useState(false);
  const [shouldReopenRanking, setShouldReopenRanking] = useState(false);
  const [shouldReopenAnalytics, setShouldReopenAnalytics] = useState(false);
  const [isEarningsOpen, setIsEarningsOpen] = useState(false);
  const [shouldReopenEarnings, setShouldReopenEarnings] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState(COLORS[0]);
  const [newCountry, setNewCountry] = useState('No Country');
  const [newTickerSymbol, setNewTickerSymbol] = useState('');

  const [groups, setGroups] = useState<ListGroup[]>([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [isAssignGroupModalOpen, setIsAssignGroupModalOpen] = useState(false);
  const [listToAssign, setListToAssign] = useState<string | null>(null);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setToastType(type);
    setToastMessage(message);
  };

  const autoLabelTicker = (ticker: Ticker): Ticker => {
    const earningsDate = ticker.stats.earningsDate;
    if (!earningsDate || earningsDate === 'N/A') return ticker;
    
    const changePctStr = ticker.stats.changePercent.replace('%', '');
    const changePercent = parseFloat(changePctStr);
    
    // Get today and yesterday in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const isEarningsPeriod = earningsDate === today || earningsDate === yesterday;
    if (!isEarningsPeriod) return ticker;
    
    const currentBadges = ticker.badges || [];
    let newBadges = [...currentBadges];
    let changed = false;
    
    if (changePercent >= 10 && !newBadges.includes('EARNINGS BEAT')) {
      newBadges.push('EARNINGS BEAT');
      newBadges = newBadges.filter(b => b !== 'EARNINGS MISS');
      changed = true;
      
      const targetAlertId = `earnings-beat-${ticker.symbol}-${today}`;
      const existingNotifs = storage.getNotifications();
      const isAlreadyNotified = existingNotifs.some(n => 
        n.alertId === targetAlertId || 
        (n.symbol === ticker.symbol && n.type === 'earnings' && n.message.includes('Earnings Beat') && n.timestamp.startsWith(today))
      );
      
      if (!isAlreadyNotified) {
        storage.addNotification({
          alertId: targetAlertId,
          symbol: ticker.symbol,
          message: `${ticker.symbol} Earnings Beat! Today's change: ${ticker.stats.changePercent}`,
          type: 'earnings'
        });
      }
    } else if (changePercent <= -10 && !newBadges.includes('EARNINGS MISS')) {
      newBadges.push('EARNINGS MISS');
      newBadges = newBadges.filter(b => b !== 'EARNINGS BEAT');
      changed = true;
      
      const targetAlertId = `earnings-miss-${ticker.symbol}-${today}`;
      const existingNotifs = storage.getNotifications();
      const isAlreadyNotified = existingNotifs.some(n => 
        n.alertId === targetAlertId || 
        (n.symbol === ticker.symbol && n.type === 'earnings' && n.message.includes('Earnings Miss') && n.timestamp.startsWith(today))
      );
      
      if (!isAlreadyNotified) {
        storage.addNotification({
          alertId: targetAlertId,
          symbol: ticker.symbol,
          message: `${ticker.symbol} Earnings Miss! Today's change: ${ticker.stats.changePercent}`,
          type: 'earnings'
        });
      }
    }
    
    return changed ? { ...ticker, badges: newBadges } : ticker;
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
      // Update the existing one and ensure it has the right ID and is protected
      const existing = currentLists[watchlistIndex];
      if (existing.id !== WATCHLIST_ID || !existing.isProtected) {
        currentLists[watchlistIndex] = { 
          ...existing, 
          id: WATCHLIST_ID, 
          name: 'Watchlist',
          isProtected: true
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
      if (existing.id !== PORTFOLIO_ID || !existing.isProtected) {
        currentLists[portfolioIndex] = { 
          ...existing, 
          id: PORTFOLIO_ID, 
          name: 'Portfolio',
          isProtected: true
        };
        changed = true;

        // Remove any other duplicates that might have been created
        currentLists = currentLists.filter((l, idx) => 
          idx === portfolioIndex || (l.id !== PORTFOLIO_ID && l.name !== 'Portfolio')
        );
      }
    }

    // Find any existing Today (by ID or name)
    const todayIndex = currentLists.findIndex(l => l.id === TODAY_ID || l.name === 'Today');
    
    if (todayIndex === -1) {
      // Create it if it doesn't exist
      const today: StockList = {
        id: TODAY_ID,
        name: 'Today',
        color: '#10b981',
        tickers: [],
        position: { x: 850, y: 50 }, // Offset from Portfolio (450, 50)
        isCollapsed: false,
        showStats: true,
        isVisible: true,
        sortOrder: 'none',
        isProtected: true
      };
      
      // Place it right after Portfolio if it exists
      const pIdx = currentLists.findIndex(l => l.id === PORTFOLIO_ID);
      if (pIdx !== -1) {
        currentLists.splice(pIdx + 1, 0, today);
      } else {
        currentLists.push(today);
      }
      changed = true;
    } else {
      // Update the existing one and ensure it's protected and has the right ID
      const existing = currentLists[todayIndex];
      if (existing.id !== TODAY_ID || !existing.isProtected) {
        currentLists[todayIndex] = { 
          ...existing, 
          id: TODAY_ID, 
          name: 'Today',
          isProtected: true
        };
        changed = true;

        // Remove any other duplicates that might have been created
        currentLists = currentLists.filter((l, idx) => 
          idx === todayIndex || (l.id !== TODAY_ID && l.name !== 'Today')
        );
      }
    }

    if (changed) storage.saveLists(currentLists);
    
    setLists(currentLists);
    setGroups(storage.getGroups());
    setAlerts(storage.getAlerts());
    setNotifications(storage.getNotifications());
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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
    const today = new Date().toISOString().split('T')[0];
    const activeAlerts = storage.getAlerts();
    let triggeredCount = 0;

    if (activeAlerts.length > 0) {
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
          message,
          type: alert.metric === 'price' ? 'price' : 'changePercent'
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
    }

    // --- Automatic Crossover Detection ---
    // Deduplicate tickers by symbol for crossover detection to avoid multiple notifications if ticker is in multiple lists
    const uniqueTickersForCrossover = Array.from(new Map(updatedTickers.map(t => [t.symbol, t])).values());

    uniqueTickersForCrossover.forEach(ticker => {
      const price = parseFloat(ticker.stats.price);
      const change = parseFloat(ticker.stats.change);
      const prevPrice = price - change;

      [10, 20, 50, 100, 200].forEach(period => {
        const smaKey = `sma${period}` as keyof typeof ticker.stats;
        const smaVal = ticker.stats[smaKey] as number | undefined;

        if (smaVal) {
          const crossedAbove = prevPrice < smaVal && price > smaVal;
          const crossedBelow = prevPrice > smaVal && price < smaVal;

          if (crossedAbove || crossedBelow) {
            const direction = crossedAbove ? 'ABOVE' : 'BELOW';
            const targetAlertId = `cross-${ticker.symbol}-${period}-${direction.toLowerCase()}-${today}`;
            const existingNotifs = storage.getNotifications();
            
            const isAlreadyNotified = existingNotifs.some(n => 
              n.alertId === targetAlertId ||
              (n.symbol === ticker.symbol && 
               n.message.includes(`crossed ${direction} SMA${period}`) &&
               n.timestamp.startsWith(today))
            );

            if (!isAlreadyNotified) {
              triggeredCount++;
              storage.addNotification({
                alertId: targetAlertId,
                symbol: ticker.symbol,
                message: `${ticker.symbol} crossed ${direction} SMA${period} (Price: $${price}, SMA: ${smaVal})`,
                type: `sma${period}` as any
              });
            }
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

  const handleRenameGroup = (id: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = groups.map(g => g.id === id ? { ...g, name: newName } : g);
    setGroups(updated);
    storage.saveGroups(updated);
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
    // Update the list's isArchived and isProtected status
    const isArchiving = groupId === 'archive';
    const isPinning = groupId === 'pinned';
    const targetGroupId = (isArchiving || isPinning) ? null : groupId;

    const list = lists.find(l => l.id === listId);
    if (list) {
      handleUpdateList({ ...list, isArchived: isArchiving, isProtected: isPinning });
    }

    const updatedGroups = groups.map(group => {
      // Remove from any existing group
      let listIds = group.listIds.filter(id => id !== listId);
      // Add to target group
      if (group.id === targetGroupId) {
        listIds.push(listId);
      }
      const updated = { ...group, listIds };
      storage.updateGroup(updated);
      return updated;
    });
    setGroups(updatedGroups);
  };

  const handleOpenAssignModal = (listId: string) => {
    setListToAssign(listId);
    setIsAssignGroupModalOpen(true);
  };

  const handleAssignListToGroup = (groupId: string | null) => {
    if (listToAssign) {
      handleMoveListToGroup(listToAssign, groupId);
    }
    setIsAssignGroupModalOpen(false);
    setListToAssign(null);
  };

  const handleCreateGroupFromAssign = () => {
    setIsAssignGroupModalOpen(false);
    setIsCreateGroupModalOpen(true);
  };

  const handleMoveGroup = (groupId: string, direction: 'up' | 'down') => {
    const index = groups.findIndex(g => g.id === groupId);
    if (index === -1) return;
    
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === groups.length - 1) return;
    
    const newGroups = [...groups];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newGroups[index], newGroups[targetIndex]] = [newGroups[targetIndex], newGroups[index]];
    
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

  const handleAddPinnedList = (name: string) => {
    const newList: import('./types').StockList = {
      id: uuidv4(),
      name: name.trim(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tickers: [],
      position: { x: 50, y: 50 },
      isCollapsed: false,
      showStats: true,
      isVisible: true,
      sortOrder: 'none',
      isProtected: true,
    };
    const updated = [...lists, newList];
    storage.saveLists(updated);
    setLists(updated);
  };

  const handleDeletePinnedList = (id: string) => {
    storage.deleteList(id);
    setLists(prev => prev.filter(l => l.id !== id));
  };

  const handleRenameList = (id: string, newName: string, color?: string) => {
    if (!newName.trim()) return;
    const list = lists.find(l => l.id === id);
    if (list) {
      handleUpdateList({ ...list, name: newName, color: color || list.color });
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

    // We no longer force isOwned = true for PORTFOLIO_ID here.
    // If a user toggled ownership off within the Portfolio list, we respect it.

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

      // Collect owned tickers from ALL lists to ensure we have a master copy of each owned ticker
      updatedTickers.forEach(t => {
        if (t.isOwned && !allOwnedTickersMap[t.symbol]) {
          allOwnedTickersMap[t.symbol] = { ...t };
        }
      });

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

  const performAddTicker = async (symbolToUse?: string) => {
    if (!activeListId) return;
    
    // Use either the selected symbol from modal OR the input text
    const query = symbolToUse || newTickerSymbol.trim().toUpperCase();
    if (!query) return;

    // Handle comma-separated list if not coming from selection modal
    const symbols = symbolToUse ? [symbolToUse] : query.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    
    setIsAddTickerModalOpen(false);
    setIsSearchModalOpen(false);
    setNewTickerSymbol('');

    for (const symbol of symbols) {
      try {
        const response = await fetch(`${API_BASE_URL}/stock/${symbol}`);
        
        if (response.status === 404 && symbols.length === 1 && !symbolToUse) {
          // Fallback to search if it was a single input that failed
          showToast(`Ticker "${symbol}" not found, searching for company name...`, 'warning');
          const searchResponse = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(symbol)}`);
          if (searchResponse.ok) {
            const results = await searchResponse.json();
            if (results.length === 0) {
              showToast(`Ticker or company "${symbol}" not found`, 'error');
            } else if (results.length === 1) {
              performAddTicker(results[0].symbol);
              return;
            } else {
              setSearchResults(results);
              setPendingSearchQuery(symbol);
              setIsSearchModalOpen(true);
            }
          }
          continue;
        }

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
              sparkline: data.sparkline,
              description: data.description,
              pe: data.pe,
              high52: data.high52,
              low52: data.low52,
              avgVolume: data.avgVolume,
              earningsDate: data.earningsDate,
              ipoDate: data.ipoDate
            }
          };
          
          const autoLabeledTicker = autoLabelTicker(newTicker);
          
          setLists(prev => {
            const updated = prev.map(l => {
              if (l.id === activeListId) {
                if (l.tickers.some(t => t.symbol === symbol)) return l;
                return { ...l, tickers: [...l.tickers, autoLabeledTicker] };
              }
              return l;
            });
            storage.saveLists(updated);
            setNotifications(storage.getNotifications());
            checkAlerts([autoLabeledTicker]);
            return updated;
          });
          showToast(`${symbol} added successfully!`, 'success');
        } else {
          storage.addTickerToList(activeListId, symbol);
          setLists(storage.getLists());
          showToast(`Ticker "${symbol}" not found, added placeholder`, 'warning');
        }
      } catch (err) {
        console.error('Fetch failed', err);
        showToast(`Failed to add "${symbol}". Please check your connection or try again.`, 'error');
        // Still add placeholder so the UI doesn't just hang
        storage.addTickerToList(activeListId, symbol);
        setLists(storage.getLists());
      }
    }
  };

  const refreshSymbols = async (symbols: string[], onProgress?: (progress: number) => void) => {
    if (symbols.length === 0) return [];

    const CHUNK_SIZE = 15;
    const chunks = [];
    for (let i = 0; i < symbols.length; i += CHUNK_SIZE) {
      chunks.push(symbols.slice(i, i + CHUNK_SIZE));
    }

    let allFreshData: any[] = [];
    let processedCount = 0;

    for (const chunk of chunks) {
      const response = await fetch(`${API_BASE_URL}/batch?symbols=${chunk.join(',')}`);
      if (!response.ok) throw new Error('Backend unavailable');
      const data = await response.json();
      allFreshData = [...allFreshData, ...data];
      
      processedCount += chunk.length;
      if (onProgress) onProgress(Math.round((processedCount / symbols.length) * 100));
    }
    return allFreshData;
  };

  const handleRefreshAll = async () => {
    const activeListsForRefresh = lists.filter(l => !l.isArchived);
    const allSymbols = [...new Set(activeListsForRefresh.flatMap(l => l.tickers.map(t => t.symbol)))];
    if (allSymbols.length === 0) return;

    setIsRefreshing(true);
    setRefreshProgress(0);
    
    try {
      const allFreshData = await refreshSymbols(allSymbols, setRefreshProgress);
      
      const updatedLists = lists.map(list => {
        if (list.isArchived) return list;
        return {
          ...list,
          lastUpdated: new Date().toISOString(),
          tickers: list.tickers.map(ticker => {
          const freshData = allFreshData.find((d: any) => d.symbol === ticker.symbol);
          if (freshData) {
            const updatedTicker = {
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
                description: freshData.description,
                pe: freshData.pe,
                high52: freshData.high52,
                low52: freshData.low52,
                avgVolume: freshData.avgVolume,
                earningsDate: freshData.earningsDate,
                ipoDate: freshData.ipoDate,
                error: undefined
              }
            };
            return autoLabelTicker(updatedTicker);
          }
          return ticker;
        })
      };
    });
      
      setLists(updatedLists);
      storage.saveLists(updatedLists);
      setNotifications(storage.getNotifications());

      // Check alerts for all refreshed tickers
      const allRefreshedTickers = updatedLists.flatMap(l => l.tickers);
      checkAlerts(allRefreshedTickers);
      showToast('Market data refreshed!', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to refresh data:', error);
      showToast(`Failed to refresh data: ${errorMsg}`);
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshProgress(0), 1000);
    }
  };

  const handleRefreshList = async (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list || list.tickers.length === 0) return;

    const symbols = list.tickers.map(t => t.symbol);
    
    try {
      const freshDataList = await refreshSymbols(symbols);
      
      const updatedList = {
        ...list,
        lastUpdated: new Date().toISOString(),
        tickers: list.tickers.map(ticker => {
          const freshData = freshDataList.find((d: any) => d.symbol === ticker.symbol);
          if (freshData) {
            const updatedTicker = {
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
                description: freshData.description,
                pe: freshData.pe,
                high52: freshData.high52,
                low52: freshData.low52,
                avgVolume: freshData.avgVolume,
                earningsDate: freshData.earningsDate,
                ipoDate: freshData.ipoDate,
                error: undefined
              }
            };
            return autoLabelTicker(updatedTicker);
          }
          return ticker;
        })
      };

      // Update lists state
      const updatedLists = lists.map(l => l.id === listId ? updatedList : l);
      setLists(updatedLists);
      setNotifications(storage.getNotifications());
      storage.saveLists(updatedLists);
      
      // Check alerts for refreshed tickers in this list
      checkAlerts(updatedList.tickers);
      showToast(`List "${list.name}" refreshed!`, 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to refresh list ${listId}:`, error);
      showToast(`Failed to refresh list: ${errorMsg}`);
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
      setAlerts(storage.getAlerts());
      setNotifications(storage.getNotifications());
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

  const handleClearList = (listId: string) => {
    if (window.confirm('Remove all tickers from this list?')) {
      const list = lists.find(l => l.id === listId);
      if (list) {
        handleUpdateList({ ...list, tickers: [] });
        showToast(`Cleared ${list.name}`, 'success');
      }
    }
  };

  const addAlertBadgeForSymbol = (symbol: string) => {
    setLists(prevLists => {
      const next = prevLists.map(l => ({
        ...l,
        tickers: l.tickers.map(t => {
          if (t.symbol !== symbol) return t;
          const currentBadges = t.badges || [];
          if (currentBadges.includes('ALERT')) return t;
          return { ...t, badges: [...currentBadges, 'ALERT'] };
        })
      }));
      storage.saveLists(next);
      return next;
    });
    setSelectedDetailTicker(prev => {
      if (!prev || prev.symbol !== symbol) return prev;
      const currentBadges = prev.badges || [];
      if (currentBadges.includes('ALERT')) return prev;
      return { ...prev, badges: [...currentBadges, 'ALERT'] };
    });
  };

  const removeAlertBadgeForSymbol = (symbol: string) => {
    setLists(prevLists => {
      const next = prevLists.map(l => ({
        ...l,
        tickers: l.tickers.map(t => {
          if (t.symbol !== symbol) return t;
          const currentBadges = t.badges || [];
          if (!currentBadges.includes('ALERT')) return t;
          return { ...t, badges: currentBadges.filter(b => b !== 'ALERT') };
        })
      }));
      storage.saveLists(next);
      return next;
    });
    setSelectedDetailTicker(prev => {
      if (!prev || prev.symbol !== symbol) return prev;
      const currentBadges = prev.badges || [];
      if (!currentBadges.includes('ALERT')) return prev;
      return { ...prev, badges: currentBadges.filter(b => b !== 'ALERT') };
    });
  };

  const handleAddAlert = (alertData: Omit<StockAlert, 'id' | 'isTriggered'>) => {
    storage.addAlert(alertData);
    const updatedAlerts = storage.getAlerts();
    setAlerts(updatedAlerts);
    if (alertData.metric === 'price') {
      addAlertBadgeForSymbol(alertData.symbol);
    }
  };

  const handleDeleteAlert = (id: string) => {
    const alertToDelete = alerts.find(a => a.id === id);
    if (!alertToDelete) return;
    
    storage.deleteAlert(id);
    const updatedAlerts = storage.getAlerts();
    setAlerts(updatedAlerts);

    if (alertToDelete.metric === 'price') {
      const symbol = alertToDelete.symbol;
      const hasRemainingAlerts = updatedAlerts.some(a => a.symbol === symbol && a.metric === 'price');
      if (!hasRemainingAlerts) {
        removeAlertBadgeForSymbol(symbol);
      }
    }
  };

  return (
    <div className={`app-container ${theme === 'light' ? 'light-theme' : ''}`}>
      <Sidebar 
        lists={lists} 
        groups={groups}
        isCollapsed={isSidebarCollapsed} 
        onCreateList={() => setIsCreateModalOpen(true)}
        onCreateGroup={() => setIsCreateGroupModalOpen(true)}
        onDeleteList={(id) => {
          const list = lists.find(l => l.id === id);
          const listName = list ? list.name : '';
          const confirmMsg = listName 
            ? `Delete "${listName}" permanently?` 
            : 'Delete this list permanently?';
          if (window.confirm(confirmMsg)) {
            storage.deleteList(id);
            setLists(lists.filter(l => l.id !== id));
          }
        }}
        onDeleteGroup={handleDeleteGroup}
        onToggleGroup={handleToggleGroup}
        onMoveGroup={handleMoveGroup}
        onRenameGroup={handleRenameGroup}
        onRenameList={handleRenameList}
        onSelectListItem={(id) => {
          const list = lists.find(l => l.id === id);
          if (list) {
            const wasVisible = list.isVisible;
            handleHideList(id, !wasVisible);
            
            if (!wasVisible) {
              setTimeout(() => {
                const element = document.getElementById(`list-panel-${id}`);
                if (element) {
                  const rect = element.getBoundingClientRect();
                  const isVisible = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                  );

                  if (!isVisible) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                  }
                }
              }, 100);
            }
          }
        }}
        onMoveListToGroup={handleMoveListToGroup}
        onAssignList={handleOpenAssignModal}
        onClearList={handleClearList}
        onTogglePinnedHidden={(id, isHidden) => {
          const list = lists.find(l => l.id === id);
          if (list) handleUpdateList({ ...list, isPinnedHidden: isHidden });
        }}
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
              const query = searchQuery.trim().toLowerCase();
              if (query.length < 3) return list.isVisible;
              
              return list.tickers.some(t => 
                t.symbol.toLowerCase().includes(query) || 
                (t.badges && t.badges.some(b => b.toLowerCase().includes(query)))
              );
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
                onSelectTicker={setSelectedDetailTicker}
                onRefresh={handleRefreshList}
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
          onOpenRanking={() => setIsRankingOpen(true)}
          onOpenEarnings={() => setIsEarningsOpen(true)}
          unreadCount={notifications.filter(n => !n.isRead).length}
          activeFilterCount={countActiveFilters(globalFilters)}
        />
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
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => performAddTicker()}>Add to List</button>
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
        theme={theme}
        onToggleTheme={toggleTheme}
        pinnedLists={lists.filter(l => l.isProtected)}
        onTogglePinnedVisibility={(id, shownInSidebar) => {
          const list = lists.find(l => l.id === id);
          if (list) handleUpdateList({ ...list, isPinnedHidden: !shownInSidebar });
        }}
        onAddPinnedList={handleAddPinnedList}
        onDeletePinnedList={handleDeletePinnedList}
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
        onSelectTicker={setSelectedDetailTicker}
        theme={theme}
      />

      <AnalyticsModal 
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        tickers={allUniqueTickers}
        lists={lists}
        groups={groups}
        notifications={notifications}
        theme={theme}
        onSelectTicker={(ticker) => {
          setSelectedDetailTicker(ticker);
          setIsAnalyticsOpen(false);
          setShouldReopenAnalytics(true);
        }}
      />

      <RankingModal 
        isOpen={isRankingOpen} 
        onClose={() => setIsRankingOpen(false)} 
        tickers={allUniqueTickers}
        onSelectTicker={(ticker) => {
          setSelectedDetailTicker(ticker);
          setIsRankingOpen(false);
          setShouldReopenRanking(true);
        }}
        theme={theme}
      />

      <EarningsModal 
        isOpen={isEarningsOpen} 
        onClose={() => setIsEarningsOpen(false)} 
        tickers={allUniqueTickers}
        watchlistSymbols={watchlistSymbols}
        onSelectTicker={(ticker) => {
          setSelectedDetailTicker(ticker);
          setIsEarningsOpen(false);
          setShouldReopenEarnings(true);
        }}
      />

      <SearchChoiceModal 
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        query={pendingSearchQuery}
        results={searchResults}
        onSelect={(symbol) => performAddTicker(symbol)}
      />

      <StockDetailModal 
        isOpen={!!selectedDetailTicker}
        ticker={selectedDetailTicker}
        onClose={() => {
          setSelectedDetailTicker(null);
          if (shouldReopenNotifications) {
            setIsNotificationsModalOpen(true);
            setShouldReopenNotifications(false);
          }
          if (shouldReopenRanking) {
            setIsRankingOpen(true);
            setShouldReopenRanking(false);
          }
          if (shouldReopenAnalytics) {
            setIsAnalyticsOpen(true);
            setShouldReopenAnalytics(false);
          }
          if (shouldReopenEarnings) {
            setIsEarningsOpen(true);
            setShouldReopenEarnings(false);
          }
        }}
        onToggleOwned={(ticker) => {
          const isCurrentlyOwned = ticker.isOwned;
          setLists(prev => prev.map(l => ({
            ...l,
            tickers: l.tickers.map(t => t.symbol === ticker.symbol ? { ...t, isOwned: !isCurrentlyOwned } : t)
          })));
        }}
        onToggleWatchlist={(ticker) => handleToggleWatchlist(ticker)}
        onUpdateBadges={(ticker, badges) => {
          setLists(prevLists => {
            const next = prevLists.map(l => ({
              ...l,
              tickers: l.tickers.map(t => t.symbol === ticker.symbol ? { ...t, badges } : t)
            }));
            storage.saveLists(next);
            return next;
          });
          setSelectedDetailTicker(prev => prev && prev.symbol === ticker.symbol ? { ...prev, badges } : prev);
        }}
        onUpdateNotes={(ticker, notes) => {
          setLists(prevLists => {
            const next = prevLists.map(l => ({
              ...l,
              tickers: l.tickers.map(t => t.symbol === ticker.symbol ? { ...t, notes } : t)
            }));
            storage.saveLists(next);
            return next;
          });
          setSelectedDetailTicker(prev => prev && prev.symbol === ticker.symbol ? { ...prev, notes } : prev);
        }}
        isWatchlisted={selectedDetailTicker ? watchlistSymbols.has(selectedDetailTicker.symbol) : false}
        notifications={notifications}
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
        onUpdateAlert={(updated) => {
          storage.updateAlert(updated);
          setAlerts(storage.getAlerts());
        }}
        theme={theme}
      />

      <NotificationsModal 
        isOpen={isNotificationsModalOpen} 
        onClose={() => setIsNotificationsModalOpen(false)} 
        notifications={notifications}
        onClear={(ids?: string[]) => {
          if (ids) {
            storage.removeNotifications(ids);
            setNotifications(storage.getNotifications());
          } else {
            storage.clearNotifications();
            setNotifications([]);
          }
        }}
        onMarkRead={() => {
          storage.markNotificationsRead();
          setNotifications(storage.getNotifications());
        }}
        onOpenAlerts={() => {
          setIsNotificationsModalOpen(false);
          setIsAlertsModalOpen(true);
        }}
        onSelectTicker={(ticker) => {
          setSelectedDetailTicker(ticker);
          setShouldReopenNotifications(true);
        }}
        allTickers={allUniqueTickers}
      />

      <AlertsModal 
        isOpen={isAlertsModalOpen} 
        onClose={() => setIsAlertsModalOpen(false)} 
        alerts={alerts}
        onAddAlert={handleAddAlert}
        onDeleteAlert={handleDeleteAlert}
      />

      <AssignGroupModal 
        groups={groups}
        isOpen={isAssignGroupModalOpen}
        onClose={() => setIsAssignGroupModalOpen(false)}
        onAssign={handleAssignListToGroup}
        onCreateGroup={handleCreateGroupFromAssign}
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
