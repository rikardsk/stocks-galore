import React from 'react';
import { X, Bell, BellOff, Calendar, Search, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp, Filter, Table } from 'lucide-react';
import type { TickerNotification, Ticker } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: TickerNotification[];
  onClear: (ids?: string[]) => void;
  onMarkRead: () => void;
  onOpenAlerts: () => void;
  onSelectTicker: (ticker: Ticker) => void;
  onOpenTableWithSymbols: (symbols: string[]) => void;
  allTickers: Ticker[];
  smaNotificationsEnabled: { sma10: boolean; sma20: boolean };
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClear,
  onMarkRead,
  onOpenAlerts,
  onSelectTicker,
  onOpenTableWithSymbols,
  allTickers,
  smaNotificationsEnabled
}) => {
  const [sliderDays, setSliderDays] = React.useState<number>(30);
  const [sliderMode, setSliderMode] = React.useState<'before' | 'after'>('after');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'price' | 'changePercent' | 'crossover' | 'sma10' | 'sma20' | 'sma50' | 'sma100' | 'sma200' | 'sma20_sma50' | 'sma50_sma200' | 'earnings' | 'earningsBeat' | 'earningsMiss'>('all');
  const [directionFilter, setDirectionFilter] = React.useState<'all' | 'above' | 'below'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [fiftyTwoWeekFilter, setFiftyTwoWeekFilter] = React.useState<number>(50);
  const [fiftyTwoWeekDirection, setFiftyTwoWeekDirection] = React.useState<'none' | 'above' | 'below'>('none');
  const [peFilter, setPeFilter] = React.useState<number>(20);
  const [peDirection, setPeDirection] = React.useState<'none' | 'above' | 'below'>('none');
  const [volumeFilter, setVolumeFilter] = React.useState<'none' | '2x' | '3x' | '4x' | '5x'>('none');
  const [yieldFilter, setYieldFilter] = React.useState<number>(2);
  const [yieldDirection, setYieldDirection] = React.useState<'none' | 'above' | 'below'>('none');
  const [showFilters, setShowFilters] = React.useState(true);

  const timeFilteredNotifications = React.useMemo(() => {
    const getDaysDiff = (timestamp: string) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - date.getTime();
      return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    };

    return notifications.filter(n => {
      const diff = getDaysDiff(n.timestamp);
      if (sliderMode === 'after') {
        return diff <= sliderDays;
      } else {
        return diff >= sliderDays;
      }
    });
  }, [notifications, sliderDays, sliderMode]);

  const filterCounts = React.useMemo(() => {
    // Calculate direction counts based only on time filter
    const dirCounts = { above: 0, below: 0 };
    timeFilteredNotifications.forEach(n => {
      const upperMsg = n.message.toUpperCase();
      if (upperMsg.includes('ABOVE') || upperMsg.includes('OVER')) dirCounts.above++;
      if (upperMsg.includes('BELOW') || upperMsg.includes('UNDER')) dirCounts.below++;
    });

    // Calculate other counts based on current time + direction selection
    const baseForCounts = timeFilteredNotifications.filter(n => {
      if (directionFilter === 'all') return true;
      const upperMsg = n.message.toUpperCase();
      if (directionFilter === 'above') return upperMsg.includes('ABOVE') || upperMsg.includes('OVER');
      if (directionFilter === 'below') return upperMsg.includes('BELOW') || upperMsg.includes('UNDER');
      return true;
    });

    const counts = {
      all: baseForCounts.length,
      price: 0,
      changePercent: 0,
      crossover: 0,
      sma10: 0,
      sma20: 0,
      sma50: 0,
      sma100: 0,
      sma200: 0,
      sma20_sma50: 0,
      sma50_sma200: 0,
      earnings: 0,
      earningsBeat: 0,
      earningsMiss: 0,
      ...dirCounts
    };

    baseForCounts.forEach(n => {
      const msg = n.message.toLowerCase();
      const isCrossover = n.type === 'crossover' || n.type?.startsWith('sma') || msg.includes('crossed');
      const isPrice = n.type === 'price' || (msg.includes('price') && !isCrossover);
      const isPercent = n.type === 'changePercent' || ((msg.includes('change') || msg.includes('%')) && !isCrossover);

      if (isPrice) counts.price++;
      if (isPercent) counts.changePercent++;
      if (isCrossover) counts.crossover++;

      if (n.type === 'sma20_sma50' || msg.includes('sma20 crossed above sma50') || msg.includes('sma20/sma50')) counts.sma20_sma50++;
      else if (n.type === 'sma50_sma200' || msg.includes('sma50 crossed above sma200') || msg.includes('sma50/sma200')) counts.sma50_sma200++;
      else if (n.type === 'sma200' || msg.includes('sma200')) counts.sma200++;
      else if (n.type === 'sma100' || msg.includes('sma100')) counts.sma100++;
      else if (n.type === 'sma50' || msg.includes('sma50')) counts.sma50++;
      else if (n.type === 'sma20' || msg.includes('sma20')) counts.sma20++;
      else if (n.type === 'sma10' || msg.includes('sma10')) counts.sma10++;
      else if (n.type === 'earnings' || msg.includes('earnings')) {
        counts.earnings++;
        if (msg.includes('beat')) counts.earningsBeat++;
        if (msg.includes('miss')) counts.earningsMiss++;
      }
    });

    return counts;
  }, [timeFilteredNotifications, directionFilter]);

  const filteredNotifications = React.useMemo(() => {
    let filtered = timeFilteredNotifications;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toUpperCase();
      filtered = filtered.filter(n => n.symbol.toUpperCase().includes(query));
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => {
        const msg = n.message.toLowerCase();
        
        if (typeFilter === 'price') {
          return n.type === 'price' || (msg.includes('price') && !msg.includes('crossed'));
        }
        if (typeFilter === 'changePercent') {
          return n.type === 'changePercent' || ((msg.includes('change') || msg.includes('%')) && !msg.includes('crossed'));
        }
        if (typeFilter === 'crossover') {
          return n.type === 'crossover' || n.type?.startsWith('sma') || msg.includes('crossed');
        }
        if (typeFilter.startsWith('sma')) {
          if (n.type === typeFilter) return true;
          if (typeFilter === 'sma20_sma50') return msg.includes('sma20 crossed above sma50') || msg.includes('sma20/sma50');
          if (typeFilter === 'sma50_sma200') return msg.includes('sma50 crossed above sma200') || msg.includes('sma50/sma200');
          // Precision check for legacy messages
          if (typeFilter === 'sma200') return msg.includes('sma200');
          if (typeFilter === 'sma100') return msg.includes('sma100');
          if (typeFilter === 'sma50') return msg.includes('sma50') && !msg.includes('sma50_sma200') && !msg.includes('sma20_sma50');
          if (typeFilter === 'sma20') return msg.includes('sma20') && !msg.includes('sma200') && !msg.includes('sma20_sma50');
          if (typeFilter === 'sma10') return msg.includes('sma10') && !msg.includes('sma100');
          return false;
        }
        if (typeFilter === 'earnings') {
          return n.type === 'earnings' || msg.includes('earnings');
        }
        if (typeFilter === 'earningsBeat') {
          return (n.type === 'earnings' || msg.includes('earnings')) && msg.includes('beat');
        }
        if (typeFilter === 'earningsMiss') {
          return (n.type === 'earnings' || msg.includes('earnings')) && msg.includes('miss');
        }
        return false;
      });
    }

    // Direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(n => {
        const msg = n.message.toUpperCase();
        if (directionFilter === 'above') return msg.includes('ABOVE') || msg.includes('OVER');
        if (directionFilter === 'below') return msg.includes('BELOW') || msg.includes('UNDER');
        return true;
      });
    }

    // 52 Week Filter
    if (fiftyTwoWeekDirection !== 'none') {
      filtered = filtered.filter(n => {
        const ticker = allTickers.find(t => t.symbol === n.symbol);
        if (!ticker || !ticker.stats.high52 || !ticker.stats.low52) return false;
        
        const price = parseFloat(ticker.stats.price);
        const low = ticker.stats.low52;
        const high = ticker.stats.high52;
        const range = high - low;
        if (range <= 0) return false;
        
        const percentInRange = ((price - low) / range) * 100;
        
        if (fiftyTwoWeekDirection === 'above') {
          return percentInRange >= fiftyTwoWeekFilter;
        } else {
          return percentInRange <= fiftyTwoWeekFilter;
        }
      });
    }

    // P/E Filter
    if (peDirection !== 'none') {
      filtered = filtered.filter(n => {
        const ticker = allTickers.find(t => t.symbol === n.symbol);
        if (!ticker || ticker.stats.pe === undefined || ticker.stats.pe === null) return false;
        
        const pe = ticker.stats.pe;
        if (peDirection === 'above') {
          return pe >= peFilter;
        } else {
          return pe <= peFilter;
        }
      });
    }

    // Yield Filter
    if (yieldDirection !== 'none') {
      filtered = filtered.filter(n => {
        const ticker = allTickers.find(t => t.symbol === n.symbol);
        if (!ticker || ticker.stats.dividendYield === undefined || ticker.stats.dividendYield === null) return false;
        
        const yieldVal = ticker.stats.dividendYield;
        if (yieldDirection === 'above') {
          return yieldVal >= yieldFilter;
        } else {
          return yieldVal <= yieldFilter;
        }
      });
    }

    // Volume Filter
    if (volumeFilter !== 'none') {
      const targetRatio = parseInt(volumeFilter);
      filtered = filtered.filter(n => {
        const ticker = allTickers.find(t => t.symbol === n.symbol);
        if (!ticker || !ticker.stats.volume || !ticker.stats.avgVolume) return false;
        
        const parseVol = (s: string): number => {
          const num = parseFloat(s);
          if (isNaN(num)) return 0;
          if (s.toUpperCase().includes('B')) return num * 1000000000;
          if (s.toUpperCase().includes('M')) return num * 1000000;
          if (s.toUpperCase().includes('K')) return num * 1000;
          return num;
        };

        const currentVol = parseVol(ticker.stats.volume);
        const avgVol = parseVol(ticker.stats.avgVolume);
        if (avgVol === 0) return false;
        
        const ratio = currentVol / avgVol;
        return ratio >= targetRatio;
      });
    }

    return filtered;
  }, [timeFilteredNotifications, typeFilter, directionFilter, searchQuery, fiftyTwoWeekFilter, fiftyTwoWeekDirection, peFilter, peDirection, volumeFilter, yieldFilter, yieldDirection, allTickers]);

  const topTickers = React.useMemo(() => {
    const counts: Record<string, number> = {};
    timeFilteredNotifications.forEach(n => {
      counts[n.symbol] = (counts[n.symbol] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 1) // Only show if frequent (count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([symbol]) => symbol);
  }, [timeFilteredNotifications]);

  const handleResetFilters = () => {
    setSliderDays(30);
    setSliderMode('after');
    setTypeFilter('all');
    setDirectionFilter('all');
    setSearchQuery('');
    setFiftyTwoWeekDirection('none');
    setFiftyTwoWeekFilter(50);
    setPeDirection('none');
    setPeFilter(20);
    setVolumeFilter('none');
    setYieldDirection('none');
    setYieldFilter(2);
  };

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (sliderDays !== 30 || sliderMode !== 'after') count++;
    if (typeFilter !== 'all') count++;
    if (directionFilter !== 'all') count++;
    if (fiftyTwoWeekDirection !== 'none') count++;
    if (peDirection !== 'none') count++;
    if (volumeFilter !== 'none') count++;
    if (yieldDirection !== 'none') count++;
    return count;
  }, [sliderDays, sliderMode, typeFilter, directionFilter, fiftyTwoWeekDirection, peDirection, volumeFilter, yieldDirection]);

  React.useEffect(() => {
    if (isOpen && notifications.some(n => !n.isRead)) {
      onMarkRead();
    }
  }, [isOpen, notifications, onMarkRead]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '540px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="var(--accent)" />
            <h3 style={{ margin: 0 }}>Notifications ({filteredNotifications.length})</h3>
            {(sliderDays !== 30 || sliderMode !== 'after' || typeFilter !== 'all' || directionFilter !== 'all' || searchQuery || fiftyTwoWeekDirection !== 'none' || peDirection !== 'none' || volumeFilter !== 'none' || yieldDirection !== 'none') && (
              <button 
                className="btn" 
                onClick={handleResetFilters}
                style={{ 
                  fontSize: '10px', 
                  padding: '2px 8px', 
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '100px',
                  marginLeft: '8px'
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="btn" 
              onClick={() => setShowFilters(!showFilters)}
              style={{ 
                fontSize: '11px', 
                padding: '4px 10px', 
                background: showFilters ? 'var(--surface-subtle)' : 'var(--accent)',
                color: showFilters ? 'var(--text-primary)' : 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Filter size={12} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {activeFilterCount > 0 && !showFilters && (
                <span style={{ 
                  background: 'white', 
                  color: 'var(--accent)', 
                  borderRadius: '10px', 
                  padding: '0 5px', 
                  fontSize: '9px', 
                  fontWeight: 800 
                }}>
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <button className="btn" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              type="text" 
              placeholder="Search ticker..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ 
                width: '100%', 
                background: 'var(--surface-subtle)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px',
                padding: '8px 30px 8px 30px',
                fontSize: '12px',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  padding: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  opacity: 0.8,
                  color: 'white'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Date Slider Filter Row */}
          <div style={{ 
            background: 'var(--surface-subtle)', 
            borderRadius: '8px', 
            padding: '10px', 
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {(() => {
                  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  const cutoff = new Date();
                  cutoff.setDate(cutoff.getDate() - sliderDays);
                  const today = new Date();
                  if (sliderDays === 30 && sliderMode === 'after') {
                    return `CREATION DATE: ALL`;
                  } else if (sliderMode === 'after') {
                    return `CREATION DATE: LAST ${sliderDays} DAY${sliderDays !== 1 ? 'S' : ''} (${fmt(cutoff)} – ${fmt(today)})`;
                  } else {
                    return `CREATION DATE: OLDER THAN ${sliderDays} DAY${sliderDays !== 1 ? 'S' : ''} (before ${fmt(cutoff)})`;
                  }
                })()}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => { setSliderDays(30); setSliderMode('after'); }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '9px',
                      borderRadius: '4px',
                      background: sliderDays === 30 && sliderMode === 'after' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      color: sliderDays === 30 && sliderMode === 'after' ? 'white' : 'var(--text-secondary)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => { setSliderDays(0); setSliderMode('after'); }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '9px',
                      borderRadius: '4px',
                      background: sliderDays === 0 && sliderMode === 'after' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      color: sliderDays === 0 && sliderMode === 'after' ? 'white' : 'var(--text-secondary)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => { setSliderDays(1); setSliderMode('after'); }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '9px',
                      borderRadius: '4px',
                      background: sliderDays === 1 && sliderMode === 'after' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      color: sliderDays === 1 && sliderMode === 'after' ? 'white' : 'var(--text-secondary)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => { setSliderDays(7); setSliderMode('after'); }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '9px',
                      borderRadius: '4px',
                      background: sliderDays === 7 && sliderMode === 'after' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                      color: sliderDays === 7 && sliderMode === 'after' ? 'white' : 'var(--text-secondary)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Week
                  </button>
                </div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {(['before', 'after'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSliderMode(mode)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: sliderMode === mode ? 'var(--accent)' : 'transparent',
                        color: sliderMode === mode ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setSliderDays(prev => Math.max(0, prev - 1))}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  minWidth: '28px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={sliderDays <= 0}
              >
                -
              </button>
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  value={sliderDays}
                  onChange={(e) => setSliderDays(parseInt(e.target.value))}
                  style={{ 
                    width: '100%',
                    accentColor: 'var(--accent)',
                    height: '4px',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
              <button
                onClick={() => setSliderDays(prev => Math.min(30, prev + 1))}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  minWidth: '28px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                disabled={sliderDays >= 30}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="filters-container" style={{ display: 'flex', flexDirection: 'column', animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ display: 'flex', background: 'var(--surface-subtle)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
              {(['all', 'price', 'changePercent', 'crossover', 'earnings', 'earningsBeat', 'earningsMiss'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setTypeFilter(typeFilter === f ? 'all' : f)}
                  style={{ 
                    flex: 1,
                    padding: '4px 2px', 
                    fontSize: '9px', 
                    borderRadius: '6px',
                    background: typeFilter === f 
                      ? (f === 'earningsBeat' ? 'rgba(16, 185, 129, 0.15)' : f === 'earningsMiss' ? 'rgba(239, 68, 68, 0.15)' : 'var(--surface-hover)') 
                      : 'transparent',
                    color: typeFilter === f 
                      ? (f === 'earningsBeat' ? '#10b981' : f === 'earningsMiss' ? '#ef4444' : 'var(--text-primary)') 
                      : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontWeight: typeFilter === f ? 700 : 400,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px'
                  }}
                >
                  <span>
                    {f === 'changePercent' ? '%' : 
                     f === 'earningsBeat' ? 'BEAT' : 
                     f === 'earningsMiss' ? 'MISS' : 
                     f}
                  </span>
                  <span style={{ fontSize: '8px', opacity: 0.6 }}>{filterCounts[f]}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', flex: 1, background: 'var(--surface-subtle)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)' }}>
                {(['all', 'above', 'below'] as const).map(f => (
                  <button 
                    key={f}
                    onClick={() => setDirectionFilter(directionFilter === f ? 'all' : f)}
                    style={{ 
                      flex: 1,
                      padding: '4px 2px', 
                      fontSize: '9px', 
                      borderRadius: '6px',
                      background: directionFilter === f ? 'var(--surface-hover)' : 'transparent',
                      color: directionFilter === f ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      fontWeight: directionFilter === f ? 700 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    {f === 'above' && <TrendingUp size={10} color="#10b981" />}
                    {f === 'below' && <TrendingDown size={10} color="#ef4444" />}
                    <span style={{ marginRight: '4px' }}>{f}</span>
                    <span style={{ fontSize: '8px', opacity: 0.6 }}>({f === 'all' ? timeFilteredNotifications.length : filterCounts[f]})</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', background: 'var(--surface-subtle)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-color)', marginBottom: '8px' }}>
              {(['sma10', 'sma20', 'sma50', 'sma100', 'sma200', 'sma20_sma50', 'sma50_sma200'] as const).map(f => {
                const isDisabled =
                  (f === 'sma10' && !smaNotificationsEnabled.sma10) ||
                  (f === 'sma20' && !smaNotificationsEnabled.sma20);
                return (
                  <button 
                    key={f}
                    onClick={() => setTypeFilter(typeFilter === f ? 'all' : f)}
                    title={isDisabled ? 'Notifications disabled in Settings' : undefined}
                    style={{ 
                      flex: 1,
                      padding: '4px 2px', 
                      fontSize: '9px', 
                      borderRadius: '6px',
                      background: typeFilter === f ? 'var(--surface-hover)' : 'transparent',
                      color: isDisabled
                        ? 'rgba(239,68,68,0.55)'
                        : typeFilter === f ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      fontWeight: typeFilter === f ? 700 : 400,
                      opacity: isDisabled ? 0.55 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      position: 'relative'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {isDisabled && <BellOff size={7} style={{ flexShrink: 0 }} />}
                      {f === 'sma20_sma50' ? 'SMA 20/50' : 
                       f === 'sma50_sma200' ? 'SMA 50/200' : 
                       f}
                    </span>
                    <span style={{ fontSize: '8px', opacity: 0.6 }}>{filterCounts[f]}</span>
                  </button>
                );
              })}
            </div>

            {/* 52 Week Filter UI */}
            <div style={{ 
              background: 'var(--surface-subtle)', 
              borderRadius: '8px', 
              padding: '10px', 
              border: '1px solid var(--border-color)', 
              marginBottom: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>52 Week Range</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => { setFiftyTwoWeekFilter(99); setFiftyTwoWeekDirection('above'); }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: fiftyTwoWeekFilter === 99 && fiftyTwoWeekDirection === 'above' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: fiftyTwoWeekFilter === 99 && fiftyTwoWeekDirection === 'above' ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ATH
                    </button>
                    <button
                      onClick={() => { setFiftyTwoWeekFilter(1); setFiftyTwoWeekDirection('below'); }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: fiftyTwoWeekFilter === 1 && fiftyTwoWeekDirection === 'below' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: fiftyTwoWeekFilter === 1 && fiftyTwoWeekDirection === 'below' ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ATL
                    </button>
                  </div>
                  {(['above', 'below'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setFiftyTwoWeekDirection(fiftyTwoWeekDirection === dir ? 'none' : dir)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: fiftyTwoWeekDirection === dir ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: fiftyTwoWeekDirection === dir ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setFiftyTwoWeekFilter(prev => Math.max(0, prev - 1))}
                  disabled={fiftyTwoWeekDirection === 'none' || fiftyTwoWeekFilter <= 0}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    cursor: fiftyTwoWeekDirection === 'none' || fiftyTwoWeekFilter <= 0 ? 'not-allowed' : 'pointer',
                    minWidth: '28px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: fiftyTwoWeekDirection === 'none' ? 0.3 : 1
                  }}
                >
                  -
                </button>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={fiftyTwoWeekFilter}
                    onChange={(e) => setFiftyTwoWeekFilter(parseInt(e.target.value))}
                    style={{ 
                      width: '100%',
                      accentColor: 'var(--accent)',
                      height: '4px',
                      borderRadius: '2px',
                      outline: 'none',
                      opacity: fiftyTwoWeekDirection === 'none' ? 0.3 : 1,
                      cursor: fiftyTwoWeekDirection === 'none' ? 'not-allowed' : 'pointer'
                    }}
                    disabled={fiftyTwoWeekDirection === 'none'}
                  />
                  {fiftyTwoWeekDirection !== 'none' && (
                    <div style={{ 
                      position: 'absolute', 
                      left: `${fiftyTwoWeekFilter}%`, 
                      top: '-20px', 
                      transform: 'translateX(-50%)',
                      background: 'var(--accent)',
                      color: 'white',
                      fontSize: '9px',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      {fiftyTwoWeekFilter}%
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setFiftyTwoWeekFilter(prev => Math.min(100, prev + 1))}
                  disabled={fiftyTwoWeekDirection === 'none' || fiftyTwoWeekFilter >= 100}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    cursor: fiftyTwoWeekDirection === 'none' || fiftyTwoWeekFilter >= 100 ? 'not-allowed' : 'pointer',
                    minWidth: '28px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: fiftyTwoWeekDirection === 'none' ? 0.3 : 1
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* P/E Ratio Filter UI */}
            <div style={{ 
              background: 'var(--surface-subtle)', 
              borderRadius: '8px', 
              padding: '10px', 
              border: '1px solid var(--border-color)', 
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>P/E Ratio Filter</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => { setPeFilter(15); if (peDirection === 'none') setPeDirection('below'); }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: peFilter === 15 && peDirection !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: peFilter === 15 && peDirection !== 'none' ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      PE 15
                    </button>
                    <button
                      onClick={() => { setPeFilter(20); if (peDirection === 'none') setPeDirection('below'); }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: peFilter === 20 && peDirection !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: peFilter === 20 && peDirection !== 'none' ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      PE 20
                    </button>
                  </div>
                  {(['above', 'below'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setPeDirection(peDirection === dir ? 'none' : dir)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: peDirection === dir ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: peDirection === dir ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setPeFilter(prev => Math.max(0, prev - 1))}
                  disabled={peDirection === 'none' || peFilter <= 0}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    cursor: peDirection === 'none' || peFilter <= 0 ? 'not-allowed' : 'pointer',
                    minWidth: '28px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: peDirection === 'none' ? 0.3 : 1
                  }}
                >
                  -
                </button>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1"
                    value={peFilter}
                    onChange={(e) => setPeFilter(parseInt(e.target.value))}
                    style={{ 
                      width: '100%',
                      accentColor: 'var(--accent)',
                      height: '4px',
                      borderRadius: '2px',
                      outline: 'none',
                      opacity: peDirection === 'none' ? 0.3 : 1,
                      cursor: peDirection === 'none' ? 'not-allowed' : 'pointer'
                    }}
                    disabled={peDirection === 'none'}
                  />
                  {peDirection !== 'none' && (
                    <div style={{ 
                      position: 'absolute', 
                      left: `${(peFilter / 100) * 100}%`, 
                      top: '-20px', 
                      transform: 'translateX(-50%)',
                      background: 'var(--accent)',
                      color: 'white',
                      fontSize: '9px',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      P/E: {peFilter}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setPeFilter(prev => Math.min(100, prev + 1))}
                  disabled={peDirection === 'none' || peFilter >= 100}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    cursor: peDirection === 'none' || peFilter >= 100 ? 'not-allowed' : 'pointer',
                    minWidth: '28px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: peDirection === 'none' ? 0.3 : 1
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Above Yield % Filter UI */}
            <div style={{ 
              background: 'var(--surface-subtle)', 
              borderRadius: '8px', 
              padding: '10px', 
              border: '1px solid var(--border-color)', 
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Yield % Filter</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => { setYieldFilter(2); if (yieldDirection === 'none') setYieldDirection('above'); }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: yieldFilter === 2 && yieldDirection !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: yieldFilter === 2 && yieldDirection !== 'none' ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Yield 2%
                    </button>
                    <button
                      onClick={() => { setYieldFilter(4); if (yieldDirection === 'none') setYieldDirection('above'); }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: yieldFilter === 4 && yieldDirection !== 'none' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: yieldFilter === 4 && yieldDirection !== 'none' ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Yield 4%
                    </button>
                  </div>
                  {(['above', 'below'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => setYieldDirection(yieldDirection === dir ? 'none' : dir)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: yieldDirection === dir ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: yieldDirection === dir ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setYieldFilter(prev => Math.max(0, parseFloat((prev - 0.5).toFixed(1))))}
                  disabled={yieldDirection === 'none' || yieldFilter <= 0}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    cursor: yieldDirection === 'none' || yieldFilter <= 0 ? 'not-allowed' : 'pointer',
                    minWidth: '28px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: yieldDirection === 'none' ? 0.3 : 1
                  }}
                >
                  -
                </button>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="20" 
                    step="0.1"
                    value={yieldFilter}
                    onChange={(e) => setYieldFilter(parseFloat(e.target.value))}
                    style={{ 
                      width: '100%',
                      accentColor: 'var(--accent)',
                      height: '4px',
                      borderRadius: '2px',
                      outline: 'none',
                      opacity: yieldDirection === 'none' ? 0.3 : 1,
                      cursor: yieldDirection === 'none' ? 'not-allowed' : 'pointer'
                    }}
                    disabled={yieldDirection === 'none'}
                  />
                  {yieldDirection !== 'none' && (
                    <div style={{ 
                      position: 'absolute', 
                      left: `${(yieldFilter / 20) * 100}%`, 
                      top: '-20px', 
                      transform: 'translateX(-50%)',
                      background: 'var(--accent)',
                      color: 'white',
                      fontSize: '9px',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      Yield: {yieldFilter.toFixed(1)}%
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setYieldFilter(prev => Math.min(20, parseFloat((prev + 0.5).toFixed(1))))}
                  disabled={yieldDirection === 'none' || yieldFilter >= 20}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-primary)',
                    cursor: yieldDirection === 'none' || yieldFilter >= 20 ? 'not-allowed' : 'pointer',
                    minWidth: '28px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: yieldDirection === 'none' ? 0.3 : 1
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Volume Ratio Filter UI */}
            <div style={{ 
              background: 'var(--surface-subtle)', 
              borderRadius: '8px', 
              padding: '10px', 
              border: '1px solid var(--border-color)', 
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Volume vs Avg Volume</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {(['none', '2x', '3x', '4x', '5x'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setVolumeFilter(volumeFilter === v ? 'none' : v)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '9px',
                        borderRadius: '4px',
                        background: volumeFilter === v ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: volumeFilter === v ? 'white' : 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {v === 'none' ? 'OFF' : v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {topTickers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', width: '100%', marginBottom: '2px' }}>Frequent:</span>
            {topTickers.map(symbol => (
              <button
                key={symbol}
                onClick={() => setSearchQuery(symbol === searchQuery ? '' : symbol)}
                style={{
                  padding: '2px 8px',
                  fontSize: '10px',
                  borderRadius: '100px',
                  background: searchQuery === symbol ? 'var(--accent)' : 'var(--surface-subtle)',
                  border: `1px solid ${searchQuery === symbol ? 'var(--accent)' : 'var(--border-color)'}`,
                  color: searchQuery === symbol ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {symbol}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1, fontSize: '12px', padding: '8px' }}
            onClick={onOpenAlerts}
          >
            Manage Alerts
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, fontSize: '12px', padding: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={() => {
              const symbols = Array.from(new Set(filteredNotifications.map(n => n.symbol)));
              onOpenTableWithSymbols(symbols);
            }}
            disabled={filteredNotifications.length === 0}
            title="Open these stocks in the market overview table"
          >
            <Table size={14} /> Open in Table
          </button>
          <button 
            className="btn" 
            style={{ flex: 1, fontSize: '12px', padding: '8px', border: '1px solid var(--border-color)' }}
            onClick={() => {
              const isFiltered = filteredNotifications.length !== notifications.length;
              const count = isFiltered ? filteredNotifications.length : notifications.length;
              const word = isFiltered ? 'the filtered' : 'all';
              if (window.confirm(`Are you sure you want to clear ${word} ${count} notifications?`)) {
                if (isFiltered) {
                  onClear(filteredNotifications.map(n => n.id));
                } else {
                  onClear();
                }
              }
            }}
            disabled={filteredNotifications.length === 0}
          >
            {filteredNotifications.length !== notifications.length ? 'Clear' : 'Clear All'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {filteredNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <Bell size={40} opacity={0.1} style={{ marginBottom: '16px' }} />
              <p>{notifications.length === 0 ? 'No notifications yet.' : 'No matching notifications.'}</p>
              {notifications.length === 0 && <p style={{ fontSize: '12px', marginTop: '8px' }}>Set up price alerts to stay updated.</p>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredNotifications.map(n => {
                  const isAbove = n.message.includes('ABOVE');
                  const isBelow = n.message.includes('BELOW');
                  
                  return (
                    <div 
                      key={n.id} 
                      onClick={() => {
                        const ticker = allTickers.find(t => t.symbol === n.symbol);
                        onSelectTicker(ticker || { 
                          id: n.symbol, 
                          symbol: n.symbol, 
                          name: n.symbol, 
                          stats: { price: '0', change: '0', changePercent: '0', volume: '0', marketCap: '0' } 
                        } as any);
                        onClose();
                      }}
                      style={{ 
                        padding: '12px', 
                        background: n.isRead ? 'var(--surface-subtle)' : 'rgba(99, 102, 241, 0.1)', 
                        border: `1px solid ${n.isRead ? 'var(--border-color)' : 'rgba(99, 102, 241, 0.3)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, background 0.2s',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                      }}
                      className="notification-card"
                    >
                      <div style={{ 
                        padding: '8px', 
                        borderRadius: '8px', 
                        background: isAbove ? 'rgba(16, 185, 129, 0.1)' : isBelow ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                        color: isAbove ? '#10b981' : isBelow ? '#ef4444' : 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isAbove ? <TrendingUp size={16} /> : isBelow ? <TrendingDown size={16} /> : <AlertCircle size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.symbol}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={10} />
                            {new Date(n.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {n.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        <style>{`
          .notification-card:hover {
            background: var(--surface-hover) !important;
            transform: translateY(-2px);
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
};
