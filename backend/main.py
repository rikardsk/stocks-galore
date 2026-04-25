from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
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

def calculate_stats(symbol: str, info: Dict, hist: pd.DataFrame) -> Dict[str, Any]:
    """Helper to calculate technical indicators and clean up info."""
    if hist.empty:
        return {}

    current_price = hist['Close'].iloc[-1]
    prev_close = hist['Close'].iloc[-2] if len(hist) > 1 else current_price
    change = current_price - prev_close
    change_percent = (change / prev_close) * 100 if prev_close != 0 else 0

    # Moving Averages
    sma20 = hist['Close'].rolling(window=20).mean().iloc[-1]
    sma50 = hist['Close'].rolling(window=50).mean().iloc[-1]
    sma200 = hist['Close'].rolling(window=200).mean().iloc[-1]

    # Performance
    def get_perf(days):
        if len(hist) >= days:
            past_price = hist['Close'].iloc[-days]
            return ((current_price - past_price) / past_price) * 100
        return 0

    return {
        "symbol": symbol,
        "name": info.get('longName', symbol),
        "price": round(current_price, 2),
        "change": round(change, 2),
        "changePercent": f"{change_percent:+.2f}%",
        "volume": f"{info.get('volume', 0) / 1e6:.1f}M" if info.get('volume') else "N/A",
        "marketCap": f"{info.get('marketCap', 0) / 1e12:.2f}T" if info.get('marketCap') else "N/A",
        "sector": info.get('sector', 'N/A'),
        "sma20": round(sma20, 2) if not pd.isna(sma20) else None,
        "sma50": round(sma50, 2) if not pd.isna(sma50) else None,
        "sma200": round(sma200, 2) if not pd.isna(sma200) else None,
        "perf1M": round(get_perf(21), 2), # ~21 trading days
        "perf3M": round(get_perf(63), 2),
        "perf1Y": round(get_perf(252), 2),
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/batch")
async def get_batch(symbols: str = Query(..., description="Comma-separated symbols")):
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if not symbol_list:
        return []

    results = []
    # Using a loop here for simplicity and to get full 'info' which yf.download skips
    for symbol in symbol_list:
        try:
            ticker = yf.Ticker(symbol)
            # Fetching info and history in separate calls can be slow, 
            # but yfinance is the most accessible for this.
            info = ticker.info
            hist = ticker.history(period="1y")
            if not hist.empty:
                results.append(calculate_stats(symbol, info, hist))
        except:
            continue
            
    return results

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
