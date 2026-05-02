import React, { useState, useMemo } from 'react';
import { X, BarChart2, PieChart, Info } from 'lucide-react';
import type { Ticker, StockList, ListGroup } from '../types';
import { parseMarketCap, formatMarketCap } from '../types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker[];
  lists: StockList[];
  groups: ListGroup[];
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

  const maxCount = Math.max(...marketCapData.buckets.map(b => b.count), 1);
  const chartMax = Math.ceil(maxCount * 1.25);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', position: 'sticky', top: 0, background: '#1c1c21', zIndex: 10, paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart2 size={24} color="var(--accent)" />
            <h2 style={{ margin: 0 }}>Portfolio Analytics</h2>
          </div>
          <button className="btn" onClick={onClose}><X /></button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Group:</span>
            <select 
              value={selectedGroupId} 
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setSelectedListId('all');
              }}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '6px 12px' }}
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
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '6px 12px' }}
            >
              <option value="all">All Lists</option>
              {lists.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
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
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px', marginBottom: '40px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  {[0, 0.2, 0.4, 0.6, 0.8, 1].map(p => (
                    <div key={p} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', width: '100%', position: 'relative' }}>
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
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '30px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '30px', minHeight: '312px' }}>
              <div style={{ position: 'relative', width: '180px', height: '180px', flexShrink: 0 }}>
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  {sectorData.length === 0 ? (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
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
        </div>

        <style>{`
          .stat-card {
            background: rgba(255,255,255,0.03);
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
          ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        `}</style>
      </div>
    </div>
  );
};
