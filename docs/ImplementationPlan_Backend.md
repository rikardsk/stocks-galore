# Integrated FastAPI Backend for Stock Data

Implement a Python backend using FastAPI and `yfinance` to serve real-time and historical stock data to the React workbench.

## User Review Required

> [!IMPORTANT]
> You will need to have Python installed on your system. 
> I will provide the commands to install the necessary libraries (`fastapi`, `uvicorn`, `yfinance`, `pandas`).

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

### [Frontend - Next Step]
*(Note: I will first build the backend, then we will refine the React components to display this new data).*

## Open Questions

- Should I provide a sample script to run the backend and frontend simultaneously?
- Would you like a "Refresh" button on each list, or should it fetch automatically on load?

## Verification Plan

### Automated Tests
- N/A (Manual verification of API responses).

### Manual Verification
- Run the FastAPI server (`uvicorn main:app --reload`).
- Visit `http://localhost:8000/stock/AAPL` in the browser.
- Verify that all requested fields (Price, Sector, SMA, Gains) are present and correct in the JSON response.
