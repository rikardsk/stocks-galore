# Product Requirements Document (PRD) - Stocks Galore

## 1. Overview
Stocks Galore is a personal stock market analysis workbench designed for traders and investors who need a highly customizable, visual way to organize and monitor their portfolio and watchlists. Unlike traditional static dashboards, Stocks Galore provides a "canvas-based" experience where data panels can be freely arranged and categorized.

## 2. Target Audience
- Individual stock traders and investors.
- Users who monitor multiple lists of stocks across different sectors or strategies.
- Technical analysts looking for quick visualization of SMA distances and performance metrics.

## 3. Core Features
### 3.1 Visual Workbench
- **Draggable Panels**: Users can move stock list panels anywhere on a large virtual canvas.
- **Collapsible Lists**: Panels can be collapsed to save space or expanded to see detailed stats.
- **Categorization**: Ability to group stock lists into collapsible folders in the sidebar.

### 3.2 Data & Technical Analysis
- **Real-time Stats**: Fetching current price, change %, market cap, volume, and sector.
- **Technical Indicators**: Automatic calculation of 10, 20, 50, 100, and 200-day Simple Moving Averages (SMAs).
- **Distance Analysis**: Visual indication of how far a stock is currently trading from its key SMAs.
- **Performance Tracking**: Period performance for 1-month, 3-months, and 1-year intervals.
- **Crossover Detection**: Real-time detection of price crossing above key moving averages.

### 3.3 Organization & Workflow
- **Bulk Add**: Add multiple tickers at once using comma-separated strings.
- **Drag-and-Drop Interaction**: Move or copy (Ctrl + Drag) tickers between different lists.
- **Sidebar Navigation**: Centralized control for toggling list visibility and managing groups.
- **Market Overview Table**: A comprehensive, sortable table view of all unique tickers in the workbench.

### 3.4 Alerts & Notifications
- **Price Alerts**: Set "Above" or "Below" thresholds for specific stock prices.
- **Notifications Modal**: Centralized view of triggered alerts and technical crossovers.
- **Visual Badges**: Unread notification counts on the toolbar icon.

### 3.5 Filtering & Search
- **Global Search**: Highlight lists containing specific symbols across the workbench.
- **Dynamic Filtering**: Global filters for price, market cap, and sectors, plus advanced rules for technical metrics (e.g., "Yield > 3%").

## 4. User Interface & Experience
- **Aesthetic**: Modern "Glassmorphism" design with semi-transparent panels and vibrant accent colors.
- **Feedback**: Animated refresh buttons, toast notifications, and color-coded performance indicators (green for positive, red for negative).
- **Responsive**: Sidebar that slides in/out to maximize workbench space.

## 5. Data & Persistence
- **LocalStorage**: All user configurations (lists, groups, alerts) are persisted in the browser.
- **Import/Export**: Ability to back up or migrate workbench data via JSON files.
- **External API**: Integration with a dedicated Python/FastAPI backend for real-time market data.
