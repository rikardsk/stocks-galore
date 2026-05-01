from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
import math
from typing import List, Dict, Any
import uvicorn

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
    sma10 = safe_float(hist['Close'].rolling(window=10).mean().iloc[-1])
    sma20 = safe_float(hist['Close'].rolling(window=20).mean().iloc[-1])
    sma50 = safe_float(hist['Close'].rolling(window=50).mean().iloc[-1])
    sma100 = safe_float(hist['Close'].rolling(window=100).mean().iloc[-1])
    sma200 = safe_float(hist['Close'].rolling(window=200).mean().iloc[-1])

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
        "perf1M": get_perf(21), # ~21 trading days
        "perf3M": get_perf(63),
        "perf1Y": get_perf(252),
        "sparkline": sparkline_data
    }

@app.get("/stock/{symbol}")
async def get_stock(symbol: str):
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period="1y")
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="Stock not found")
            
        return calculate_stats(symbol, info, hist)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
            results.append(calculate_stats(symbol, info, hist))
        except Exception as e:
            print(f"[batch] Error processing {symbol}: {e}")
            continue

    return results

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

