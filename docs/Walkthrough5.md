# Feature Walkthrough: Global Filters and Settings

I've successfully implemented the entire global filtering engine and established the foundational settings modal layout as you requested.

## What's New?

### 1. Global Filter Dashboard
You can now access the filter engine using the Filter icon located in your toolbar.
- **Price Range:** Set minimum and maximum ticker prices.
- **Market Cap:** Set boundaries (in Billions `B`). The filtering engine seamlessly handles and translates raw string values behind the scenes (e.g. converting `3.9T` to `3900B`, `40M` to `0.04B`).
- **Dynamic Sector Multi-Select:** A smart grid that only displays sectors actually present in your loaded workbench stocks.

### 2. Live Workbench Filtration
- As soon as you hit **Apply Filters**, the entire workbench applies the logic. 
- You'll notice the list counters dynamically update to reflect the filter ratio. For example, if a list has 10 tickers but only 3 meet your tech/market cap filters, the list header will clearly display `(3 / 10)` to keep you informed of hidden values.

### 3. Smart Filter Notifications
- When active filters are engaged, the Toolbar's Filter icon will brandish a bright blue badge stating exactly how many specific filter conditions are currently restricting your view.

### 4. Settings Control Center
The settings icon next to the filter is now live!
- **Auto-Refresh Toggle:** I've added a system to configure the background polling interval. It currently supports Manual (Default), 1 Minute, 5 Minutes, and 15 Minutes.
- **Future Hooks:** I've added ghosted layouts for upcoming toggles like Dark/Light themes and a data scaffolding exporter to set you up for future phases.

## Verification
You can test this right now in your local browser instance (hot-reloading should have automatically pulled these changes in). Wait for the sectors to populate, try setting a very high minimum market cap threshold, and click apply to watch your small cap stocks momentarily vanish from the workbench layout.

> [!TIP]
> If you collapse a list panel, the list counter remains visible in its header so you always know exactly how many items matched the filter rules inside that list without having to expand it!
