import React, { useState } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { StockAlert, Ticker } from '../types';
import { formatPrice } from '../types';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: StockAlert[];
  tickers: Ticker[];
  onAddAlert: (alert: Omit<StockAlert, 'id' | 'isTriggered'>) => void;
  onDeleteAlert: (id: string) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  tickers,
  onAddAlert,
  onDeleteAlert
}) => {
  const [symbol, setSymbol] = useState('');
  const [metric, setMetric] = useState<'price' | 'changePercent'>('price');
  const [operator, setOperator] = useState<'above' | 'below'>('above');
  const [value, setValue] = useState('');

  const handleAdd = () => {
    if (!symbol || !value) return;
    onAddAlert({
      symbol: symbol.toUpperCase(),
      metric,
      operator,
      value: parseFloat(value),
    });
    setSymbol('');
    setValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 2100 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} color="#f59e0b" />
            <h3 style={{ margin: 0 }}>Price Alerts</h3>
          </div>
          <button className="btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="input-group" style={{ background: 'var(--surface-subtle)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input 
              type="text" 
              placeholder="Ticker (AAPL)" 
              value={symbol} 
              onChange={e => setSymbol(e.target.value)}
              style={{ flex: 1 }}
            />
            <select value={metric} onChange={e => setMetric(e.target.value as any)} style={{ flex: 1 }}>
              <option value="price">Price</option>
              <option value="changePercent">Change %</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={operator} onChange={e => setOperator(e.target.value as any)} style={{ flex: 1 }}>
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <input 
              type="number" 
              placeholder="Value" 
              value={value} 
              onChange={e => setValue(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handleAdd} style={{ padding: '12px' }}>
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div style={{ marginTop: '24px', maxHeight: '300px', overflowY: 'auto' }}>
          <label style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>
            Active Alerts ({alerts.length})
          </label>
          
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No active alerts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map(alert => {
                const ticker = tickers.find(t => t.symbol.toUpperCase() === alert.symbol.toUpperCase());
                return (
                  <div 
                    key={alert.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '10px 12px', 
                      background: 'var(--surface-subtle)', 
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ fontSize: '14px' }}>
                      <span style={{ fontWeight: 700 }}>{alert.symbol}</span>
                      <span style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>
                        {alert.metric === 'price' ? 'Price' : 'Change'} {alert.operator}
                      </span>
                      <span style={{ fontWeight: 600 }}>
                        {alert.metric === 'price' 
                          ? formatPrice(alert.value, ticker?.stats.currency) 
                          : `${alert.value}%`}
                      </span>
                    </div>
                    <button className="btn" onClick={() => onDeleteAlert(alert.id)}>
                      <Trash2 size={14} opacity={0.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
