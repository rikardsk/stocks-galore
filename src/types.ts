export type Ticker = {
  id: string;
  symbol: string;
  name: string;
  stats: {
    price: string;
    change: string;
    changePercent: string;
    volume: string;
    marketCap: string;
    // New backend fields
    sector?: string;
    sma10?: number;
    sma20?: number;
    sma50?: number;
    sma100?: number;
    sma200?: number;
    perf1M?: number;
    perf3M?: number;
    perf1Y?: number;
    dividendYield?: number;
    lastUpdated?: string;
    error?: string;
    sparkline?: number[];
    description?: string;
    pe?: number;
    high52?: number;
    low52?: number;
    avgVolume?: string;
    earningsDate?: string;
  };
  isOwned?: boolean;
  badges?: string[];
};

export type StockList = {
  id: string;
  name: string;
  color: string;
  country?: string;
  tickers: Ticker[];
  position: { x: number; y: number };
  isCollapsed: boolean;
  showStats: boolean;
  isVisible: boolean;
  sortOrder: 'asc' | 'desc' | 'none';
  isProtected?: boolean;
  isArchived?: boolean;
  lastUpdated?: string;
};

export const COUNTRY_FLAGS: Record<string, string> = {
  "No Country": "",
  "US": "🇺🇸",
  "Canada": "🇨🇦",
  "Sweden": "🇸🇪",
  "Norway": "🇳🇴",
  "Finland": "🇫🇮",
  "Denmark": "🇩🇰",
  "Germany": "🇩🇪",
  "UK": "🇬🇧",
  "France": "🇫🇷",
  "Netherlands": "🇳🇱",
  "Switzerland": "🇨🇭",
  "Italy": "🇮🇹",
  "Spain": "🇪🇸",
  "Other": "🌍"
};

export type ListGroup = {
  id: string;
  name: string;
  isCollapsed: boolean;
  listIds: string[];
};

export const MOCK_TICKERS: Partial<Ticker>[] = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms, Inc.' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
];

export const generateMockStats = () => ({
  price: (Math.random() * 1000 + 50).toFixed(2),
  change: (Math.random() * 20 - 10).toFixed(2),
  changePercent: (Math.random() * 5 - 2.5).toFixed(2) + '%',
  volume: (Math.random() * 10).toFixed(1) + 'M',
  marketCap: (Math.random() * 3).toFixed(1) + 'T',
});

export interface FilterRule {
  id: string;
  metric: 'sma10_dist' | 'sma20_dist' | 'sma50_dist' | 'sma100_dist' | 'sma200_dist' | 'perf1M' | 'perf3M' | 'perf1Y' | 'dividendYield';
  operator: 'above' | 'below';
  value: string;
}

export interface StockAlert {
  id: string;
  symbol: string;
  metric: 'price' | 'changePercent';
  operator: 'above' | 'below';
  value: number;
  isTriggered: boolean;
}

export interface TickerNotification {
  id: string;
  alertId: string;
  symbol: string;
  message: string;
  timestamp: string;
  type: 'price' | 'changePercent' | 'crossover' | 'sma10' | 'sma20' | 'sma50' | 'sma100' | 'sma200';
  isRead: boolean;
}

export interface StockFilters {
  priceMin: string;
  priceMax: string;
  marketCapMin: string; // in billions
  marketCapMax: string; // in billions
  sectors: string[];
  rules?: FilterRule[];
  ownedOnly?: boolean;
  watchlistOnly?: boolean;
}

export const EMPTY_FILTERS: StockFilters = {
  priceMin: '',
  priceMax: '',
  marketCapMin: '',
  marketCapMax: '',
  sectors: [],
  rules: [],
  ownedOnly: false,
  watchlistOnly: false,
};

/** Parse market cap strings like "2.30T", "0.15T" into billions */
export const parseMarketCap = (capStr: string | number): number | null => {
  if (capStr === undefined || capStr === null || capStr === 'N/A') return null;
  if (typeof capStr === 'number') return capStr;
  
  const num = parseFloat(capStr);
  if (isNaN(num)) return null;
  if (capStr.endsWith('T')) return num * 1000;
  if (capStr.endsWith('B')) return num;
  if (capStr.endsWith('M')) return num / 1000;
  return num;
};

/** Format market cap (in billions) to a nice string */
export const formatMarketCap = (capInBillions: number | string | null | undefined): string => {
  if (capInBillions === null || capInBillions === undefined) return 'N/A';
  
  const num = typeof capInBillions === 'string' ? parseMarketCap(capInBillions) : capInBillions;
  if (num === null || isNaN(num)) return 'N/A';

  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'T';
  }
  if (num >= 1) {
    return num.toFixed(2) + 'B';
  }
  if (num >= 0.001) {
    return (num * 1000).toFixed(2) + 'M';
  }
  return num.toFixed(2) + 'B';
};

export const countActiveFilters = (filters: StockFilters): number => {
  let count = 0;
  if (filters.priceMin) count++;
  if (filters.priceMax) count++;
  if (filters.marketCapMin) count++;
  if (filters.marketCapMax) count++;
  if (filters.sectors && filters.sectors.length > 0) count++;
  if (filters.rules && filters.rules.length > 0) count += filters.rules.length;
  if (filters.ownedOnly) count++;
  if (filters.watchlistOnly) count++;
  return count;
};

export const tickerMatchesFilters = (ticker: Ticker, filters: StockFilters): boolean => {
  if (filters.ownedOnly && !ticker.isOwned) return false;

  const price = parseFloat(ticker.stats.price);
  if (!isNaN(price)) {
    if (filters.priceMin && price < parseFloat(filters.priceMin)) return false;
    if (filters.priceMax && price > parseFloat(filters.priceMax)) return false;
  }

  const cap = parseMarketCap(ticker.stats.marketCap);
  if (cap !== null) {
    if (filters.marketCapMin && cap < parseFloat(filters.marketCapMin)) return false;
    if (filters.marketCapMax && cap > parseFloat(filters.marketCapMax)) return false;
  }

  if (filters.sectors && filters.sectors.length > 0) {
    if (!ticker.stats.sector || !filters.sectors.includes(ticker.stats.sector)) return false;
  }

  if (filters.rules && filters.rules.length > 0) {
    for (const rule of filters.rules) {
      if (!rule.value) continue;
      const targetVal = parseFloat(rule.value);
      if (isNaN(targetVal)) continue;

      let actualVal: number | undefined;

      switch (rule.metric) {
        case 'sma10_dist':
          if (ticker.stats.sma10) {
            actualVal = ((price - ticker.stats.sma10) / ticker.stats.sma10) * 100;
          }
          break;
        case 'sma20_dist':
          if (ticker.stats.sma20) {
            actualVal = ((price - ticker.stats.sma20) / ticker.stats.sma20) * 100;
          }
          break;
        case 'sma50_dist':
          if (ticker.stats.sma50) {
            actualVal = ((price - ticker.stats.sma50) / ticker.stats.sma50) * 100;
          }
          break;
        case 'sma100_dist':
          if (ticker.stats.sma100) {
            actualVal = ((price - ticker.stats.sma100) / ticker.stats.sma100) * 100;
          }
          break;
        case 'sma200_dist':
          if (ticker.stats.sma200) {
            actualVal = ((price - ticker.stats.sma200) / ticker.stats.sma200) * 100;
          }
          break;
        case 'perf1M':
          actualVal = ticker.stats.perf1M;
          break;
        case 'perf3M':
          actualVal = ticker.stats.perf3M;
          break;
        case 'perf1Y':
          actualVal = ticker.stats.perf1Y;
          break;
        case 'dividendYield':
          actualVal = ticker.stats.dividendYield;
          break;
      }

      if (actualVal === undefined) return false;

      if (rule.operator === 'above' && actualVal < targetVal) return false;
      if (rule.operator === 'below' && actualVal > targetVal) return false;
    }
  }

  return true;
};
