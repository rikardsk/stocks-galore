# Integrated FastAPI Backend for Stock Data

Implement a Python backend using FastAPI and `yfinance` to serve real-time and historical stock data to the React workbench.

## User Review Required

> [!IMPORTANT]
> - You will need to have Python installed on your system (Python 3.14.4 detected). 
> - I will provide the commands to install the necessary libraries (`fastapi`, `uvicorn`, `yfinance`, `pandas`).

## Proposed Changes

### [Backend]

#### [NEW] [requirements.txt](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/backend/requirements.txt)
- Define dependencies: `fastapi`, `uvicorn`, `yfinance`, `pandas`.

#### [NEW] [main.py](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/backend/main.py)
- Setup FastAPI app with CORS middleware.
- Create `@app.get("/stock/{symbol}")` endpoint.
- Logic to fetch:
    - Current Info: Sector, Market Cap, Volume, Avg Volume.
    - Historical Data: Calculate 1M, 3M, 1Y, 5Y performance.
    - Moving Averages: Calculate SMA20, SMA50, SMA200 using Pandas.

### [Frontend]

#### [MODIFY] [Toolbar.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/components/Toolbar.tsx)
- Add a **Refresh** button (using `RefreshCw` icon) to the floating toolbar.
- This button will trigger a global update for all active tickers in the workbench.

#### [MODIFY] [App.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/App.tsx)
- Implement global refresh logic that pulls data from the Python backend for all tickers.

## Open Questions

- **Batch Requests**: Should we implement a batch endpoint (e.g., `/stocks?symbols=AAPL,MSFT`) to make the global refresh faster?
- **Auto-Refresh**: Would you also like the data to refresh automatically every X minutes?

## Verification Plan

### Automated Tests
- N/A (Manual verification of API responses).

### Manual Verification
1. Run the FastAPI server (`uvicorn main:app --reload`).
2. Visit `http://localhost:8000/stock/AAPL` in the browser.
3. Use the **Refresh** button in the workbench and verify that ticker stats change from mock values to real data.
