import yfinance as yf
import pandas as pd
import json
import datetime

def debug_ticker(symbol):
    ticker = yf.Ticker(symbol)
    print(f"--- Debugging {symbol} ---")
    
    print("\n[Calendar]")
    try:
        cal = ticker.calendar
        print(f"Type: {type(cal)}")
        print(f"Content: {cal}")
    except Exception as e:
        print(f"Calendar error: {e}")
        
    print("\n[Info Keys (First 20)]")
    try:
        info = ticker.info
        keys = list(info.keys())
        for k in keys:
            if 'earnings' in k.lower() or 'date' in k.lower():
                val = info[k]
                if 'timestamp' in k.lower() and isinstance(val, (int, float)):
                    dt_utc = datetime.datetime.fromtimestamp(val, datetime.timezone.utc)
                    print(f"{k}: {val} -> {dt_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")
                else:
                    print(f"{k}: {val}")
    except Exception as e:
        print(f"Info error: {e}")

if __name__ == "__main__":
    debug_ticker("AAPL")
    debug_ticker("MSFT")
    debug_ticker("TSLA")
    debug_ticker("JPM")
    debug_ticker("PEP")


