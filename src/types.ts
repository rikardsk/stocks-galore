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
    currency?: string;
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
    earningsTime?: string;
    exDividendDate?: string;
    dividendDate?: string;
    ipoDate?: string;
    crossover_sma20_sma50?: boolean;
    crossover_sma50_sma200?: boolean;
    crossover_sma10_above?: boolean;
    crossover_sma10_below?: boolean;
    crossover_sma20_above?: boolean;
    crossover_sma20_below?: boolean;
    crossover_sma50_above?: boolean;
    crossover_sma50_below?: boolean;
    crossover_sma100_above?: boolean;
    crossover_sma100_below?: boolean;
    crossover_sma200_above?: boolean;
    crossover_sma200_below?: boolean;
  };
  isOwned?: boolean;
  badges?: string[];
  notes?: string;
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
  sortOrder: 'asc' | 'desc' | 'gain-asc' | 'gain-desc' | 'none';
  isProtected?: boolean;
  isArchived?: boolean;
  isPinnedHidden?: boolean;
  lastUpdated?: string;
  zIndex?: number;
  createdAt?: number;
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
  "Brazil": "🇧🇷",
  "Japan": "🇯🇵",
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
  type: 'price' | 'changePercent' | 'crossover' | 'sma10' | 'sma20' | 'sma50' | 'sma100' | 'sma200' | 'earnings' | 'sma20_sma50' | 'sma50_sma200';
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
  earningsOnly?: boolean;
  perfFilterValue?: number;
  perfFilterDirection?: 'above' | 'below' | 'none';
  perfFilterTimeframe?: 'today' | 'yesterday' | '1M' | '3M' | '1Y';
  fiftyTwoWeekFilter?: number;
  fiftyTwoWeekDirection?: 'above' | 'below' | 'none';
  peFilter?: number;
  peDirection?: 'above' | 'below' | 'none';
  volumeFilter?: 'none' | '2x' | '3x' | '4x' | '5x';
  yieldFilter?: number;
  yieldDirection?: 'above' | 'below' | 'none';
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
  earningsOnly: false,
  perfFilterValue: 0,
  perfFilterDirection: 'none',
  perfFilterTimeframe: 'today',
  fiftyTwoWeekFilter: 50,
  fiftyTwoWeekDirection: 'none',
  peFilter: 20,
  peDirection: 'none',
  volumeFilter: 'none',
  yieldFilter: 2,
  yieldDirection: 'none',
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

export const formatPrice = (price: number | string | undefined | null, currency?: string, decimals: number = 2): string => {
  if (price === undefined || price === null) return 'N/A';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'N/A';
  
  const curr = currency?.toUpperCase() || 'USD';
  switch (curr) {
    case 'USD':
      return `$${num.toFixed(decimals)}`;
    case 'EUR':
      return `€${num.toFixed(decimals)}`;
    case 'GBP':
      return `£${num.toFixed(decimals)}`;
    case 'GBP':
    case 'GBp':
      // GBp is British pence, so we divide by 100 to show in pounds, or show pence?
      // Standard is to format GBp divided by 100 in pounds, or keep as pence?
      // Let's divide by 100 for GBp if it is GBp, or just append p. Let's do £ for GBP and keep pence as p.
      return curr === 'GBp' ? `${num.toFixed(decimals)}p` : `£${num.toFixed(decimals)}`;
    case 'SEK':
    case 'NOK':
    case 'DKK':
      return `${num.toFixed(decimals)} kr`;
    default:
      return `${num.toFixed(decimals)} ${curr}`;
  }
};

export const getCurrencySymbol = (currency?: string): { symbol: string, position: 'prefix' | 'suffix' } => {
  const curr = currency?.toUpperCase() || 'USD';
  switch (curr) {
    case 'USD':
      return { symbol: '$', position: 'prefix' };
    case 'EUR':
      return { symbol: '€', position: 'prefix' };
    case 'GBP':
      return { symbol: '£', position: 'prefix' };
    case 'GBp':
      return { symbol: 'p', position: 'suffix' };
    case 'SEK':
    case 'NOK':
    case 'DKK':
      return { symbol: 'kr', position: 'suffix' };
    default:
      return { symbol: curr, position: 'suffix' };
  }
};


export const countActiveFilters = (filters: StockFilters): number => {
  let count = 0;
  if (filters.priceMin) count++;
  if (filters.priceMax) count++;
  if (filters.marketCapMin) count++;
  if (filters.marketCapMax) count++;
  if (filters.sectors && filters.sectors.length > 0) count += filters.sectors.length;
  if (filters.rules && filters.rules.length > 0) count += filters.rules.length;
  if (filters.ownedOnly) count++;
  if (filters.watchlistOnly) count++;
  if (filters.earningsOnly) count++;
  if (filters.perfFilterDirection && filters.perfFilterDirection !== 'none') count++;
  if (filters.fiftyTwoWeekDirection && filters.fiftyTwoWeekDirection !== 'none') count++;
  if (filters.peDirection && filters.peDirection !== 'none') count++;
  if (filters.volumeFilter && filters.volumeFilter !== 'none') count++;
  if (filters.yieldDirection && filters.yieldDirection !== 'none') count++;
  return count;
};

export const tickerMatchesFilters = (ticker: Ticker, filters: StockFilters): boolean => {
  if (filters.ownedOnly && !ticker.isOwned) return false;
  if (filters.earningsOnly) {
    const hasEarningsBadge = ticker.badges?.some(b => b === 'EARNINGS BEAT' || b === 'EARNINGS MISS');
    if (!hasEarningsBadge) return false;
  }

  if (filters.perfFilterDirection && filters.perfFilterDirection !== 'none') {
    const direction = filters.perfFilterDirection;
    const timeframe = filters.perfFilterTimeframe || 'today';
    const targetVal = filters.perfFilterValue ?? 0;
    
    let actualVal: number | undefined;
    if (timeframe === 'today') {
      if (ticker.stats.changePercent) {
        actualVal = parseFloat(ticker.stats.changePercent.replace('%', ''));
      }
    } else if (timeframe === 'yesterday') {
      if (ticker.stats.sparkline && ticker.stats.sparkline.length >= 3) {
        const len = ticker.stats.sparkline.length;
        const yesterdayClose = ticker.stats.sparkline[len - 2];
        const dayBeforeClose = ticker.stats.sparkline[len - 3];
        if (yesterdayClose !== undefined && dayBeforeClose !== undefined && dayBeforeClose !== 0) {
          actualVal = ((yesterdayClose - dayBeforeClose) / dayBeforeClose) * 100;
        }
      }
    } else if (timeframe === '1M') {
      actualVal = ticker.stats.perf1M;
    } else if (timeframe === '3M') {
      actualVal = ticker.stats.perf3M;
    } else if (timeframe === '1Y') {
      actualVal = ticker.stats.perf1Y;
    }
    
    if (actualVal === undefined || isNaN(actualVal)) {
      return false;
    }
    
    if (direction === 'above' && actualVal < targetVal) return false;
    if (direction === 'below' && actualVal > targetVal) return false;
  }

  if (filters.fiftyTwoWeekDirection && filters.fiftyTwoWeekDirection !== 'none') {
    if (ticker.stats.high52 === undefined || ticker.stats.high52 === null || ticker.stats.low52 === undefined || ticker.stats.low52 === null) {
      return false;
    }
    const price = parseFloat(ticker.stats.price);
    const high = ticker.stats.high52;
    const low = ticker.stats.low52;
    const range = high - low;
    if (range <= 0) return false;
    
    const percentInRange = ((price - low) / range) * 100;
    if (filters.fiftyTwoWeekDirection === 'above') {
      if (percentInRange < (filters.fiftyTwoWeekFilter ?? 50)) return false;
    } else {
      if (percentInRange > (filters.fiftyTwoWeekFilter ?? 50)) return false;
    }
  }

  if (filters.peDirection && filters.peDirection !== 'none') {
    if (ticker.stats.pe === undefined || ticker.stats.pe === null) return false;
    const pe = ticker.stats.pe;
    if (filters.peDirection === 'above') {
      if (pe < (filters.peFilter ?? 20)) return false;
    } else {
      if (pe > (filters.peFilter ?? 20)) return false;
    }
  }

  if (filters.yieldDirection && filters.yieldDirection !== 'none') {
    if (ticker.stats.dividendYield === undefined || ticker.stats.dividendYield === null) return false;
    const dy = ticker.stats.dividendYield;
    if (filters.yieldDirection === 'above') {
      if (dy < (filters.yieldFilter ?? 2)) return false;
    } else {
      if (dy > (filters.yieldFilter ?? 2)) return false;
    }
  }

  if (filters.volumeFilter && filters.volumeFilter !== 'none') {
    if (!ticker.stats.volume || !ticker.stats.avgVolume) return false;
    
    const parseVol = (s: string): number => {
      const num = parseFloat(s);
      if (isNaN(num)) return 0;
      const upper = s.toUpperCase();
      if (upper.includes('B')) return num * 1000000000;
      if (upper.includes('M')) return num * 1000000;
      if (upper.includes('K')) return num * 1000;
      return num;
    };

    const currentVol = parseVol(ticker.stats.volume);
    const avgVol = parseVol(ticker.stats.avgVolume);
    if (avgVol === 0) return false;
    
    const ratio = currentVol / avgVol;
    const targetRatio = parseInt(filters.volumeFilter);
    if (ratio < targetRatio) return false;
  }

  const price = parseFloat(ticker.stats.price);
  if (!isNaN(price)) {
    if (filters.priceMin && price < parseFloat(filters.priceMin)) return false;
    if (filters.priceMax && price > parseFloat(filters.priceMax)) return false;
  }

  const cap = parseMarketCap(ticker.stats.marketCap);
  if (filters.marketCapMin || filters.marketCapMax) {
    if (cap === null) return false;
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
