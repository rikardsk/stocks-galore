import type { StockList, Ticker, ListGroup, StockAlert, TickerNotification } from './types';
import { generateMockStats, MOCK_TICKERS } from './types';
import { v4 as uuidv4 } from 'uuid';
import { idb } from './indexedDB';

const STORAGE_KEY = 'stocks_galore_workbench';
const GROUPS_KEY = 'stocks_galore_groups';
const ALERTS_KEY = 'stocks_galore_alerts';
const NOTIFICATIONS_KEY = 'stocks_galore_notifications';

// In-memory cache for synchronous reads
let listsCache: StockList[] = [];
let groupsCache: ListGroup[] = [];
let alertsCache: StockAlert[] = [];
let notificationsCache: TickerNotification[] = [];
let isDbInitialized = false;

export const storage = {
  // Initialize and migrate localStorage data if present
  init: async (): Promise<void> => {
    if (isDbInitialized) return;

    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('IndexedDB initialization timed out')), 2000);
    });

    const migrationAndLoad = async () => {
      // Check for localStorage legacy data
      const localLists = localStorage.getItem(STORAGE_KEY);
      const localGroups = localStorage.getItem(GROUPS_KEY);
      const localAlerts = localStorage.getItem(ALERTS_KEY);
      const localNotifications = localStorage.getItem(NOTIFICATIONS_KEY);

      // 1. Lists migration
      if (localLists) {
        listsCache = JSON.parse(localLists);
        await idb.set(STORAGE_KEY, listsCache);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        listsCache = (await idb.get<StockList[]>(STORAGE_KEY)) || [];
      }

      // 2. Groups migration
      if (localGroups) {
        groupsCache = JSON.parse(localGroups);
        await idb.set(GROUPS_KEY, groupsCache);
        localStorage.removeItem(GROUPS_KEY);
      } else {
        groupsCache = (await idb.get<ListGroup[]>(GROUPS_KEY)) || [];
      }

      // 3. Alerts migration
      if (localAlerts) {
        alertsCache = JSON.parse(localAlerts);
        await idb.set(ALERTS_KEY, alertsCache);
        localStorage.removeItem(ALERTS_KEY);
      } else {
        alertsCache = (await idb.get<StockAlert[]>(ALERTS_KEY)) || [];
      }

      // 4. Notifications migration
      if (localNotifications) {
        notificationsCache = JSON.parse(localNotifications);
        await idb.set(NOTIFICATIONS_KEY, notificationsCache);
        localStorage.removeItem(NOTIFICATIONS_KEY);
      } else {
        notificationsCache = (await idb.get<TickerNotification[]>(NOTIFICATIONS_KEY)) || [];
      }
    };

    try {
      await Promise.race([migrationAndLoad(), timeout]);
      isDbInitialized = true;
    } catch (err) {
      console.error('IndexedDB initialization failed or timed out:', err);
      // Fallback: load whatever is still in localStorage or empty arrays
      try {
        const localLists = localStorage.getItem(STORAGE_KEY);
        listsCache = localLists ? JSON.parse(localLists) : [];
        
        const localGroups = localStorage.getItem(GROUPS_KEY);
        groupsCache = localGroups ? JSON.parse(localGroups) : [];
        
        const localAlerts = localStorage.getItem(ALERTS_KEY);
        alertsCache = localAlerts ? JSON.parse(localAlerts) : [];
        
        const localNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
        notificationsCache = localNotifications ? JSON.parse(localNotifications) : [];
      } catch (fallbackErr) {
        console.error('Fallback load failed:', fallbackErr);
      }
      isDbInitialized = true; // Mark as initialized so App.tsx can proceed
    }
  },

  // --- Lists ---
  getLists: (): StockList[] => {
    return [...listsCache];
  },

  saveLists: (lists: StockList[]) => {
    listsCache = [...lists];
    idb.set(STORAGE_KEY, listsCache).catch((err) => {
      console.error('Failed to save lists to IndexedDB:', err);
    });
  },

  createList: (name: string, color: string, country?: string, position?: { x: number; y: number }): StockList => {
    const newList: StockList = {
      id: uuidv4(),
      name,
      color,
      country,
      tickers: [],
      position: position || { x: 320, y: 50 },
      isCollapsed: false,
      showStats: false,
      isVisible: true,
      sortOrder: 'none',
      createdAt: Date.now()
    };
    const lists = storage.getLists();
    storage.saveLists([...lists, newList]);
    return newList;
  },

  updateList: (updatedList: StockList) => {
    const lists = storage.getLists();
    const index = lists.findIndex((l) => l.id === updatedList.id);
    if (index !== -1) {
      lists[index] = updatedList;
      storage.saveLists(lists);
    }
  },

  deleteList: (id: string) => {
    const lists = storage.getLists();
    storage.saveLists(lists.filter((l) => l.id !== id));
    
    // Also remove from any groups
    const groups = storage.getGroups();
    const updatedGroups = groups.map(g => ({
      ...g,
      listIds: g.listIds.filter(lid => lid !== id)
    }));
    storage.saveGroups(updatedGroups);
  },

  // --- Tickers ---
  addTickerToList: (listId: string, symbol: string): Ticker | null => {
    const lists = storage.getLists();
    const listIndex = lists.findIndex((l) => l.id === listId);
    if (listIndex === -1) return null;

    const mockInfo = MOCK_TICKERS.find((t) => t.symbol === symbol.toUpperCase());
    
    if (lists[listIndex].tickers.some(t => t.symbol === symbol.toUpperCase())) {
      return null;
    }

    const portfolioList = lists.find(l => l.id === 'permanent-portfolio');
    const isOwned = listId === 'permanent-portfolio' || (portfolioList?.tickers.some(t => t.symbol === symbol.toUpperCase()) || false);

    const newTicker: Ticker = {
      id: uuidv4(),
      symbol: symbol.toUpperCase(),
      name: mockInfo?.name || 'Unknown Company',
      isOwned,
      stats: generateMockStats(),
    };

    lists[listIndex].tickers.push(newTicker);
    storage.saveLists(lists);
    return newTicker;
  },

  removeTickerFromList: (listId: string, tickerId: string) => {
    const lists = storage.getLists();
    const listIndex = lists.findIndex((l) => l.id === listId);
    if (listIndex !== -1) {
      lists[listIndex].tickers = lists[listIndex].tickers.filter((t) => t.id !== tickerId);
      storage.saveLists(lists);
    }
  },

  // --- Groups ---
  getGroups: (): ListGroup[] => {
    return [...groupsCache];
  },

  saveGroups: (groups: ListGroup[]) => {
    groupsCache = [...groups];
    idb.set(GROUPS_KEY, groupsCache).catch((err) => {
      console.error('Failed to save groups to IndexedDB:', err);
    });
  },

  createGroup: (name: string): ListGroup => {
    const newGroup: ListGroup = {
      id: uuidv4(),
      name,
      isCollapsed: false,
      listIds: []
    };
    const groups = storage.getGroups();
    storage.saveGroups([...groups, newGroup]);
    return newGroup;
  },

  updateGroup: (updatedGroup: ListGroup) => {
    const groups = storage.getGroups();
    const index = groups.findIndex(g => g.id === updatedGroup.id);
    if (index !== -1) {
      groups[index] = updatedGroup;
      storage.saveGroups(groups);
    }
  },

  deleteGroup: (id: string) => {
    const groups = storage.getGroups();
    storage.saveGroups(groups.filter(g => g.id !== id));
  },

  // --- Export/Import ---
  exportData: () => {
    const lists = storage.getLists();
    const groups = storage.getGroups();
    const alerts = storage.getAlerts();
    const notifications = storage.getNotifications();
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      lists,
      groups,
      alerts,
      notifications
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stocks_galore_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: (jsonData: any) => {
    if (!jsonData || typeof jsonData !== 'object') return false;
    
    if (jsonData.lists && Array.isArray(jsonData.lists)) {
      storage.saveLists(jsonData.lists);
    }
    if (jsonData.groups && Array.isArray(jsonData.groups)) {
      storage.saveGroups(jsonData.groups);
    }
    if (jsonData.alerts && Array.isArray(jsonData.alerts)) {
      storage.saveAlerts(jsonData.alerts);
    }
    if (jsonData.notifications && Array.isArray(jsonData.notifications)) {
      storage.saveNotifications(jsonData.notifications);
    }
    return true;
  },

  // --- Alerts ---
  getAlerts: (): StockAlert[] => {
    return [...alertsCache];
  },

  saveAlerts: (alerts: StockAlert[]) => {
    alertsCache = [...alerts];
    idb.set(ALERTS_KEY, alertsCache).catch((err) => {
      console.error('Failed to save alerts to IndexedDB:', err);
    });
  },

  addAlert: (alert: Omit<StockAlert, 'id' | 'isTriggered'>): StockAlert => {
    const alerts = storage.getAlerts();
    const newAlert: StockAlert = {
      ...alert,
      id: uuidv4(),
      isTriggered: false
    };
    storage.saveAlerts([...alerts, newAlert]);
    return newAlert;
  },

  deleteAlert: (id: string) => {
    const alerts = storage.getAlerts();
    storage.saveAlerts(alerts.filter(a => a.id !== id));
  },

  updateAlert: (updated: StockAlert) => {
    const alerts = storage.getAlerts();
    storage.saveAlerts(alerts.map(a => a.id === updated.id ? updated : a));
  },

  // --- Notifications ---
  getNotifications: (): TickerNotification[] => {
    return [...notificationsCache];
  },

  saveNotifications: (notifications: TickerNotification[]) => {
    notificationsCache = [...notifications];
    idb.set(NOTIFICATIONS_KEY, notificationsCache).catch((err) => {
      console.error('Failed to save notifications to IndexedDB:', err);
    });
  },

  addNotification: (notification: Omit<TickerNotification, 'id' | 'isRead' | 'timestamp'>): TickerNotification => {
    const notifications = storage.getNotifications();
    const newNotification: TickerNotification = {
      ...notification,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    storage.saveNotifications([newNotification, ...notifications]);
    return newNotification;
  },

  markNotificationsRead: () => {
    const notifications = storage.getNotifications();
    storage.saveNotifications(notifications.map(n => ({ ...n, isRead: true })));
  },

  clearNotifications: () => {
    storage.saveNotifications([]);
  },

  removeNotifications: (ids: string[]) => {
    const notifications = storage.getNotifications();
    storage.saveNotifications(notifications.filter(n => !ids.includes(n.id)));
  }
};
