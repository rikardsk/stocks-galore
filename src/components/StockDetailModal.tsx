import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Briefcase, Star, Eye, EyeOff, Bell, Sun, Moon } from 'lucide-react';
import { 
  Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Area, Bar, ComposedChart, ReferenceLine
} from 'recharts';
import type { Ticker, StockAlert, TickerNotification } from '../types';
import { formatPrice, getCurrencySymbol } from '../types';

interface StockDetailModalProps {
  ticker: Ticker | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleOwned: (ticker: Ticker) => void;
  onToggleWatchlist: (ticker: Ticker) => void;
  onUpdateBadges?: (ticker: Ticker, badges: string[]) => void;
  onUpdateNotes?: (ticker: Ticker, notes: string) => void;
  isWatchlisted: boolean;
  alerts: StockAlert[];
  notifications: TickerNotification[];
  onAddAlert: (alert: Omit<StockAlert, 'id' | 'isTriggered'>) => void;
  onDeleteAlert: (id: string) => void;
  onUpdateAlert: (updated: StockAlert) => void;
  theme: 'dark' | 'light';
}

const TIMEFRAMES = [
  { label: '1W', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
];

interface HistoryItem {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  [key: string]: string | number | null | undefined;
}

interface CandlestickProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: HistoryItem;
}

const Candlestick = (props: CandlestickProps) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, close } = payload;
  const isPositive = close >= open;
  const color = isPositive ? '#10b981' : '#ef4444';
  
  return (
    <g>
      <rect x={x} y={y} width={width} height={Math.max(height ?? 0, 1)} fill={color} />
    </g>
  );
};

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ 
  ticker, isOpen, onClose, onToggleOwned, onToggleWatchlist, onUpdateBadges, onUpdateNotes, isWatchlisted, 
  alerts, notifications = [], onAddAlert, onDeleteAlert
}) => {
  const [notifTypeFilter, setNotifTypeFilter] = useState<'All' | 'Price' | '%' | 'Crossover' | 'Earnings'>('All');

  const getNotificationTypeDisplay = (n: TickerNotification): 'Price' | '%' | 'Crossover' | 'Earnings' | 'Other' => {
    const msg = n.message.toLowerCase();
    const isCrossover = n.type === 'crossover' || n.type?.startsWith('sma') || msg.includes('crossed');
    if (isCrossover) return 'Crossover';
    const isPrice = n.type === 'price' || (msg.includes('price') && !isCrossover);
    if (isPrice) return 'Price';
    const isPercent = n.type === 'changePercent' || ((msg.includes('change') || msg.includes('%')) && !isCrossover);
    if (isPercent) return '%';
    const isEarnings = n.type === 'earnings' || msg.includes('earnings');
    if (isEarnings) return 'Earnings';
    return 'Other';
  };

  const tickerNotifications = useMemo(() => {
    if (!ticker) return [];
    return notifications
      .filter(n => n.symbol.toUpperCase() === ticker.symbol.toUpperCase())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, ticker]);

  const filteredTickerNotifications = useMemo(() => {
    if (notifTypeFilter === 'All') return tickerNotifications;
    return tickerNotifications.filter(n => getNotificationTypeDisplay(n) === notifTypeFilter);
  }, [tickerNotifications, notifTypeFilter]);

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    background: 'var(--surface-modal)',
    position: 'sticky',
    top: 0,
    zIndex: 1
  };

  const tdStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderBottom: '1px solid var(--surface-divider)'
  };
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [timeframe, setTimeframe] = useState('1y');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [showVolume, setShowVolume] = useState(false);
  const [showPriceLine, setShowPriceLine] = useState(true);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  const [newBadge, setNewBadge] = useState('');
  
  // Alert input state
  const [newAlertVal, setNewAlertVal] = useState('');
  const [notes, setNotes] = useState('');

  const [prevTickerId, setPrevTickerId] = useState<string | null>(null);
  const [prevBadges, setPrevBadges] = useState<string[]>([]);

  if (ticker && ticker.id !== prevTickerId) {
    setPrevTickerId(ticker.id);
    let initialBadges = ticker.badges || [];
    const isPE_NA = !ticker.stats.pe;
    if (isPE_NA && !initialBadges.includes('NOT PROFITABLE')) {
      initialBadges = [...initialBadges, 'NOT PROFITABLE'];
      if (onUpdateBadges) {
        onUpdateBadges(ticker, initialBadges);
      }
    }
    setBadges(initialBadges);
    setPrevBadges(initialBadges);
    setNotes(ticker.notes || '');
  }

  if (ticker && ticker.id === prevTickerId && ticker.badges) {
    const serializedPropBadges = JSON.stringify(ticker.badges);
    const serializedPrevBadges = JSON.stringify(prevBadges);
    if (serializedPropBadges !== serializedPrevBadges) {
      setBadges(ticker.badges);
      setPrevBadges(ticker.badges);
    }
  }

  const handleAddBadge = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    if (newBadge.trim()) {
      const updated = [...badges, newBadge.trim().toUpperCase()];
      setBadges(updated);
      setNewBadge('');
      if (onUpdateBadges && ticker) onUpdateBadges(ticker, updated);
    }
  };



  const handleRemoveBadge = (badgeToRemove: string) => {
    const updated = badges.filter(b => b !== badgeToRemove);
    setBadges(updated);
    if (onUpdateBadges && ticker) onUpdateBadges(ticker, updated);
  };

  const toggleQuickBadge = (badge: string) => {
    const opposing = badge === 'EARNINGS BEAT' ? 'EARNINGS MISS' : (badge === 'EARNINGS MISS' ? 'EARNINGS BEAT' : null);
    let updated = [...badges];
    
    if (updated.includes(badge)) {
      updated = updated.filter(b => b !== badge);
    } else {
      if (opposing) updated = updated.filter(b => b !== opposing);
      updated.push(badge);
    }
    
    setBadges(updated);
    if (onUpdateBadges && ticker) onUpdateBadges(ticker, updated);
  };

  const historyWithSMAs = useMemo(() => {
    if (history.length === 0) return [];
    
    const calculateSMA = (data: HistoryItem[], period: number) => {
      return data.map((item, i) => {
        if (i < period - 1) {
          return { ...item, [`sma${period}`]: null };
        }
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.price, 0);
        return { ...item, [`sma${period}`]: parseFloat((sum / period).toFixed(2)) };
      });
    };

    const getTradingSessionDate = (): string => {
      try {
        const nyTimeStr = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
        const nyDate = new Date(nyTimeStr);
        
        const day = nyDate.getDay();
        const hour = nyDate.getHours();
        const minute = nyDate.getMinutes();
        const isAfterOpen = hour > 9 || (hour === 9 && minute >= 30);
        
        let sessionDate = new Date(nyDate);
        
        if (day === 6) { // Saturday
          sessionDate.setDate(nyDate.getDate() - 1); // Friday
        } else if (day === 0) { // Sunday
          sessionDate.setDate(nyDate.getDate() - 2); // Friday
        } else if (day === 1 && !isAfterOpen) { // Monday before open
          sessionDate.setDate(nyDate.getDate() - 3); // Friday
        } else if (!isAfterOpen) { // Tuesday-Friday before open
          sessionDate.setDate(nyDate.getDate() - 1); // Yesterday
        }
        
        const yyyy = sessionDate.getFullYear();
        const mm = String(sessionDate.getMonth() + 1).padStart(2, '0');
        const dd = String(sessionDate.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      } catch (e) {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    };

    let enriched = [...history];
    if (ticker) {
      const latestPrice = parseFloat(ticker.stats.price);
      if (!isNaN(latestPrice)) {
        const lastItem = enriched[enriched.length - 1];
        if (lastItem) {
          const targetStr = getTradingSessionDate();
          const targetDateObj = new Date(targetStr);
          const isTargetWeekday = targetDateObj.getDay() !== 0 && targetDateObj.getDay() !== 6;
          
          if (lastItem.date === targetStr) {
            enriched[enriched.length - 1] = {
              ...lastItem,
              price: latestPrice,
              close: latestPrice,
              high: Math.max(lastItem.high, latestPrice),
              low: Math.min(lastItem.low, latestPrice)
            };
          } else {
            // Fill in any missing weekdays (e.g. if the ticker didn't trade or backend is slightly delayed)
            const lastDate = new Date(lastItem.date);
            const todayDate = new Date(targetStr);
            let current = new Date(lastDate);
            current.setDate(current.getDate() + 1);
            
            while (current < todayDate) {
              const yyyy = current.getFullYear();
              const mm = String(current.getMonth() + 1).padStart(2, '0');
              const dd = String(current.getDate()).padStart(2, '0');
              const dateStr = `${yyyy}-${mm}-${dd}`;
              
              const dayOfWeek = current.getDay();
              const isCurrentWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;
              
              if (isCurrentWeekday) {
                enriched.push({
                  date: dateStr,
                  price: lastItem.price,
                  open: lastItem.price,
                  close: lastItem.price,
                  high: lastItem.price,
                  low: lastItem.price,
                  volume: 0
                });
              }
              current.setDate(current.getDate() + 1);
            }

            // Append target date's price
            if (isTargetWeekday || lastItem.price !== latestPrice) {
              const prevPrice = enriched[enriched.length - 1]?.price ?? lastItem.price;
              enriched.push({
                date: targetStr,
                price: latestPrice,
                open: prevPrice,
                close: latestPrice,
                high: Math.max(prevPrice, latestPrice),
                low: Math.min(prevPrice, latestPrice),
                volume: 0
              });
            }
          }
        }
      }
    }

    enriched = calculateSMA(enriched, 10);
    enriched = calculateSMA(enriched, 20);
    enriched = calculateSMA(enriched, 50);
    enriched = calculateSMA(enriched, 100);
    enriched = calculateSMA(enriched, 200);
    return enriched;
  }, [history, ticker]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!ticker) return;
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/stock/${ticker.symbol}/history?period=${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && ticker) {
      fetchHistory();
    }
  }, [isOpen, ticker, timeframe]);

  const chartColor = useMemo(() => {
    if (historyWithSMAs.length < 2) return '#10b981';
    return historyWithSMAs[historyWithSMAs.length - 1].price >= historyWithSMAs[0].price ? '#10b981' : '#ef4444';
  }, [historyWithSMAs]);

  const { minPrice, maxPrice } = useMemo(() => {
    if (historyWithSMAs.length === 0) return { minPrice: 0, maxPrice: 100 };
    const prices = historyWithSMAs.map(h => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.15;
    return { minPrice: Math.max(0, min - padding), maxPrice: max + padding };
  }, [historyWithSMAs]);

  const tickerAlerts = useMemo(() => {
    if (!ticker) return [];
    return alerts.filter(a => a.symbol === ticker.symbol && a.metric === 'price');
  }, [alerts, ticker]);

  if (!isOpen || !ticker) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal stock-detail-modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--surface-modal)' }}>
        {/* Header */}
        <div className="detail-header">
          <div className="header-left">
            <div className="symbol-row">
              <h1 className="detail-symbol" style={{ color: 'var(--text-primary)' }}>{ticker.symbol}</h1>
              <div className="header-actions">
                <button 
                  className={`action-btn ${ticker.isOwned ? 'active' : ''}`}
                  onClick={() => onToggleOwned(ticker)}
                  title="Owned in Portfolio"
                >
                  <Briefcase size={18} fill={ticker.isOwned ? "#f59e0b" : "none"} />
                </button>
                <button 
                  className={`action-btn ${isWatchlisted ? 'active-star' : ''}`}
                  onClick={() => onToggleWatchlist(ticker)}
                  title="Watchlist"
                >
                  <Star size={18} fill={isWatchlisted ? "#6366f1" : "none"} />
                </button>
              </div>
            </div>
            <p className="detail-name">{ticker.name} • {ticker.stats.sector}</p>
          </div>
          <div className="header-right">
            <div className="detail-price" style={{ color: 'var(--text-primary)' }}>{formatPrice(ticker.stats.price, ticker.stats.currency)}</div>
            <div className={`detail-change ${parseFloat(ticker.stats.change) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(ticker.stats.change) >= 0 ? '+' : ''}{ticker.stats.change} ({ticker.stats.changePercent})
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        {/* Chart Controls */}
        <div className="chart-controls">
          <div className="timeframe-selector">
            {TIMEFRAMES.map(tf => (
              <button 
                key={tf.value}
                className={`tf-btn ${timeframe === tf.value ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.value)}
              >
                {tf.label}
              </button>
            ))}
            {isLoading && <div className="loader-mini" />}
          </div>
          
          <div className="type-selector" style={{ background: 'var(--surface-inset)' }}>
            <button 
              className={`type-btn ${chartType === 'line' ? 'active' : ''}`}
              onClick={() => setChartType('line')}
            >
              Line
            </button>
            <button 
              className={`type-btn ${chartType === 'candle' ? 'active' : ''}`}
              onClick={() => setChartType('candle')}
            >
              Candle
            </button>
            <div style={{ width: '1px', background: 'var(--border-color)', margin: '4px 8px' }} />
            <button 
              className={`type-btn ${showVolume ? 'active' : ''}`}
              onClick={() => setShowVolume(!showVolume)}
              title="Toggle Volume"
            >
              {showVolume ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            <div style={{ width: '1px', background: 'var(--border-color)', margin: '4px 8px' }} />
            <button 
              className={`type-btn ${showPriceLine ? 'active' : ''}`}
              onClick={() => setShowPriceLine(!showPriceLine)}
              title="Toggle Price Line"
            >
              Price Line
            </button>
            <div style={{ width: '1px', background: 'var(--border-color)', margin: '4px 8px' }} />
            {(['10', '20', '50', '100', '200'] as const).map(period => {
              const colorMap: Record<string, string> = { '10': '#3b82f6', '20': '#6366f1', '50': '#f59e0b', '100': '#ec4899', '200': '#8b5cf6' };
              return (
                <button 
                  key={period}
                  className={`type-btn ${indicators.includes(period) ? 'active' : ''}`}
                  style={{ color: indicators.includes(period) ? colorMap[period] : 'var(--text-secondary)' }}
                  onClick={() => setIndicators(prev => prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period])}
                >
                  SMA{period}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart Area */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={historyWithSMAs}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--surface-divider)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--text-secondary)', fontSize: 10}}
                minTickGap={30}
              />
              <YAxis 
                yAxisId="price"
                domain={[minPrice, maxPrice]} 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--text-secondary)', fontSize: 10}}
                tickFormatter={(val) => Math.round(val).toString()}
              />
              <YAxis 
                yAxisId="volume"
                hide={true}
              />
              <Tooltip 
                contentStyle={{ background: 'var(--surface-modal)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)', fontSize: '12px' }}
                labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '10px' }}
              />
              {chartType === 'line' ? (
                <Area yAxisId="price" type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
              ) : (
                <Bar 
                  yAxisId="price"
                  dataKey="price" 
                  shape={<Candlestick />}
                />
              )}
              {showVolume && <Bar yAxisId="volume" dataKey="volume" fill="var(--surface-hover)" barSize={4} />}
              
              {indicators.includes('10') && <Line yAxisId="price" type="monotone" dataKey="sma10" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />}
              {indicators.includes('20') && <Line yAxisId="price" type="monotone" dataKey="sma20" stroke="#6366f1" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />}
              {indicators.includes('50') && <Line yAxisId="price" type="monotone" dataKey="sma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} />}
              {indicators.includes('100') && <Line yAxisId="price" type="monotone" dataKey="sma100" stroke="#ec4899" strokeWidth={1.5} dot={false} />}
              {indicators.includes('200') && <Line yAxisId="price" type="monotone" dataKey="sma200" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />}

              {showPriceLine && ticker && !isNaN(parseFloat(ticker.stats.price)) && (
                <ReferenceLine 
                  yAxisId="price"
                  y={parseFloat(ticker.stats.price)} 
                  stroke={chartColor} 
                  strokeDasharray="3 3"
                  label={{ 
                    position: 'insideRight', 
                    value: `Latest: ${formatPrice(ticker.stats.price, ticker.stats.currency)}`, 
                    fill: chartColor,
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
              )}
              {tickerAlerts.map(alert => (
                <ReferenceLine 
                  key={alert.id}
                  yAxisId="price"
                  y={alert.value} 
                  stroke={alert.isTriggered ? 'var(--text-secondary)' : 'var(--accent)'} 
                  strokeDasharray="3 3"
                  label={{ 
                    position: 'insideRight', 
                    value: formatPrice(alert.value, ticker.stats.currency), 
                    fill: alert.isTriggered ? 'var(--text-secondary)' : 'var(--accent)',
                    fontSize: 10,
                    fontWeight: 'bold'
                  }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Grid */}
        <div className="detail-stats-grid">
          <div className="stat-box" style={{ background: 'var(--surface-subtle)' }}>
            <span className="stat-label">Market Cap</span>
            <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{ticker.stats.marketCap}</span>
          </div>
          <div className="stat-box" style={{ background: 'var(--surface-subtle)' }}>
            <span className="stat-label">P/E Ratio</span>
            <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{ticker.stats.pe || 'N/A'}</span>
          </div>
          <div className="stat-box" style={{ background: 'var(--surface-subtle)' }}>
            <span className="stat-label">Avg Volume</span>
            <span className="stat-value" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{ticker.stats.avgVolume} ({ticker.stats.volume})</span>
          </div>
          <div style={{ background: 'var(--surface-subtle)' }} className="stat-box">
            <span className="stat-label">Dividend Yield</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>{ticker.stats.dividendYield ? ticker.stats.dividendYield.toFixed(2) + '%' : '0.00%'}</span>
          </div>
          <div style={{ background: 'var(--surface-subtle)' }} className="stat-box">
            <span className="stat-label">Ex-Dividend Date</span>
            <span className="stat-value" style={{ color: '#3b82f6' }}>{ticker.stats.exDividendDate || 'N/A'}</span>
          </div>
          <div style={{ background: 'var(--surface-subtle)' }} className="stat-box">
            <span className="stat-label">Pay Date</span>
            <span className="stat-value" style={{ color: '#10b981' }}>{ticker.stats.dividendDate || 'N/A'}</span>
          </div>
          <div style={{ background: 'var(--surface-subtle)' }} className="stat-box">
            <span className="stat-label">Earnings Date</span>
            <span className="stat-value" style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {ticker.stats.earningsDate || 'N/A'}
              {ticker.stats.earningsDate && ticker.stats.earningsTime === 'BMO' && (
                <span title="Before Market Open" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Sun size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                </span>
              )}
              {ticker.stats.earningsDate && ticker.stats.earningsTime === 'AMC' && (
                <span title="After Market Close" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <Moon size={14} color="#a5b4fc" style={{ flexShrink: 0 }} />
                </span>
              )}
            </span>
          </div>
          <div style={{ background: 'var(--surface-subtle)' }} className="stat-box">
            <span className="stat-label">IPO Date</span>
            <span className="stat-value" style={{ color: 'var(--text-secondary)' }}>{ticker.stats.ipoDate || 'N/A'}</span>
          </div>
          <div style={{ gridColumn: 'span 4', background: 'var(--surface-subtle)' }} className="stat-box">
            <span className="stat-label">52 Week Range</span>
            <div className="range-bar-container">
              <span className="range-val">{formatPrice(ticker.stats.low52, ticker.stats.currency)}</span>
              <div className="range-track" style={{ background: 'var(--surface-hover)' }}>
                {ticker.stats.low52 && ticker.stats.high52 && (
                  <div 
                    className="range-current" 
                    style={{ 
                      left: `${Math.min(100, Math.max(0, ((parseFloat(ticker.stats.price) - ticker.stats.low52) / (ticker.stats.high52 - ticker.stats.low52)) * 100))}%` 
                    }} 
                  />
                )}
              </div>
              <span className="range-val">{formatPrice(ticker.stats.high52, ticker.stats.currency)}</span>
            </div>
          </div>
        </div>

        {/* Alert Management */}
        <div style={{ padding: '30px', borderTop: '1px solid var(--border-color)', background: 'var(--surface-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '18px' }}>
              <Bell size={20} color="var(--accent)" />
              Price Alerts
            </h3>
            <div style={{ padding: '4px 10px', background: 'var(--surface-hover)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Current: {formatPrice(ticker.stats.price, ticker.stats.currency)}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'stretch' }}>
             <div style={{ position: 'relative', flex: 1, height: '52px' }}>
               <div style={{ 
                 position: 'absolute', 
                 left: getCurrencySymbol(ticker.stats.currency).position === 'prefix' ? '18px' : 'auto', 
                 right: getCurrencySymbol(ticker.stats.currency).position === 'prefix' ? 'auto' : '18px', 
                 top: '50%', transform: 'translateY(-50%)', 
                 color: 'var(--text-secondary)', fontSize: '18px', fontWeight: 600, zIndex: 1,
                 pointerEvents: 'none'
               }}>{getCurrencySymbol(ticker.stats.currency).symbol}</div>
               <input 
                 type="number"
                 step="any"
                 value={newAlertVal}
                 onChange={e => setNewAlertVal(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Enter' && newAlertVal) {
                     const currentPrice = parseFloat(ticker.stats.price);
                     const targetPrice = parseFloat(newAlertVal);
                     onAddAlert({
                       symbol: ticker.symbol,
                       metric: 'price',
                       operator: targetPrice > currentPrice ? 'above' : 'below',
                       value: targetPrice
                     });
                     setNewAlertVal('');
                   }
                 }}
                 placeholder="Enter target price..."
                 style={{ 
                   width: '100%', height: '100%', background: 'var(--surface-modal)', 
                   border: '1px solid var(--border-color)', color: 'var(--text-primary)', 
                   padding: getCurrencySymbol(ticker.stats.currency).position === 'prefix' ? '0 20px 0 40px' : '0 50px 0 20px', 
                   borderRadius: '14px', outline: 'none', 
                   fontSize: '18px', fontWeight: 700, display: 'block'
                 }}
               />
             </div>
             <button 
               className="btn btn-primary"
               onClick={() => {
                 if (newAlertVal) {
                   const currentPrice = parseFloat(ticker.stats.price);
                   const targetPrice = parseFloat(newAlertVal);
                   onAddAlert({
                     symbol: ticker.symbol,
                     metric: 'price',
                     operator: targetPrice > currentPrice ? 'above' : 'below',
                       value: targetPrice
                   });
                   setNewAlertVal('');
                 }
               }}
               style={{ flex: '0 0 auto', padding: '0 32px', borderRadius: '14px', fontWeight: 700, fontSize: '15px', height: '52px' }}
             >
               Set Alert
             </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[5, 10, 15].map(pct => (
              <button 
                key={`up-${pct}`}
                onClick={() => {
                  const currentPrice = parseFloat(ticker.stats.price);
                  const targetPrice = currentPrice * (1 + pct / 100);
                  onAddAlert({
                    symbol: ticker.symbol,
                    metric: 'price',
                    operator: 'above',
                    value: parseFloat(targetPrice.toFixed(2))
                  });
                }}
                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                +{pct}%
              </button>
            ))}
            {[-5, -10, -15].map(pct => (
              <button 
                key={`down-${pct}`}
                onClick={() => {
                  const currentPrice = parseFloat(ticker.stats.price);
                  const targetPrice = currentPrice * (1 + pct / 100);
                  onAddAlert({
                    symbol: ticker.symbol,
                    metric: 'price',
                    operator: 'below',
                    value: parseFloat(targetPrice.toFixed(2))
                  });
                }}
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {pct}%
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {tickerAlerts.map(alert => (
              <div key={alert.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '14px 18px', background: 'var(--surface-modal)', 
                borderRadius: '12px', border: `1px solid ${alert.isTriggered ? 'var(--border-color)' : 'rgba(99, 102, 241, 0.3)'}`,
                boxShadow: alert.isTriggered ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.1)',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <div style={{ 
                     width: '28px', height: '28px', borderRadius: '8px', 
                     background: alert.operator === 'above' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                   }}>
                     {alert.operator === 'above' ? <TrendingUp size={16} color="#10b981" /> : <TrendingDown size={16} color="#ef4444" />}
                   </div>
                   <div>
                     <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{formatPrice(alert.value, ticker.stats.currency)}</div>
                     <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>{alert.operator}</div>
                   </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {alert.isTriggered && <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-secondary)', background: 'var(--surface-divider)', padding: '3px 8px', borderRadius: '6px' }}>FIRED</span>}
                  <button 
                    onClick={() => onDeleteAlert(alert.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5, padding: '6px' }}
                    className="alert-delete-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            {tickerAlerts.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '14px', border: '2px dashed var(--border-color)', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <Bell size={28} style={{ opacity: 0.15, marginBottom: '12px' }} />
                <div style={{ fontWeight: 500 }}>No active alerts. Use the form above to track price targets.</div>
              </div>
            )}
          </div>
        </div>

        {/* Notes & Badges & Description */}
        <div className="detail-description" style={{ background: 'var(--surface-inset)' }}>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '12px' }}>Custom Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => {
                if (ticker) {
                  if (onUpdateNotes) onUpdateNotes(ticker, notes);
                  
                  const hasNotes = notes.trim().length > 0;
                  const hasNoteBadge = badges.includes('NOTE');
                  
                  if (hasNotes && !hasNoteBadge) {
                    const updated = [...badges, 'NOTE'];
                    setBadges(updated);
                    if (onUpdateBadges) onUpdateBadges(ticker, updated);
                  } else if (!hasNotes && hasNoteBadge) {
                    const updated = badges.filter(b => b !== 'NOTE');
                    setBadges(updated);
                    if (onUpdateBadges) onUpdateBadges(ticker, updated);
                  }
                }
              }}
              placeholder="Add your personal notes for this stock here..."
              style={{
                width: '100%',
                minHeight: '80px',
                background: 'var(--surface-subtle)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom: '12px' }}>Custom Badges</h3>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button 
                onClick={() => toggleQuickBadge('EARNINGS BEAT')}
                style={{ 
                  background: badges.includes('EARNINGS BEAT') ? '#10b981' : 'var(--surface-subtle)', 
                  color: badges.includes('EARNINGS BEAT') ? 'white' : 'var(--text-secondary)',
                  border: '1px solid ' + (badges.includes('EARNINGS BEAT') ? '#10b981' : 'var(--border-color)'),
                  padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Earnings Beat
              </button>
              <button 
                onClick={() => toggleQuickBadge('EARNINGS MISS')}
                style={{ 
                  background: badges.includes('EARNINGS MISS') ? '#ef4444' : 'var(--surface-subtle)', 
                  color: badges.includes('EARNINGS MISS') ? 'white' : 'var(--text-secondary)',
                  border: '1px solid ' + (badges.includes('EARNINGS MISS') ? '#ef4444' : 'var(--border-color)'),
                  padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Earnings Miss
              </button>
              <button 
                onClick={() => toggleQuickBadge('ALERT')}
                style={{ 
                  background: badges.includes('ALERT') ? 'var(--accent)' : 'var(--surface-subtle)', 
                  color: badges.includes('ALERT') ? 'white' : 'var(--text-secondary)',
                  border: '1px solid ' + (badges.includes('ALERT') ? 'var(--accent)' : 'var(--border-color)'),
                  padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Alert
              </button>
              <button 
                onClick={() => toggleQuickBadge('NOTE')}
                style={{ 
                  background: badges.includes('NOTE') ? '#8b5cf6' : 'var(--surface-subtle)', 
                  color: badges.includes('NOTE') ? 'white' : 'var(--text-secondary)',
                  border: '1px solid ' + (badges.includes('NOTE') ? '#8b5cf6' : 'var(--border-color)'),
                  padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Note
              </button>
              <button 
                onClick={() => toggleQuickBadge('NOT PROFITABLE')}
                style={{ 
                  background: badges.includes('NOT PROFITABLE') ? '#ef4444' : 'var(--surface-subtle)', 
                  color: badges.includes('NOT PROFITABLE') ? 'white' : 'var(--text-secondary)',
                  border: '1px solid ' + (badges.includes('NOT PROFITABLE') ? '#ef4444' : 'var(--border-color)'),
                  padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Not profitable
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {badges.map((badge, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  background: badge === 'EARNINGS BEAT' ? '#10b981' : (badge === 'EARNINGS MISS' || badge === 'NOT PROFITABLE' ? '#ef4444' : 'var(--accent)'), color: 'white', 
                  padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 600 
                }}>
                  {badge}
                  <button 
                    onClick={() => handleRemoveBadge(badge)}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', opacity: 0.8, padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '4px' }}>
                <input 
                  type="text" 
                  value={newBadge}
                  onChange={e => setNewBadge(e.target.value)}
                  onKeyDown={handleAddBadge}
                  placeholder="Add tag... (e.g. EB, EM)"
                  style={{ 
                    background: 'var(--surface-subtle)', border: '1px solid var(--border-color)', 
                    color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '100px', 
                    fontSize: '12px', outline: 'none', width: '150px' 
                  }}
                />
                <button 
                  onClick={() => handleAddBadge()}
                  style={{ 
                    background: 'var(--surface-hover)', border: '1px solid var(--border-color)', 
                    color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '100px', 
                    fontSize: '12px', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>About Company</h3>
            <p>{ticker.stats.description}</p>
          </div>
        </div>

        {/* Notifications Section */}
        <div style={{ padding: '30px', borderTop: '1px solid var(--border-color)', background: 'var(--surface-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '16px', fontWeight: 600 }}>
              <Bell size={18} color="var(--accent)" />
              Notifications
            </h3>
            
            {/* Filter Pills */}
            <div style={{ display: 'flex', background: 'var(--surface-inset)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)' }}>
              {(['All', 'Price', '%', 'Crossover', 'Earnings'] as const).map(type => (
                <button 
                  key={type}
                  onClick={() => setNotifTypeFilter(type)}
                  style={{
                    background: notifTypeFilter === type ? 'var(--surface-hover)' : 'transparent',
                    border: 'none',
                    color: notifTypeFilter === type ? 'var(--text-primary)' : 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', overflowX: 'auto', background: 'var(--surface-inset)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {filteredTickerNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                No notifications found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Ticker</th>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickerNotifications.map(n => {
                    const displayType = getNotificationTypeDisplay(n);
                    let badgeBg = 'var(--accent)';
                    if (displayType === 'Price') badgeBg = '#3b82f6';
                    else if (displayType === '%') badgeBg = '#6366f1';
                    else if (displayType === 'Crossover') badgeBg = '#f59e0b';
                    else if (displayType === 'Earnings') {
                      const msgLower = n.message.toLowerCase();
                      if (msgLower.includes('beat')) badgeBg = '#10b981';
                      else if (msgLower.includes('miss')) badgeBg = '#ef4444';
                      else badgeBg = '#ec4899';
                    }

                    return (
                      <tr key={n.id} className="table-row">
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(n.timestamp).toLocaleString()}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: 'var(--text-primary)' }}>
                          {n.symbol}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                          {n.message}
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: badgeBg,
                            color: 'white',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                          }}>
                            {displayType}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>


        <style>{`
          .alert-delete-btn:hover { opacity: 1 !important; color: #ef4444 !important; }
          .stock-detail-modal {
            max-width: 1200px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          .detail-header {
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid var(--border-color);
            position: relative;
          }
          .symbol-row { display: flex; align-items: center; gap: 15px; margin-bottom: 8px; }
          .detail-symbol { font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -1px; }
          .detail-name { color: var(--text-secondary); margin: 0; font-size: 14px; }
          .header-right { text-align: right; }
          .detail-price { font-size: 32px; font-weight: 700; margin-bottom: 4px; }
          .detail-change { font-size: 16px; font-weight: 600; }
          .close-btn { position: absolute; top: 20px; right: 20px; background: none; border: none; color: var(--text-secondary); cursor: pointer; padding: 8px; border-radius: 50%; transition: all 0.2s; }
          .close-btn:hover { background: var(--surface-hover); color: var(--text-primary); }
          
          .header-actions { display: flex; gap: 8px; }
          .action-btn { background: var(--surface-subtle); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 8px; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
          .action-btn:hover { background: var(--surface-hover); border-color: var(--border-color); }
          .action-btn.active { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05); }
          .action-btn.active-star { color: #6366f1; border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.05); }
          .type-btn.active { color: var(--text-primary) !important; background: var(--surface-hover) !important; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }

          .timeframe-selector { padding: 15px 30px; display: flex; gap: 10px; align-items: center; border-bottom: 1px solid var(--border-color); background: var(--surface-subtle); }
          .tf-btn { background: none; border: 1px solid transparent; color: var(--text-secondary); padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.2s; }
          .tf-btn:hover { color: var(--text-primary); background: var(--surface-hover); }
          .tf-btn.active { color: var(--accent); background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.2); }

          .chart-controls { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); background: var(--surface-subtle); }
          .type-selector { display: flex; padding: 4px; border-radius: 8px; border: 1px solid var(--border-color); }
          .type-btn { background: none; border: none; color: var(--text-secondary); padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s; }

          .chart-container { padding: 30px; }
          
          .detail-stats-grid { padding: 0 30px 30px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .stat-box { padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px; }
          .stat-label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-value { font-size: 18px; font-weight: 600; }

          .range-bar-container { display: flex; align-items: center; gap: 10px; margin-top: 5px; }
          .range-val { font-size: 12px; color: var(--text-secondary); min-width: 50px; }
          .range-track { flex: 1; height: 4px; border-radius: 2px; position: relative; }
          .range-current { position: absolute; width: 8px; height: 8px; background: var(--accent); border-radius: 50%; top: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 8px var(--accent); }

          .detail-description { padding: 30px; border-top: 1px solid var(--border-color); }
          .detail-description h3 { margin: 0 0 15px; font-size: 16px; font-weight: 600; }
          .detail-description p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--text-secondary); }

          .loader-mini { width: 12px; height: 12px; border: 2px solid var(--surface-hover); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};
