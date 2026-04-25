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
    sma20?: number;
    sma50?: number;
    sma200?: number;
    perf1M?: number;
    perf3M?: number;
    perf1Y?: number;
    lastUpdated?: string;
    error?: string;
  };
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

export interface StockFilters {
  priceMin: string;
  priceMax: string;
  marketCapMin: string; // in billions
  marketCapMax: string; // in billions
  sectors: string[];
}

export const EMPTY_FILTERS: StockFilters = {
  priceMin: '',
  priceMax: '',
  marketCapMin: '',
  marketCapMax: '',
  sectors: [],
};

/** Parse market cap strings like "2.30T", "0.15T" into billions */
export const parseMarketCap = (capStr: string): number | null => {
  if (!capStr || capStr === 'N/A') return null;
  const num = parseFloat(capStr);
  if (isNaN(num)) return null;
  if (capStr.endsWith('T')) return num * 1000;
  if (capStr.endsWith('B')) return num;
  if (capStr.endsWith('M')) return num / 1000;
  return num;
};

export const countActiveFilters = (filters: StockFilters): number => {
  let count = 0;
  if (filters.priceMin) count++;
  if (filters.priceMax) count++;
  if (filters.marketCapMin) count++;
  if (filters.marketCapMax) count++;
  if (filters.sectors.length > 0) count++;
  return count;
};

export const tickerMatchesFilters = (ticker: Ticker, filters: StockFilters): boolean => {
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

  if (filters.sectors.length > 0) {
    if (!ticker.stats.sector || !filters.sectors.includes(ticker.stats.sector)) return false;
  }

  return true;
};
