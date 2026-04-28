# Implement Global Ticket Filtering

The user requested the ability to filter tickers across all workbench lists based on Price, Market Cap, and Sector. They also asked for suggestions regarding the currently unassigned "Settings" toolbar button.

## Proposed Changes

### 1. Global Filter State in `App.tsx`
- Introduce a new state `globalFilters` using the existing `StockFilters` type from `types.ts`.
- Introduce a new state `isFilterModalOpen` toggled by the existing Filter button in the `Toolbar`.
- Pass `globalFilters` down as a prop to each `ListPanel`.

### 2. Implement `FilterModal` UI
- Create an overlay modal similar to `isCreateModalOpen` but for filters.
- **Price Range:** Two number inputs (`priceMin`, `priceMax`).
- **Market Cap:** Two number inputs (`marketCapMin`, `marketCapMax`) representing Billions.
- **Sector:** A dropdown or text input to specify sectors to filter by.
- Actions to "Clear All" and "Apply" the filters.
- Display a small badge on the `Filter` icon in the toolbar if any filters are active.

### 3. Filter Execution in `ListPanel.tsx`
- Use the existing `tickerMatchesFilters` helper from `types.ts`.
- Filter `sortedTickers` before mapping them to the UI so that tickers not matching the current price/cap/sector boundaries are temporarily hidden from view.
- Update the list header to reflect the number of *visible* tickers (e.g., "Mylist (2/5)").

## Suggestions for the Settings Button
To answer your question about the **Settings** button, here are some great features we could anchor there:
1. **Refresh Interval:** Customize how often the backend automatically pulls fresh stock data without clicking "Refresh All" (e.g., 5 mins, 1 hour, manual).
2. **Theme UI Tweaks:** Toggles for Dark/Light mode, hiding/showing background gradients, or adjusting glassmorphism strengths.
3. **Default List Preferences:** Settings to define a "default" sort order for new lists, or setting default "Show Stats" options for newly added tickers.
4. **Data Purge/Reset:** Options to safely clear all workbench data and restore it from scratch, or perform a manual export/backup to a local JSON file.

## Open Questions
- For the "Sector" filter, would you prefer a simple text input where you type the sector (e.g. "Technology"), or a multi-select dropdown that populates based on the currently available sectors in your loaded stocks?

## Verification Plan
1. Apply a Price minimum filter (e.g., >$100) and verify sub-$100 stocks temporarily vanish from all lists.
2. Apply a Market Cap filter and ensure the string formats (M/B/T) are accurately parsed and compared.
3. Validate that clearing all filters restores complete visibility to all saved tickers.
