import React, { useState, useMemo } from 'react';
import { X, BarChart2, PieChart, Info } from 'lucide-react';
import { ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend, Cell, LabelList } from 'recharts';
import type { Ticker, StockList, ListGroup } from '../types';
import { parseMarketCap, formatMarketCap } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker[];
  lists: StockList[];
  groups: ListGroup[];
  theme?: 'dark' | 'light';
  onSelectTicker?: (ticker: Ticker) => void;
  notifications?: any[];
}

const BUCKETS = [
  { label: '0-2B', min: 0, max: 2 },
  { label: '2B-10B', min: 2, max: 10 },
  { label: '10B-20B', min: 10, max: 20 },
  { label: '20B-50B', min: 20, max: 50 },
  { label: '50B-100B', min: 50, max: 100 },
  { label: '100B-200B', min: 100, max: 200 },
  { label: '200B-500B', min: 200, max: 500 },
  { label: '500B-1T', min: 500, max: 1000 },
  { label: '1T+', min: 1000, max: Infinity },
];

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  tickers,
  lists,
  groups,
  theme = 'dark',
  onSelectTicker,
  notifications = []
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedListId, setSelectedListId] = useState<string>('all');

  const filteredTickers = useMemo(() => {
    let result = tickers;

    if (selectedGroupId !== 'all') {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group) {
        const listIds = group.listIds;
        const groupTickers = lists
          .filter(l => listIds.includes(l.id))
          .flatMap(l => l.tickers.map(t => t.symbol));
        const uniqueGroupSymbols = new Set(groupTickers);
        result = result.filter(t => uniqueGroupSymbols.has(t.symbol));
      }
    } else if (selectedListId !== 'all') {
      const list = lists.find(l => l.id === selectedListId);
      if (list) {
        const listSymbols = new Set(list.tickers.map(t => t.symbol));
        result = result.filter(t => listSymbols.has(t.symbol));
      }
    }

    return result;
  }, [tickers, selectedGroupId, selectedListId, lists, groups]);

  const marketCapData = useMemo(() => {
    const counts = BUCKETS.map(b => ({ ...b, count: 0, symbols: [] as string[] }));
    let totalCap = 0;
    const validCaps: number[] = [];

    filteredTickers.forEach(t => {
      const cap = parseMarketCap(t.stats.marketCap);
      if (cap !== null) {
        totalCap += cap;
        validCaps.push(cap);
        const bucket = counts.find(b => cap >= b.min && cap < b.max);
        if (bucket) {
          bucket.count++;
          bucket.symbols.push(t.symbol);
        }
      }
    });

    const medianCap = validCaps.length > 0 
      ? [...validCaps].sort((a, b) => a - b)[Math.floor(validCaps.length / 2)]
      : 0;

    return {
      buckets: counts,
      totalCap,
      avgCap: validCaps.length > 0 ? totalCap / validCaps.length : 0,
      medianCap,
      count: validCaps.length
    };
  }, [filteredTickers]);

  const sectorData = useMemo(() => {
    const sectors: Record<string, { count: number; symbols: string[] }> = {};
    let total = 0;

    filteredTickers.forEach(t => {
      const sector = t.stats.sector || 'Unknown';
      if (sector !== 'N/A') {
        if (!sectors[sector]) {
          sectors[sector] = { count: 0, symbols: [] };
        }
        sectors[sector].count++;
        sectors[sector].symbols.push(t.symbol);
        total++;
      }
    });

    const colors = [
      '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6'
    ];

    return Object.entries(sectors)
      .map(([name, data], i) => ({
        name,
        count: data.count,
        symbols: data.symbols,
        percent: (data.count / total) * 100,
        color: colors[i % colors.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTickers]);

  const notificationData = useMemo(() => {
    const smaPeriods = [10, 20, 50, 100, 200];
    const data = smaPeriods.map(period => ({
      name: `SMA${period}`,
      Above: 0,
      Below: 0,
      AboveSymbols: [] as string[],
      BelowSymbols: [] as string[],
      total: 0
    }));

    const filteredSymbols = new Set(filteredTickers.map(t => t.symbol));
    const relevantNotifications = notifications.filter(n => filteredSymbols.has(n.symbol));

    relevantNotifications.forEach(n => {
      const smaMatch = n.type?.match(/sma(\d+)/);
      const period = smaMatch ? parseInt(smaMatch[1]) : null;
      const msg = n.message.toLowerCase();
      
      let targetPeriod = period;
      if (!targetPeriod) {
        if (msg.includes('sma200')) targetPeriod = 200;
        else if (msg.includes('sma100')) targetPeriod = 100;
        else if (msg.includes('sma50')) targetPeriod = 50;
        else if (msg.includes('sma20')) targetPeriod = 20;
        else if (msg.includes('sma10')) targetPeriod = 10;
      }

      if (targetPeriod && smaPeriods.includes(targetPeriod)) {
        const index = smaPeriods.indexOf(targetPeriod);
        if (n.message.includes('ABOVE')) {
          data[index].Above++;
          if (!data[index].AboveSymbols.includes(n.symbol)) {
            data[index].AboveSymbols.push(n.symbol);
          }
        } else if (n.message.includes('BELOW')) {
          data[index].Below++;
          if (!data[index].BelowSymbols.includes(n.symbol)) {
            data[index].BelowSymbols.push(n.symbol);
          }
        }
        data[index].total++;
      }
    });

    return data;
  }, [notifications, filteredTickers]);

  const scatterData = useMemo(() => {
    const dataBySector: Record<string, any[]> = {};
    filteredTickers.forEach(t => {
      const cap = parseMarketCap(t.stats.marketCap);
      const gain = t.stats.perf1Y;
      const sector = t.stats.sector && t.stats.sector !== 'N/A' ? t.stats.sector : 'Unknown';
      if (cap !== null && gain !== undefined) {
        if (!dataBySector[sector]) dataBySector[sector] = [];
        dataBySector[sector].push({
          ticker: t,
          symbol: t.symbol,
          name: t.name,
          x: cap,
          y: gain
        });
      }
    });
    
    const colors = [
      '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6'
    ];
    
    return Object.entries(dataBySector).map(([sector, points], i) => {
      let trendline = null;
      if (points.length > 1) {
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        points.forEach(p => {
          sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumX2 += p.x * p.x;
        });
        const n = points.length;
        const denominator = n * sumX2 - sumX * sumX;
        if (denominator !== 0) {
          const m = (n * sumXY - sumX * sumY) / denominator;
          const b = (sumY - m * sumX) / n;
          const minX = Math.min(...points.map(p => p.x));
          const maxX = Math.max(...points.map(p => p.x));
          trendline = [{ x: minX, y: m * minX + b }, { x: maxX, y: m * maxX + b }];
        }
      }
      return {
        sector,
        points,
        color: colors[i % colors.length],
        trendline
      };
    });
  }, [filteredTickers]);
  
  const badgeData = useMemo(() => {
    const counts: Record<string, { count: number; symbols: string[] }> = {};
    filteredTickers.forEach(t => {
      if (t.badges && t.badges.length > 0) {
        t.badges.forEach(badge => {
          if (!counts[badge]) counts[badge] = { count: 0, symbols: [] };
          counts[badge].count++;
          counts[badge].symbols.push(t.symbol);
        });
      }
    });
    
    return Object.entries(counts)
      .map(([name, data]) => ({ name, count: data.count, symbols: data.symbols }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTickers]);

  const maxCount = Math.max(...marketCapData.buckets.map(b => b.count), 1);
  const chartMax = Math.ceil(maxCount * 1.25);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const symbols = payload[0].dataKey === 'Above' 
        ? data.AboveSymbols 
        : (payload[0].dataKey === 'Below' ? data.BelowSymbols : data.symbols);
        
      if (!symbols || symbols.length === 0) return null;
      
      const displaySymbols = symbols.slice(0, 30);
      const hasMore = symbols.length > 30;

      return (
        <div style={{ 
          background: 'rgba(30, 41, 59, 0.9)', // Semi-transparent slate
          backdropFilter: 'blur(8px)',
          padding: '12px', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '300px'
        }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', fontSize: '13px' }}>
            {label} - {payload[0].name} ({symbols.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {displaySymbols.map((s: string) => (
              <span key={s} style={{ 
                fontSize: '10px', 
                background: 'var(--surface-subtle)', 
                padding: '2px 6px', 
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                fontWeight: 600
              }}>
                {s}
              </span>
            ))}
            {hasMore && <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>...and {symbols.length - 30} more</span>}
          </div>
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, background: 'var(--surface-modal)', zIndex: 10, paddingBottom: '20px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingTop: '20px', marginTop: '-20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BarChart2 size={24} color="var(--accent)" />
              <h2 style={{ margin: 0 }}>Portfolio Analytics</h2>
            </div>
            <button className="btn" onClick={onClose}><X /></button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Group:</span>
              <select 
                value={selectedGroupId} 
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setSelectedListId('all');
                }}
                className="btn"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-color)', padding: '6px 12px' }}
              >
                <option value="all">All Groups</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>List:</span>
              <select 
                value={selectedListId} 
                onChange={(e) => {
                  setSelectedListId(e.target.value);
                  setSelectedGroupId('all');
                }}
                className="btn"
                style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-color)', padding: '6px 12px' }}
              >
                <option value="all">All Lists</option>
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div className="stat-card">
            <span className="stat-label">Total Companies</span>
            <span className="stat-value">{marketCapData.count}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Market Cap</span>
            <span className="stat-value">
              {formatMarketCap(marketCapData.totalCap)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Average Cap</span>
            <span className="stat-value">
              {formatMarketCap(marketCapData.avgCap)}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Median Cap</span>
            <span className="stat-value">
              {formatMarketCap(marketCapData.medianCap)}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
          {/* Histogram Section */}
          <div>
            <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Market Cap Distribution
              <div title="Number of companies per market cap range" style={{ cursor: 'help', opacity: 0.5 }}>
                <Info size={14} />
              </div>
            </h3>
            <div style={{ background: 'var(--surface-inset)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', marginBottom: '40px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {[0, 0.2, 0.4, 0.6, 0.8, 1].map(p => (
                    <div key={p} style={{ borderTop: '1px solid var(--surface-divider)', width: '100%', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '-30px', top: '-7px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {Math.round(chartMax * (1 - p))}
                      </span>
                    </div>
                  ))}
                </div>
                {marketCapData.buckets.map((bucket, i) => {
                  const height = (bucket.count / chartMax) * 200;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%', zIndex: 1, position: 'relative' }}>
                      <div className="histogram-bar" style={{ 
                        width: '100%', height: `${height}px`, background: 'var(--accent)', borderRadius: '4px 4px 0 0', transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative', opacity: bucket.count > 0 ? 0.8 : 0.1
                      }} title={`${bucket.label}: ${bucket.count} companies\n${bucket.symbols.join(', ')}`}>
                        {bucket.count > 0 && <div className="bar-value">{bucket.count}</div>}
                      </div>
                      <div style={{ position: 'absolute', bottom: '-32px', fontSize: '10px', color: 'var(--text-secondary)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>{bucket.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sector Donut Section */}
          <div>
            <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Sector Allocation
              <div title="Portfolio distribution by market sector" style={{ cursor: 'help', opacity: 0.5 }}>
                <PieChart size={16} />
              </div>
            </h3>
            <div style={{ background: 'var(--surface-inset)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '30px', minHeight: '312px' }}>
              <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  {sectorData.length === 0 ? (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-divider)" strokeWidth="12" />
                  ) : (
                    sectorData.map((s, i) => {
                      const totalPercentBefore = sectorData.slice(0, i).reduce((sum, item) => sum + item.percent, 0);
                      return (
                        <circle
                          key={s.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={s.color}
                          strokeWidth="12"
                          strokeDasharray={`${s.percent * 2.513} 251.3`}
                          strokeDashoffset={-totalPercentBefore * 2.513}
                          style={{ transition: 'stroke-dashoffset 1s ease-in-out', cursor: 'pointer' }}
                        >
                          <title>{`${s.name}: ${s.count} companies (${s.percent.toFixed(1)}%)\n${s.symbols.join(', ')}`}</title>
                        </circle>
                      );
                    })
                  )}
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: 700 }}>{marketCapData.count}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tickers</div>
                </div>
              </div>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }}>
                {sectorData.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                    <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontWeight: 600, minWidth: '40px', textAlign: 'right' }}>{s.percent.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scatter Plot Section */}
          <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Market Cap vs 1-Year Performance
              <div title="Scatter plot showing the relationship between company size and 1-year returns." style={{ cursor: 'help', opacity: 0.5 }}>
                <Info size={14} />
              </div>
            </h3>
            <div style={{ background: 'var(--surface-inset)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '500px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-divider)" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Market Cap" 
                    tickFormatter={(val) => formatMarketCap(val)} 
                    stroke="var(--text-secondary)"
                    tick={{ fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="1Y Gain" 
                    tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
                    stroke="var(--text-secondary)"
                    tick={{ fontSize: 11 }}
                    domain={['auto', 'auto']}
                  />
                  <RechartsTooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ background: 'var(--surface-modal)', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{data.symbol} - {data.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Sector: {data.ticker.stats.sector || 'Unknown'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>Market Cap: {formatMarketCap(data.x)}</div>
                            <div style={{ fontSize: '12px', color: data.y >= 0 ? '#10b981' : '#ef4444' }}>1Y Perf: {data.y > 0 ? '+' : ''}{data.y.toFixed(2)}%</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>Click to view details</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  {scatterData.map(s => (
                    <React.Fragment key={s.sector}>
                      <Scatter 
                        name={s.sector} 
                        data={s.points} 
                        fill={s.color} 
                        onClick={(data: any) => {
                          const ticker = data?.ticker || data?.payload?.ticker;
                          if (onSelectTicker && ticker) onSelectTicker(ticker);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      {s.trendline && (
                        <ReferenceLine 
                          segment={s.trendline} 
                          stroke={s.color} 
                          strokeOpacity={0.5} 
                          strokeDasharray="3 3"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SMA Notifications Chart */}
          <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
            <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              SMA Crossover Notifications
              <div title="Distribution of SMA crossover alerts for the current selection, stacked by direction." style={{ cursor: 'help', opacity: 0.5 }}>
                <Info size={14} />
              </div>
            </h3>
            <div style={{ background: 'var(--surface-inset)', padding: '30px 20px 20px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={notificationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-divider)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-secondary)"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="var(--text-secondary)"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar dataKey="Above" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40}>
                    <LabelList dataKey="Above" position="center" fill="white" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
                  </Bar>
                  <Bar dataKey="Below" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList dataKey="Below" position="center" fill="white" fontSize={10} formatter={(v: number) => v > 0 ? v : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Badge Distribution Chart */}
          {badgeData.length > 0 && (
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3 style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Badge Distribution
                <div title="Count of custom badges across all selected tickers." style={{ cursor: 'help', opacity: 0.5 }}>
                  <Info size={14} />
                </div>
              </h3>
              <div style={{ background: 'var(--surface-inset)', padding: '30px 20px 20px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={badgeData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-divider)" horizontal={false} />
                    <XAxis 
                      type="number"
                      stroke="var(--text-secondary)"
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name" 
                      stroke="var(--text-secondary)"
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={false} />
                    <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={30}>
                      <LabelList dataKey="count" position="right" fill="var(--text-secondary)" fontSize={11} offset={8} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <style>{`
          .stat-card {
            background: var(--surface-subtle);
            padding: 16px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-value { font-size: 20px; font-weight: 600; color: var(--text-primary); }
          .histogram-bar:hover { opacity: 1 !important; filter: brightness(1.2); cursor: pointer; }
          .bar-value { position: absolute; top: -24px; left: 50%; transform: translateX(-50%); font-size: 11px; font-weight: 600; color: var(--accent); }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 10px; }
        `}</style>
      </div>
    </div>
  );
};
