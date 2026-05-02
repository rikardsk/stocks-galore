import React, { useMemo } from 'react';
import { X, Trophy, TrendingUp, Calendar, Clock } from 'lucide-react';
import type { Ticker } from '../types';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker[];
}

export const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose, tickers }) => {
  const rankings = useMemo(() => {
    const validTickers = tickers.filter(t => t.name !== 'Unknown Company');

    const top1M = [...validTickers]
      .sort((a, b) => (b.stats.perf1M || 0) - (a.stats.perf1M || 0))
      .slice(0, 10);

    const top3M = [...validTickers]
      .sort((a, b) => (b.stats.perf3M || 0) - (a.stats.perf3M || 0))
      .slice(0, 10);

    const top1Y = [...validTickers]
      .sort((a, b) => (b.stats.perf1Y || 0) - (a.stats.perf1Y || 0))
      .slice(0, 10);

    return { top1M, top3M, top1Y };
  }, [tickers]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Trophy size={24} color="#f59e0b" />
            <h2 style={{ margin: 0 }}>Top Performers</h2>
          </div>
          <button className="btn" onClick={onClose}><X /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {/* Top 1M */}
          <RankingColumn 
            title="1 Month" 
            icon={<Clock size={18} color="#10b981" />} 
            tickers={rankings.top1M} 
            metric="perf1M" 
          />

          {/* Top 3M */}
          <RankingColumn 
            title="3 Months" 
            icon={<TrendingUp size={18} color="#6366f1" />} 
            tickers={rankings.top3M} 
            metric="perf3M" 
          />

          {/* Top 1Y */}
          <RankingColumn 
            title="1 Year" 
            icon={<Calendar size={18} color="#ec4899" />} 
            tickers={rankings.top1Y} 
            metric="perf1Y" 
          />
        </div>
      </div>
    </div>
  );
};

interface RankingColumnProps {
  title: string;
  icon: React.ReactNode;
  tickers: Ticker[];
  metric: 'perf1M' | 'perf3M' | 'perf1Y';
}

const RankingColumn: React.FC<RankingColumnProps> = ({ title, icon, tickers, metric }) => {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>{title}</h3>
      </div>
      <div style={{ padding: '8px' }}>
        {tickers.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No data available
          </div>
        ) : (
          tickers.map((ticker, index) => {
            const val = ticker.stats[metric] || 0;
            return (
              <div 
                key={ticker.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 12px', 
                  borderRadius: '8px',
                  transition: 'background 0.2s'
                }}
                className="ranking-row"
              >
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '11px', 
                  fontWeight: 700,
                  color: index < 3 ? '#f59e0b' : 'var(--text-secondary)',
                  background: index < 3 ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                  borderRadius: '50%'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{ticker.symbol}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ticker.name}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  color: val >= 0 ? '#10b981' : '#ef4444',
                  background: val >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {val >= 0 ? '+' : ''}{val.toFixed(1)}%
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`
        .ranking-row:hover {
          background: rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
};
