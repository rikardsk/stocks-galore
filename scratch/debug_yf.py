import yfinance as yf
import pandas as pd
import json

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
        print(keys[:20])
        for k in keys:
            if 'earnings' in k.lower() or 'date' in k.lower():
                print(f"{k}: {info[k]}")
    except Exception as e:
        print(f"Info error: {e}")

if __name__ == "__main__":
    debug_ticker("AAPL")
    debug_ticker("MSFT")
    debug_ticker("TSLA")
