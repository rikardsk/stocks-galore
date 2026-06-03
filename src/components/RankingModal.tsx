import React, { useMemo, useState } from 'react';
import { X, Trophy, TrendingUp, Calendar, Clock, Copy, Check } from 'lucide-react';
import type { Ticker } from '../types';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Ticker[];
  onSelectTicker: (ticker: Ticker) => void;
  theme: 'dark' | 'light';
}

export const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose, tickers, onSelectTicker, theme }) => {
  
  const rankings = useMemo(() => {
    const validTickers = tickers.filter(t => t.name !== 'Unknown Company');

    const topToday = [...validTickers]
      .sort((a, b) => {
        const valA = parseFloat(a.stats.changePercent.replace('%', '')) || 0;
        const valB = parseFloat(b.stats.changePercent.replace('%', '')) || 0;
        return valB - valA;
      })
      .slice(0, 10);

    const top1M = [...validTickers]
      .sort((a, b) => (b.stats.perf1M || 0) - (a.stats.perf1M || 0))
      .slice(0, 10);

    const top3M = [...validTickers]
      .sort((a, b) => (b.stats.perf3M || 0) - (a.stats.perf3M || 0))
      .slice(0, 10);

    const top1Y = [...validTickers]
      .sort((a, b) => (b.stats.perf1Y || 0) - (a.stats.perf1Y || 0))
      .slice(0, 10);

    return { topToday, top1M, top3M, top1Y };
  }, [tickers]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%', background: 'var(--surface-modal)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Trophy size={24} color="#f59e0b" />
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Top Performers</h2>
          </div>
          <button className="btn" onClick={onClose}><X /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {/* Top Today */}
          <RankingColumn 
            title="Today" 
            icon={<TrendingUp size={18} color="#10b981" />} 
            tickers={rankings.topToday} 
            metric="changePercent" 
            onSelectTicker={onSelectTicker}
            theme={theme}
          />

          {/* Top 1M */}
          <RankingColumn 
            title="1 Month" 
            icon={<Clock size={18} color="#10b981" />} 
            tickers={rankings.top1M} 
            metric="perf1M" 
            onSelectTicker={onSelectTicker}
            theme={theme}
          />

          {/* Top 3M */}
          <RankingColumn 
            title="3 Months" 
            icon={<TrendingUp size={18} color="#6366f1" />} 
            tickers={rankings.top3M} 
            metric="perf3M" 
            onSelectTicker={onSelectTicker}
            theme={theme}
          />

          {/* Top 1Y */}
          <RankingColumn 
            title="1 Year" 
            icon={<Calendar size={18} color="#ec4899" />} 
            tickers={rankings.top1Y} 
            metric="perf1Y" 
            onSelectTicker={onSelectTicker}
            theme={theme}
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
  metric: 'perf1M' | 'perf3M' | 'perf1Y' | 'changePercent';
  onSelectTicker: (ticker: Ticker) => void;
  theme: 'dark' | 'light';
}

const RankingColumn: React.FC<RankingColumnProps> = ({ title, icon, tickers, metric, onSelectTicker, theme: _theme }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const symbols = tickers.map(t => t.symbol).join(', ');
    navigator.clipboard.writeText(symbols).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ background: 'var(--surface-subtle)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <div style={{ 
        padding: '12px 16px', 
        background: 'var(--surface-inset)', 
        borderBottom: '1px solid var(--border-color)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '52px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          {icon}
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h3>
        </div>
        {tickers.length > 0 && (
          <button 
            onClick={handleCopy}
            style={{
              border: 'none',
              color: copied ? '#10b981' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '6px',
              background: copied ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            className="copy-btn"
            title={copied ? "Copied!" : "Copy all tickers as comma-separated list"}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        )}
      </div>
      <div style={{ padding: '8px' }}>
        {tickers.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No data available
          </div>
        ) : (
          tickers.map((ticker, index) => {
            const rawVal = ticker.stats[metric];
            const val = typeof rawVal === 'string' 
              ? parseFloat(rawVal.replace('%', '')) 
              : (rawVal || 0);
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
                <div 
                  style={{ flex: 1, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => onSelectTicker(ticker)}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{ticker.symbol}</div>
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
          background: var(--surface-hover);
        }
        .copy-btn:hover {
          color: var(--text-primary) !important;
          background: var(--surface-hover);
        }
      `}</style>
    </div>
  );
};
