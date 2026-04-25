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
