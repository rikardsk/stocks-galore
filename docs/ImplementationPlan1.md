# Integrated FastAPI Backend & Global Refresh

Implement a Python backend using FastAPI and `yfinance` to serve real-time stock data and technical indicators. Add a global refresh button to the workbench toolbar to update all tickers.

## User Review Required

> [!IMPORTANT]
> - This requires **Python 3.14.4** (which you have) and installing dependencies: `fastapi`, `uvicorn`, `yfinance`, `pandas`.
> - The application will now require both the Vite dev server and the Python server to be running simultaneously.

## Proposed Changes

### Backend (Python)

#### [NEW] [requirements.txt](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/backend/requirements.txt)
- Define dependencies: `fastapi`, `uvicorn`, `yfinance`, `pandas`.

#### [NEW] [main.py](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/backend/main.py)
- Setup FastAPI with CORS.
- Endpoint `/stock/{symbol}` to return:
    - Current Price, Change, Market Cap.
    - SMAs (20, 50, 200).
    - Performance metrics (1M, 3M, 1Y).

---

### Frontend (React/TypeScript)

#### [MODIFY] [Toolbar.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/components/Toolbar.tsx)
- Add a `RefreshCw` icon button to the toolbar.
- Hook it up to a new `onRefreshAll` prop.

#### [MODIFY] [App.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/App.tsx)
- Implement `handleRefreshAll`.
- Use `fetch` to call the Python backend for each ticker.
- Efficiently update the state to reflect new data.

#### [MODIFY] [ListPanel.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/components/ListPanel.tsx)
- Enhance the ticker display to show SMAs and other data returned by the backend.

## Open Questions

- Should I implement a **batch endpoint** in the backend (e.g., `/stocks?symbols=AAPL,MSFT,TSLA`) to speed up the "Refresh All" operation? (Recommended for performance).

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
1. Start backend: `uvicorn main:app --reload` in `/backend`.
2. Start frontend: `npm run dev`.
3. Add a ticker (e.g., AAPL).
4. Click "Refresh" in the toolbar.
5. Verify ticker stats update from mock values to real-time `yfinance` data.
