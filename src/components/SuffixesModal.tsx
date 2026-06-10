import React, { useState, useMemo } from 'react';
import { X, Search, Globe, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface ExchangeSuffix {
  suffix: string;
  country: string;
  exchange: string;
}

interface SuffixesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SUFFIXES_DATA: ExchangeSuffix[] = [
  { suffix: '.AX', country: 'Australia', exchange: 'Australian Securities Exchange (ASX)' },
  { suffix: '.AS', country: 'Netherlands', exchange: 'Amsterdam (Euronext Amsterdam)' },
  { suffix: '.BA', country: 'Argentina', exchange: 'Buenos Aires (BYMA)' },
  { suffix: '.BE', country: 'Germany', exchange: 'Berlin' },
  { suffix: '.BE', country: 'Belgium', exchange: 'Brussels (Euronext Brussels)' },
  { suffix: '.BK', country: 'Thailand', exchange: 'Bangkok Stock Exchange' },
  { suffix: '.BM', country: 'Germany', exchange: 'Bremen' },
  { suffix: '.BO', country: 'India', exchange: 'Bombay Stock Exchange (BSE)' },
  { suffix: '.BR', country: 'Belgium', exchange: 'Brussels (Euronext Brussels)' },
  { suffix: '.CA', country: 'Egypt', exchange: 'Cairo Stock Exchange' },
  { suffix: '.CO', country: 'Denmark', exchange: 'Copenhagen ( Nasdaq Copenhagen)' },
  { suffix: '.DE', country: 'Germany', exchange: 'Xetra (Frankfurt)' },
  { suffix: '.DU', country: 'Germany', exchange: 'Düsseldorf' },
  { suffix: '.F', country: 'Germany', exchange: 'Frankfurt Stock Exchange' },
  { suffix: '.HE', country: 'Finland', exchange: 'Helsinki (Euronext Helsinki)' },
  { suffix: '.HK', country: 'Hong Kong', exchange: 'Hong Kong Stock Exchange (HKEX)' },
  { suffix: '.HA', country: 'Germany', exchange: 'Hanover' },
  { suffix: '.JK', country: 'Indonesia', exchange: 'Jakarta Stock Exchange (IDX)' },
  { suffix: '.KQ', country: 'South Korea', exchange: 'KOSDAQ' },
  { suffix: '.KS', country: 'South Korea', exchange: 'Korea Stock Exchange (KRX)' },
  { suffix: '.L', country: 'United Kingdom', exchange: 'London Stock Exchange (LSE)' },
  { suffix: '.IL', country: 'United Kingdom', exchange: 'London International Order Book (IOB)' },
  { suffix: '.KL', country: 'Malaysia', exchange: 'Kuala Lumpur (Bursa Malaysia)' },
  { suffix: '.MC', country: 'Spain', exchange: 'Madrid (Bolsas y Mercados Españoles)' },
  { suffix: '.ME', country: 'Russia', exchange: 'Moscow Exchange (MOEX)' },
  { suffix: '.MI', country: 'Italy', exchange: 'Milan (Borsa Italiana)' },
  { suffix: '.MX', country: 'Mexico', exchange: 'Mexico Stock Exchange (BMV)' },
  { suffix: '.NZ', country: 'New Zealand', exchange: 'New Zealand Exchange (NZX)' },
  { suffix: '.OL', country: 'Norway', exchange: 'Oslo Stock Exchange' },
  { suffix: '.PA', country: 'France', exchange: 'Paris (Euronext Paris)' },
  { suffix: '.QS', country: 'Qatar', exchange: 'Qatar Stock Exchange' },
  { suffix: '.SA', country: 'Brazil', exchange: 'São Paulo (B3)' },
  { suffix: '.SG', country: 'Germany', exchange: 'Stuttgart' },
  { suffix: '.SI', country: 'Singapore', exchange: 'Singapore Exchange (SGX)' },
  { suffix: '.ST', country: 'Sweden', exchange: 'Stockholm (Nasdaq Stockholm)' },
  { suffix: '.SS', country: 'China', exchange: 'Shanghai Stock Exchange' },
  { suffix: '.SZ', country: 'China', exchange: 'Shenzhen Stock Exchange' },
  { suffix: '.SW', country: 'Switzerland', exchange: 'SIX Swiss Exchange' },
  { suffix: '.T', country: 'Japan', exchange: 'Tokyo Stock Exchange (TSE)' },
  { suffix: '.TA', country: 'Israel', exchange: 'Tel Aviv Stock Exchange' },
  { suffix: '.TO', country: 'Canada', exchange: 'Toronto Stock Exchange (TSX)' },
  { suffix: '.TWO', country: 'Taiwan', exchange: 'Taiwan OTC Exchange' },
  { suffix: '.TW', country: 'Taiwan', exchange: 'Taiwan Stock Exchange (TWSE)' },
  { suffix: '.VI', country: 'Austria', exchange: 'Vienna Stock Exchange' },
  { suffix: '.V', country: 'Canada', exchange: 'TSX Venture Exchange' },
  { suffix: '.JP', country: 'Japan', exchange: 'Japan (various exchanges, mainly TSE)' },
  { suffix: '.NS', country: 'India', exchange: 'National Stock Exchange of India (NSE)' },
  { suffix: '.IS', country: 'Turkey', exchange: 'Borsa Istanbul' },
  { suffix: '.JO', country: 'South Africa', exchange: 'Johannesburg Stock Exchange (JSE)' },
];

type SortKey = 'suffix' | 'country' | 'exchange';
type SortDirection = 'asc' | 'desc';

export const SuffixesModal: React.FC<SuffixesModalProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('suffix');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = SUFFIXES_DATA;

    if (query) {
      result = SUFFIXES_DATA.filter(
        item =>
          item.suffix.toLowerCase().includes(query) ||
          item.country.toLowerCase().includes(query) ||
          item.exchange.toLowerCase().includes(query)
      );
    }

    return [...result].sort((a, b) => {
      const valA = a[sortKey].toLowerCase();
      const valB = b[sortKey].toLowerCase();
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchQuery, sortKey, sortDirection]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2150 }}>
      <div 
        className="modal" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          width: '680px', 
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={22} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>World Exchange Suffixes</h3>
          </div>
          <button className="btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '16px', flexShrink: 0 }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: 'var(--text-secondary)' }}>
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search by suffix, country, or exchange..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 40px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--surface-input)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Table Container */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-inset)' }}>
          {filteredAndSortedData.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No exchanges match your search.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-modal)', zIndex: 1, boxShadow: '0 1px 0 var(--border-color)' }}>
                <tr>
                  <th 
                    onClick={() => handleSort('suffix')}
                    style={{ 
                      padding: '12px 16px', 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      color: sortKey === 'suffix' ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      width: '20%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Suffix
                      {sortKey === 'suffix' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} opacity={0.4} />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('country')}
                    style={{ 
                      padding: '12px 16px', 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      color: sortKey === 'country' ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      width: '30%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Country/Region
                      {sortKey === 'country' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} opacity={0.4} />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('exchange')}
                    style={{ 
                      padding: '12px 16px', 
                      cursor: 'pointer', 
                      userSelect: 'none',
                      color: sortKey === 'exchange' ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: 600,
                      width: '50%'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Exchange / Market
                      {sortKey === 'exchange' ? (
                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                      ) : (
                        <ArrowUpDown size={14} opacity={0.4} />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedData.map((item, index) => (
                  <tr 
                    key={index} 
                    style={{ 
                      borderBottom: '1px solid var(--surface-divider)',
                      background: index % 2 === 0 ? 'transparent' : 'var(--surface-subtle)',
                      transition: 'background-color 0.15s ease'
                    }}
                    className="table-row"
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--accent)' }}>
                      {item.suffix}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      {item.country}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {item.exchange}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
