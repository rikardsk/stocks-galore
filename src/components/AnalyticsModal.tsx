import React, { useState, useMemo } from 'react';
import { X, BarChart2, PieChart, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Legend, Cell, LabelList } from 'recharts';
import type { Ticker, StockList, ListGroup } from '../types';
import { parseMarketCap, formatMarketCap } from '../types';
import { storage } from '../storage';

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

const DIAGRAM_ITEMS = [
  { key: 'marketCap', label: 'Market Cap' },
  { key: 'sector', label: 'Sector' },
  { key: 'scatter', label: 'Scatter' },
  { key: 'sma', label: 'SMA Crossovers' },
  { key: 'badges', label: 'Badges' },
  { key: 'earnings', label: 'Earnings' },
  { key: 'ipo', label: 'IPO Age' },
  { key: 'dividend', label: 'Dividend' },
  { key: 'storage', label: 'Storage' },
];

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  tickers,
  lists,
  groups,
  theme: _theme = 'dark',
  onSelectTicker,
  notifications = []
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [isScatterExpanded, setIsScatterExpanded] = useState(true);
  const [isSmaExpanded, setIsSmaExpanded] = useState(true);
  const [isBadgeExpanded, setIsBadgeExpanded] = useState(true);
  const [isEarningsExpanded, setIsEarningsExpanded] = useState(true);
  const [isIpoExpanded, setIsIpoExpanded] = useState(true);
  const [isDividendExpanded, setIsDividendExpanded] = useState(true);
  const [isStorageExpanded, setIsStorageExpanded] = useState(true);
  const [visibleDiagrams, setVisibleDiagrams] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('stocks_galore_visible_diagrams');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure any new diagrams are always present
        return {
          marketCap: true,
          sector: true,
          scatter: true,
          sma: true,
          badges: true,
          earnings: true,
          ipo: true,
          dividend: true,
          storage: true,
          ...parsed
        };
      }
    } catch (_) {}
    return {
      marketCap: true,
      sector: true,
      scatter: true,
      sma: true,
      badges: true,
      earnings: true,
      ipo: true,
      dividend: true,
      storage: true,
    };
  });
  const [apiQuota, setApiQuota] = useState<number | null>(null);
  const [apiUsage, setApiUsage] = useState<number | null>(null);

  const toggleDiagram = (key: string) => {
    setVisibleDiagrams(prev => {
      const next = {
        ...prev,
        [key]: !prev[key]
      };
      try {
        localStorage.setItem('stocks_galore_visible_diagrams', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  React.useEffect(() => {
    if (isOpen && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then(estimate => {
        setApiQuota(estimate.quota ?? null);
        setApiUsage(estimate.usage ?? null);
      }).catch(err => {
        console.error('Failed to get storage estimate:', err);
      });
    }
  }, [isOpen]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const storageData = useMemo(() => {
    const workbenchSize = JSON.stringify(lists).length * 2;
    const groupsSize = JSON.stringify(groups).length * 2;
    const alertsSize = JSON.stringify(storage.getAlerts()).length * 2;
    const notificationsSize = JSON.stringify(notifications).length * 2;

    let settingsSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        settingsSize += (key.length + val.length) * 2;
      }
    }

    const totalUsed = workbenchSize + groupsSize + alertsSize + notificationsSize + settingsSize;
    const limitBytes = apiQuota || (100 * 1024 * 1024); // Use browser origin quota or 100MB fallback
    const freeBytes = Math.max(0, limitBytes - totalUsed);

    const categories = [
      { name: 'Lists & Tickers', value: workbenchSize, percent: (workbenchSize / limitBytes) * 100, color: '#6366f1' },
      { name: 'Groups', value: groupsSize, percent: (groupsSize / limitBytes) * 100, color: '#10b981' },
      { name: 'Alerts', value: alertsSize, percent: (alertsSize / limitBytes) * 100, color: '#f59e0b' },
      { name: 'Notifications', value: notificationsSize, percent: (notificationsSize / limitBytes) * 100, color: '#ef4444' },
      { name: 'App Settings', value: settingsSize, percent: (settingsSize / limitBytes) * 100, color: '#8b5cf6' },
      { name: 'Free Space', value: freeBytes, percent: (freeBytes / limitBytes) * 100, color: 'var(--surface-subtle)' }
    ];

    return {
      categories,
      totalUsed,
      limitBytes,
      percentUsed: (totalUsed / limitBytes) * 100
    };
  }, [isOpen, tickers, lists, groups, notifications, apiQuota]);

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

  const earningsData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byDate: Record<string, string[]> = {};
    filteredTickers.forEach(t => {
      const raw = t.stats.earningsDate;
      if (!raw || raw === 'N/A') return;
      const d = new Date(raw);
      if (isNaN(d.getTime()) || d < today) return;
      const key = raw.slice(0, 10); // YYYY-MM-DD
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(t.symbol);
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 5)
      .map(([date, symbols]) => ({ date, count: symbols.length, symbols }));
  }, [filteredTickers]);

  const maxCount = Math.max(...marketCapData.buckets.map(b => b.count), 1);
  const chartMax = Math.ceil(maxCount * 1.25);

  const IPO_BUCKETS = [
    { label: '< 3 Months', maxMonths: 3 },
    { label: '< 1 Year',   maxMonths: 12 },
    { label: '< 2 Years',  maxMonths: 24 },
    { label: '< 3 Years',  maxMonths: 36 },
    { label: '3+ Years',   maxMonths: Infinity },
  ];

  const ipoAgeData = useMemo(() => {
    const today = new Date();
    const buckets = IPO_BUCKETS.map(b => ({ ...b, count: 0, symbols: [] as string[] }));

    filteredTickers.forEach(t => {
      const raw = t.stats.ipoDate;
      if (!raw || raw === 'N/A') return;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return;
      const diffMs = today.getTime() - d.getTime();
      if (diffMs < 0) return;
      const ageMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
      const bucket = buckets.find(b => ageMonths < b.maxMonths);
      if (bucket) {
        bucket.count++;
        bucket.symbols.push(t.symbol);
      }
    });

    return buckets.filter(b => b.count > 0);
  }, [filteredTickers]);

  const dividendYieldData = useMemo(() => {
    const buckets = [
      { label: '1%', min: 0, max: 1, count: 0, symbols: [] as string[] },
      { label: '2%', min: 1, max: 2, count: 0, symbols: [] as string[] },
      { label: '3%', min: 2, max: 3, count: 0, symbols: [] as string[] },
      { label: '4%', min: 3, max: 4, count: 0, symbols: [] as string[] },
      { label: '5%', min: 4, max: 5, count: 0, symbols: [] as string[] },
      { label: '6+%', min: 5, max: Infinity, count: 0, symbols: [] as string[] },
    ];

    filteredTickers.forEach(t => {
      const dy = t.stats.dividendYield;
      if (dy === undefined || dy === null || dy <= 0) return;
      const bucket = buckets.find(b => dy > b.min && dy <= b.max);
      if (bucket) {
        bucket.count++;
        bucket.symbols.push(t.symbol);
      }
    });

    return buckets;
  }, [filteredTickers]);

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
                {[...lists].filter(l => !l.isArchived).sort((a, b) => a.name.localeCompare(b.name)).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--surface-divider)', paddingTop: '16px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', alignSelf: 'center', marginRight: '4px', fontWeight: 600, letterSpacing: '0.5px' }}>SHOW DIAGRAMS:</span>
            {DIAGRAM_ITEMS.filter(item => item.key !== 'badges' || badgeData.length > 0).map(item => {
              const active = visibleDiagrams[item.key];
              return (
                <button
                  key={item.key}
                  onClick={() => toggleDiagram(item.key)}
                  className={`diagram-toggle-btn ${active ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              );
            })}
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

        {(visibleDiagrams.marketCap || visibleDiagrams.sector) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px' }}>
            {/* Histogram Section */}
            {visibleDiagrams.marketCap && (
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
            )}

            {/* Sector Donut Section */}
            {visibleDiagrams.sector && (
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
            )}
          </div>
        )}

          {/* Scatter Plot Section */}
          {visibleDiagrams.scatter && (
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3 
                onClick={() => setIsScatterExpanded(!isScatterExpanded)}
                style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              >
                {isScatterExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Market Cap vs 1-Year Performance
                <div title="Scatter plot showing the relationship between company size and 1-year returns." style={{ cursor: 'help', opacity: 0.5 }} onClick={e => e.stopPropagation()}>
                  <Info size={14} />
                </div>
              </h3>
              {isScatterExpanded && (
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
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'none', marginBottom: '2px' }}>Sector: {data.ticker.stats.sector || 'Unknown'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'none', marginBottom: '2px' }}>Market Cap: {formatMarketCap(data.x)}</div>
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
                              segment={s.trendline as any} 
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
              )}
            </div>
          )}

          {/* SMA Notifications Chart */}
          {visibleDiagrams.sma && (
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3 
                onClick={() => setIsSmaExpanded(!isSmaExpanded)}
                style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              >
                {isSmaExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                SMA Crossover Notifications
                <div title="Distribution of SMA crossover alerts for the current selection, stacked by direction." style={{ cursor: 'help', opacity: 0.5 }} onClick={e => e.stopPropagation()}>
                  <Info size={14} />
                </div>
              </h3>
              {isSmaExpanded && (
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
                        <LabelList dataKey="Above" position="center" fill="white" fontSize={10} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                      <Bar dataKey="Below" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40}>
                        <LabelList dataKey="Below" position="center" fill="white" fontSize={10} formatter={(v: any) => v > 0 ? v : ''} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
          {/* Badge Distribution Chart */}
          {badgeData.length > 0 && visibleDiagrams.badges && (
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3 
                onClick={() => setIsBadgeExpanded(!isBadgeExpanded)}
                style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              >
                {isBadgeExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Badge Distribution
                <div title="Count of custom badges across all selected tickers." style={{ cursor: 'help', opacity: 0.5 }} onClick={e => e.stopPropagation()}>
                  <Info size={14} />
                </div>
              </h3>
              {isBadgeExpanded && (
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
              )}
            </div>
          )}

          {/* Upcoming Earnings Chart */}
          {visibleDiagrams.earnings && (
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3
                onClick={() => setIsEarningsExpanded(!isEarningsExpanded)}
                style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              >
                {isEarningsExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Upcoming Earnings
                <div title="Number of tickers reporting earnings on each of the next 5 upcoming dates." style={{ cursor: 'help', opacity: 0.5 }} onClick={e => e.stopPropagation()}>
                  <Info size={14} />
                </div>
              </h3>
              {isEarningsExpanded && (
                earningsData.length === 0 ? (
                  <div style={{ background: 'var(--surface-inset)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    No upcoming earnings dates found in the current selection.
                  </div>
                ) : (
                  <div style={{ background: 'var(--surface-inset)', padding: '30px 20px 20px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={earningsData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-divider)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="var(--text-secondary)"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          stroke="var(--text-secondary)"
                          tick={{ fontSize: 12 }}
                          allowDecimals={false}
                          width={32}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={52}>
                          {earningsData.map((entry, index) => (
                            <Cell
                              key={entry.date}
                              fill={`hsl(${240 + index * 22}, 82%, ${58 + index * 4}%)`}
                            />
                          ))}
                          <LabelList dataKey="count" position="top" fill="var(--text-secondary)" fontSize={12} fontWeight={600} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              )}
            </div>
          )}

          {/* IPO Age Distribution Chart */}
          {visibleDiagrams.ipo && (
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3
                onClick={() => setIsIpoExpanded(!isIpoExpanded)}
                style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              >
                {isIpoExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                IPO Age Distribution
                <div title="Number of tickers grouped by how long ago they IPO'd." style={{ cursor: 'help', opacity: 0.5 }} onClick={e => e.stopPropagation()}>
                  <Info size={14} />
                </div>
              </h3>
              {isIpoExpanded && (
                ipoAgeData.length === 0 ? (
                  <div style={{ background: 'var(--surface-inset)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    No IPO date data found in the current selection.
                  </div>
                ) : (
                  <div style={{ background: 'var(--surface-inset)', padding: '30px 20px 20px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ipoAgeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-divider)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="var(--text-secondary)"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          stroke="var(--text-secondary)"
                          tick={{ fontSize: 12 }}
                          allowDecimals={false}
                          width={32}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={64}>
                          {ipoAgeData.map((entry, index) => (
                            <Cell
                              key={entry.label}
                              fill={['#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#f59e0b'][index % 5]}
                            />
                          ))}
                          <LabelList dataKey="count" position="top" fill="var(--text-secondary)" fontSize={12} fontWeight={600} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              )}
            </div>
          )}

          {/* Dividend Yield Distribution Chart */}
          {visibleDiagrams.dividend && (
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3
                onClick={() => setIsDividendExpanded(!isDividendExpanded)}
                style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              >
                {isDividendExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Dividend Yield Distribution
                <div title="Distribution of dividend yields for the current selection (excluding non-paying stocks)." style={{ cursor: 'help', opacity: 0.5 }} onClick={e => e.stopPropagation()}>
                  <Info size={14} />
                </div>
              </h3>
              {isDividendExpanded && (
                dividendYieldData.reduce((sum, b) => sum + b.count, 0) === 0 ? (
                  <div style={{ background: 'var(--surface-inset)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    No dividend-paying stocks found in the current selection.
                  </div>
                ) : (
                  <div style={{ background: 'var(--surface-inset)', padding: '30px 20px 20px 20px', borderRadius: '12px', border: '1px solid var(--border-color)', height: '320px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dividendYieldData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-divider)" vertical={false} />
                        <XAxis
                          dataKey="label"
                          stroke="var(--text-secondary)"
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis
                          stroke="var(--text-secondary)"
                          tick={{ fontSize: 12 }}
                          allowDecimals={false}
                          width={32}
                        />
                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={64}>
                          {dividendYieldData.map((entry, index) => (
                            <Cell
                              key={entry.label}
                              fill={['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ef4444'][index % 6]}
                            />
                          ))}
                          <LabelList dataKey="count" position="top" fill="var(--text-secondary)" fontSize={12} fontWeight={600} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              )}
            </div>
          )}

          {/* Storage Analytics Section */}
          {visibleDiagrams.storage && (
            <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
              <h3 
                onClick={() => setIsStorageExpanded(!isStorageExpanded)}
                style={{ marginBottom: '24px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              >
                {isStorageExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                Local Storage Usage & Quota
                <div title="Detailed breakdown of localStorage categories and total browser storage quota via Storage Estimate API." style={{ cursor: 'help', opacity: 0.5 }} onClick={e => e.stopPropagation()}>
                  <Info size={14} />
                </div>
              </h3>
              
              {isStorageExpanded && (
              <div style={{ background: 'var(--surface-inset)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '40px' }}>
                  {/* Donut Chart */}
                  <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      {storageData.categories.map((cat, i) => {
                        const totalPercentBefore = storageData.categories.slice(0, i).reduce((sum, item) => sum + item.percent, 0);
                        return (
                          <circle
                            key={cat.name}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke={cat.color}
                            strokeWidth="12"
                            strokeDasharray={`${cat.percent * 2.513} 251.3`}
                            strokeDashoffset={-totalPercentBefore * 2.513}
                            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                          >
                            <title>{`${cat.name}: ${formatBytes(cat.value)} (${(cat.value / storageData.limitBytes * 100).toFixed(1)}%)`}</title>
                          </circle>
                        );
                      })}
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 700 }}>{storageData.percentUsed.toFixed(1)}%</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Used</div>
                    </div>
                  </div>

                  {/* Details and Legend */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Origin Storage Quota</div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>{formatBytes(storageData.limitBytes)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Total browser allocation</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>App Storage Used</div>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: storageData.percentUsed >= 80 ? 'var(--error-bg, #ef4444)' : 'var(--text-primary)' }}>
                          {formatBytes(storageData.totalUsed)}
                        </div>
                        {storageData.percentUsed >= 80 && (
                          <div style={{ fontSize: '10px', color: 'var(--error-bg, #ef4444)', fontWeight: 'bold', marginTop: '2px' }}>
                            ⚠️ Warning: Origin Storage is almost full!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '12px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <div style={{
                        width: `${storageData.percentUsed}%`,
                        background: storageData.percentUsed >= 80 ? 'var(--error-bg, #ef4444)' : 'var(--accent)',
                        height: '100%',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-out'
                      }} />
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', marginTop: '8px' }}>
                      {storageData.categories.map(cat => (
                        <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: cat.color }} />
                          <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }}>
                            {cat.name}
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {cat.name === 'Free Space' ? `${cat.percent.toFixed(0)}%` : formatBytes(cat.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Storage Estimate API Section */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Storage Estimate API (Origin Quota)</span>
                    <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>IndexedDB & Cache</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Total Quota: </span>
                      <span style={{ fontWeight: 600 }}>{apiQuota !== null ? formatBytes(apiQuota) : 'Loading...'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Estimated Usage: </span>
                      <span style={{ fontWeight: 600 }}>{apiUsage !== null ? formatBytes(apiUsage) : 'Loading...'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>Percentage Filled: </span>
                      <span style={{ fontWeight: 600 }}>
                        {apiUsage !== null && apiQuota !== null && apiQuota > 0
                          ? `${((apiUsage / apiQuota) * 100).toFixed(4)}%`
                          : '0.00%'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

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
          .diagram-toggle-btn {
            padding: 4px 10px;
            font-size: 11px;
            border-radius: 16px;
            background: var(--surface-subtle);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
            opacity: 0.6;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 4px;
            font-weight: 500;
          }
          .diagram-toggle-btn.active {
            background: var(--accent);
            color: white;
            opacity: 1;
            border-color: var(--accent);
          }
          .diagram-toggle-btn:hover {
            opacity: 1;
            filter: brightness(1.1);
          }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: var(--scrollbar-thumb); border-radius: 10px; }
        `}</style>
      </div>
    </div>
  );
};
