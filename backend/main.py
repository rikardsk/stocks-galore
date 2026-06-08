from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
import math
from typing import List, Dict, Any
import uvicorn
import datetime

app = FastAPI(title="Stocks Galore Backend")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def safe_float(val: Any) -> Any:
    """Ensure value is a safe standard Python float, and convert NaN/Inf to None."""
    if val is None or pd.isna(val):
        return None
    try:
        val = float(val)
        if math.isnan(val) or math.isinf(val):
            return None
        return round(val, 2)
    except (ValueError, TypeError):
        return None

def calculate_stats(symbol: str, info: Dict, hist: pd.DataFrame) -> Dict[str, Any]:
    """Helper to calculate technical indicators and clean up info."""
    if hist.empty:
        return {}
        
    hist = hist.dropna(subset=['Close'])
    if hist.empty:
        return {}

    current_price = safe_float(hist['Close'].iloc[-1])
    if current_price is None:
        return {} # Invalid data

    prev_close = safe_float(hist['Close'].iloc[-2] if len(hist) > 1 else current_price)
    if prev_close is None:
        prev_close = current_price

    change = safe_float(current_price - prev_close)
    change_percent = safe_float((change / prev_close) * 100) if prev_close != 0 and change is None else safe_float((current_price - prev_close) / prev_close * 100) if prev_close != 0 else 0

    # Moving Averages
    sma10_series = hist['Close'].rolling(window=10).mean()
    sma20_series = hist['Close'].rolling(window=20).mean()
    sma50_series = hist['Close'].rolling(window=50).mean()
    sma100_series = hist['Close'].rolling(window=100).mean()
    sma200_series = hist['Close'].rolling(window=200).mean()

    sma10 = safe_float(sma10_series.iloc[-1]) if len(sma10_series) >= 1 else None
    sma20 = safe_float(sma20_series.iloc[-1]) if len(sma20_series) >= 1 else None
    sma50 = safe_float(sma50_series.iloc[-1]) if len(sma50_series) >= 1 else None
    sma100 = safe_float(sma100_series.iloc[-1]) if len(sma100_series) >= 1 else None
    sma200 = safe_float(sma200_series.iloc[-1]) if len(sma200_series) >= 1 else None

    # Check for SMA crossovers
    crossover_sma10_above = False
    crossover_sma10_below = False
    crossover_sma20_above = False
    crossover_sma20_below = False
    crossover_sma50_above = False
    crossover_sma50_below = False
    crossover_sma100_above = False
    crossover_sma100_below = False
    crossover_sma200_above = False
    crossover_sma200_below = False
    crossover_sma20_sma50 = False
    crossover_sma50_sma200 = False

    if len(hist) > 1:
        # Helper for price crossovers
        def get_price_crossover(series):
            if len(series) < 2:
                return False, False
            s_prev = safe_float(series.iloc[-2])
            s_curr = safe_float(series.iloc[-1])
            if s_prev is None or s_curr is None or prev_close is None or current_price is None:
                return False, False
            above = (prev_close < s_prev) and (current_price > s_curr)
            below = (prev_close > s_prev) and (current_price < s_curr)
            return above, below

        crossover_sma10_above, crossover_sma10_below = get_price_crossover(sma10_series)
        crossover_sma20_above, crossover_sma20_below = get_price_crossover(sma20_series)
        crossover_sma50_above, crossover_sma50_below = get_price_crossover(sma50_series)
        crossover_sma100_above, crossover_sma100_below = get_price_crossover(sma100_series)
        crossover_sma200_above, crossover_sma200_below = get_price_crossover(sma200_series)

        sma20_yesterday = safe_float(sma20_series.iloc[-2])
        sma50_yesterday = safe_float(sma50_series.iloc[-2])
        sma200_yesterday = safe_float(sma200_series.iloc[-2])

        if sma20 is not None and sma50 is not None and sma20_yesterday is not None and sma50_yesterday is not None:
            crossover_sma20_sma50 = (sma20_yesterday < sma50_yesterday) and (sma20 > sma50)

        if sma50 is not None and sma200 is not None and sma50_yesterday is not None and sma200_yesterday is not None:
            crossover_sma50_sma200 = (sma50_yesterday < sma200_yesterday) and (sma50 > sma200)

    # Performance
    def get_perf(days):
        if len(hist) > days:
            past_price = hist['Close'].iloc[-days]
        elif len(hist) > max(1, int(days * 0.9)):
            # Close enough to target — use earliest available data point
            past_price = hist['Close'].iloc[0]
        else:
            return 0
        past_price = safe_float(past_price)
        if not past_price:
            return 0
        return safe_float(((current_price - past_price) / past_price) * 100) or 0

    # Sparkline (last 30 days)
    sparkline_data = [safe_float(p) for p in hist['Close'].tail(30).tolist()]
    sparkline_data = [p for p in sparkline_data if p is not None]

    return {
        "symbol": symbol,
        "name": info.get('longName') or info.get('shortName') or symbol,
        "price": current_price,
        "change": change or 0,
        "changePercent": f"{change_percent:+.2f}%" if change_percent is not None else "0.00%",
        "volume": f"{info.get('volume', 0) / 1e6:.1f}M" if info.get('volume') else "N/A",
        "marketCap": (
            f"{info.get('marketCap') / 1e12:.2f}T" if info.get('marketCap', 0) >= 1e12 else
            f"{info.get('marketCap') / 1e9:.1f}B" if info.get('marketCap', 0) >= 1e9 else
            f"{info.get('marketCap') / 1e6:.0f}M" if info.get('marketCap', 0) > 0 else "N/A"
        ) if info.get('marketCap') else "N/A",
        "sector": info.get('sector', 'N/A'),
        "dividendYield": safe_float(info.get('dividendYield', 0)) if info.get('dividendYield') else 0,
        "sma10": sma10,
        "sma20": sma20,
        "sma50": sma50,
        "sma100": sma100,
        "sma200": sma200,
        "crossover_sma10_above": crossover_sma10_above,
        "crossover_sma10_below": crossover_sma10_below,
        "crossover_sma20_above": crossover_sma20_above,
        "crossover_sma20_below": crossover_sma20_below,
        "crossover_sma50_above": crossover_sma50_above,
        "crossover_sma50_below": crossover_sma50_below,
        "crossover_sma100_above": crossover_sma100_above,
        "crossover_sma100_below": crossover_sma100_below,
        "crossover_sma200_above": crossover_sma200_above,
        "crossover_sma200_below": crossover_sma200_below,
        "crossover_sma20_sma50": crossover_sma20_sma50,
        "crossover_sma50_sma200": crossover_sma50_sma200,
        "perf1M": get_perf(21), # ~21 trading days
        "perf3M": get_perf(63),
        "perf1Y": get_perf(252),
        "sparkline": sparkline_data,
        "description": info.get('longBusinessSummary') or "No description available.",
        "pe": safe_float(info.get('trailingPE')),
        "high52": safe_float(info.get('fiftyTwoWeekHigh')),
        "low52": safe_float(info.get('fiftyTwoWeekLow')),
        "avgVolume": f"{info.get('averageVolume', 0) / 1e6:.1f}M" if info.get('averageVolume') else "N/A",
        "ipoDate": "N/A"  # filled in by caller
    }

def get_ipo_date(symbol: str, info: Dict) -> str:
    """Try multiple yfinance fields to find the IPO / first-trade date."""
    # 1. firstTradeDateEpochUtc (epoch seconds, most common)
    try:
        ts = info.get('firstTradeDateEpochUtc')
        if ts and ts > 0:
            return datetime.datetime.fromtimestamp(ts, datetime.UTC).strftime('%Y-%m-%d')
    except Exception:
        pass

    # 2. firstTradeDateMilliseconds (epoch ms)
    try:
        ts_ms = info.get('firstTradeDateMilliseconds')
        if ts_ms and ts_ms > 0:
            return datetime.datetime.fromtimestamp(ts_ms / 1000, datetime.UTC).strftime('%Y-%m-%d')
    except Exception:
        pass

    # 3. ipoDate as a direct string (e.g. '2004-08-19')
    try:
        raw = info.get('ipoDate')
        if raw and isinstance(raw, str) and len(raw) >= 10:
            return raw[:10]
    except Exception:
        pass

    # 4. fundInceptionDate (ETFs / funds, stored as epoch seconds)
    try:
        ts = info.get('fundInceptionDate')
        if ts and ts > 0:
            return datetime.datetime.fromtimestamp(ts, datetime.UTC).strftime('%Y-%m-%d')
    except Exception:
        pass

    print(f"[ipo] No IPO date found for {symbol}")
    return "N/A"

def get_earnings_date(ticker: yf.Ticker, info: Dict) -> str:
    """Attempt to get next earnings date."""
    
    # 1. Try info.earningsTimestamp (most reliable for some tickers)
    try:
        ts = info.get('earningsTimestamp')
        if ts:
            return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d')
    except:
        pass

    # 2. Try ticker.calendar
    try:
        cal = ticker.calendar
        if cal is not None:
            if isinstance(cal, dict) and 'Earnings Date' in cal:
                dates = cal['Earnings Date']
                if dates and len(dates) > 0:
                    # The first date in the list is usually the next one
                    d = dates[0]
                    if hasattr(d, 'strftime'):
                        return d.strftime('%Y-%m-%d')
                    return str(d)
            elif isinstance(cal, pd.DataFrame) and not cal.empty:
                if 'Earnings Date' in cal.index:
                    val = cal.loc['Earnings Date'].iloc[0]
                    if hasattr(val, 'strftime'):
                        return val.strftime('%Y-%m-%d')
                    return str(val)
    except Exception as e:
        print(f"Earnings date error for {ticker.ticker}: {e}")
        
    return "N/A"

@app.get("/stock/{symbol}")
async def get_stock(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period="1y")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock not found")
            
        stats = calculate_stats(symbol, info, hist)
        if stats:
            stats['earningsDate'] = get_earnings_date(ticker, info)
            stats['ipoDate'] = get_ipo_date(symbol, info)
        return stats
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stock/{symbol}/history")
async def get_stock_history(symbol: str, period: str = "1y"):
    try:
        ticker = yf.Ticker(symbol)
        # Use valid yfinance periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        hist = ticker.history(period=period)
        
        if hist.empty:
            return []
            
        # Clean up data for frontend
        hist = hist.reset_index()
        data = []
        for _, row in hist.iterrows():
            data.append({
                "date": row['Date'].strftime('%Y-%m-%d') if 'Date' in row else row['Datetime'].strftime('%H:%M'),
                "price": safe_float(row['Close']),
                "open": safe_float(row['Open']),
                "high": safe_float(row['High']),
                "low": safe_float(row['Low']),
                "volume": int(row['Volume']) if not pd.isna(row['Volume']) else 0
            })
        return data
    except Exception as e:
        print(f"Error fetching history for {symbol}: {e}")
        return []

@app.get("/search")
async def search_ticker(query: str):
    import requests
    try:
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}"
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        response = requests.get(url, headers=headers)
        if response.ok:
            data = response.json()
            quotes = data.get('quotes', [])
            print(f"[search] Query '{query}' returned {len(quotes)} quotes")
            return [
                {
                    "symbol": q['symbol'], 
                    "name": q.get('longname') or q.get('shortname') or q['symbol'], 
                    "exchange": q.get('exchange'),
                    "type": q.get('quoteType')
                } for q in quotes if q.get('quoteType') in ['EQUITY', 'ETF', 'MUTUALFUND', 'INDEX']
            ]
        return []
    except Exception as e:
        print(f"Search error: {e}")
        return []

@app.get("/batch")
async def get_batch(symbols: str = Query(..., description="Comma-separated symbols")):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        return []

    # Bulk download all histories in a single request (much faster than individual calls)
    try:
        all_hist = yf.download(symbol_list, period="1y", group_by="ticker", threads=True)
    except Exception as e:
        print(f"[batch] Bulk download failed: {e}")
        all_hist = pd.DataFrame()

    results = []
    for symbol in symbol_list:
        try:
            # Extract per-symbol history from the bulk download
            if all_hist.empty:
                print(f"[batch] No history for {symbol}, skipping")
                continue
                
            # yfinance with group_by="ticker" returns a MultiIndex even for a single symbol
            # check the columns structure to safely extract the specific ticker's history
            if isinstance(all_hist.columns, pd.MultiIndex):
                if symbol in all_hist.columns.get_level_values(0):
                    hist = all_hist[symbol].dropna(how="all")
                else:
                    hist = pd.DataFrame()
            else:
                # Fallback if somehow it isn't multiindex
                hist = all_hist.dropna(how="all") if len(symbol_list) == 1 else pd.DataFrame()

            if hist.empty:
                print(f"[batch] No history for {symbol}, skipping")
                continue

            # Fetch info individually (needed for name, sector, marketCap, volume)
            ticker = yf.Ticker(symbol)
            info = ticker.info
            stats = calculate_stats(symbol, info, hist)
            if stats:
                stats['earningsDate'] = get_earnings_date(ticker, info)
                stats['ipoDate'] = get_ipo_date(symbol, info)
            results.append(stats)
        except Exception as e:
            print(f"[batch] Error processing {symbol}: {e}")
            continue

    return results

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

