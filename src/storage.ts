import type { StockList, Ticker, ListGroup } from './types';
import { generateMockStats, MOCK_TICKERS } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'stocks_galore_workbench';
const GROUPS_KEY = 'stocks_galore_groups';

export const storage = {
  // --- Lists ---
  getLists: (): StockList[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  },

  saveLists: (lists: StockList[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  },

  createList: (name: string, color: string, country?: string): StockList => {
    const newList: StockList = {
      id: uuidv4(),
      name,
      color,
      country,
      tickers: [],
      position: { x: 50, y: 50 },
      isCollapsed: false,
      showStats: false,
      isVisible: true,
      sortOrder: 'none'
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

    const newTicker: Ticker = {
      id: uuidv4(),
      symbol: symbol.toUpperCase(),
      name: mockInfo?.name || 'Unknown Company',
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
    const data = localStorage.getItem(GROUPS_KEY);
    if (!data) return [];
    return JSON.parse(data);
  },

  saveGroups: (groups: ListGroup[]) => {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
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
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      lists,
      groups
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
    return true;
  }
};
