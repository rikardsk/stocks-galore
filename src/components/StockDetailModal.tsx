import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Clock, Calendar, BarChart3, Info, Briefcase, Star, Eye, EyeOff } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart
} from 'recharts';
import type { Ticker } from '../types';

interface StockDetailModalProps {
  ticker: Ticker | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleOwned: (ticker: Ticker) => void;
  onToggleWatchlist: (ticker: Ticker) => void;
  onUpdateBadges?: (ticker: Ticker, badges: string[]) => void;
  isWatchlisted: boolean;
  theme: 'dark' | 'light';
}

const TIMEFRAMES = [
  { label: '1W', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
];

const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  const isPositive = close >= open;
  const color = isPositive ? '#10b981' : '#ef4444';
  
  return (
    <g>
      <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={color} />
    </g>
  );
};

export const StockDetailModal: React.FC<StockDetailModalProps> = ({ 
  ticker, isOpen, onClose, onToggleOwned, onToggleWatchlist, onUpdateBadges, isWatchlisted, theme 
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('1y');
  const [chartType, setChartType] = useState<'line' | 'candle'>('line');
  const [showVolume, setShowVolume] = useState(false);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [badges, setBadges] = useState<string[]>([]);
  const [newBadge, setNewBadge] = useState('');

  useEffect(() => {
    if (ticker) {
      setBadges(ticker.badges || []);
    }
  }, [ticker]);

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
    
    const calculateSMA = (data: any[], period: number) => {
      const result = [...data];
      for (let i = 0; i < result.length; i++) {
        if (i < period - 1) {
          result[i][`sma${period}`] = null;
          continue;
        }
        const sum = result.slice(i - period + 1, i + 1).reduce((acc, curr) => acc + curr.price, 0);
        result[i][`sma${period}`] = parseFloat((sum / period).toFixed(2));
      }
      return result;
    };

    let enriched = [...history];
    enriched = calculateSMA(enriched, 10);
    enriched = calculateSMA(enriched, 20);
    enriched = calculateSMA(enriched, 50);
    enriched = calculateSMA(enriched, 100);
    enriched = calculateSMA(enriched, 200);
    return enriched;
  }, [history]);

  useEffect(() => {
    if (isOpen && ticker) {
      fetchHistory();
    }
  }, [isOpen, ticker, timeframe]);

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

  const chartColor = useMemo(() => {
    if (history.length < 2) return '#10b981';
    return history[history.length - 1].price >= history[0].price ? '#10b981' : '#ef4444';
  }, [history]);

  if (!isOpen || !ticker) return null;

  const isDark = theme === 'dark';

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
            <div className="detail-price" style={{ color: 'var(--text-primary)' }}>${ticker.stats.price}</div>
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
                domain={['auto', 'auto']} 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'var(--text-secondary)', fontSize: 10}}
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
            <span className="stat-value" style={{ color: 'var(--text-primary)' }}>{ticker.stats.avgVolume}</span>
          </div>
          <div className="stat-box" style={{ background: 'var(--surface-subtle)' }}>
            <span className="stat-label">Dividend Yield</span>
            <span className="stat-value" style={{ color: '#f59e0b' }}>{ticker.stats.dividendYield ? ticker.stats.dividendYield.toFixed(2) + '%' : '0.00%'}</span>
          </div>
          <div className="stat-box" style={{ gridColumn: 'span 2', background: 'var(--surface-subtle)' }}>
            <span className="stat-label">52 Week Range</span>
            <div className="range-bar-container">
              <span className="range-val">${ticker.stats.low52 || '0.00'}</span>
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
              <span className="range-val">${ticker.stats.high52 || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Description & Badges */}
        <div className="detail-description" style={{ background: 'var(--surface-inset)' }}>
          <h3 style={{ color: 'var(--text-primary)' }}>About Company</h3>
          <p>{ticker.stats.description}</p>
          
          <div style={{ marginTop: '24px' }}>
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
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {badges.map((badge, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', gap: '6px', 
                  background: 'var(--accent)', color: 'white', 
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
        </div>

        <style>{`
          .stock-detail-modal {
            max-width: 900px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
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
