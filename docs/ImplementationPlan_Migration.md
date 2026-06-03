# Implementation Plan: Migrate Storage to IndexedDB & Optimize Caching

Migrate the Stocks Galore storage layer from `localStorage` (limited to 5MB) to `IndexedDB` (supports hundreds of megabytes/gigabytes of local storage). This will ensure the application can scale to handle hundreds of lists, complex group hierarchies, and extensive notification histories without encountering quota limits or warning banners.

## User Review Required

> [!IMPORTANT]
> **Data Preservation & Migration**
> On first load after the update, the application will automatically detect existing data in `localStorage` (`stocks_galore_workbench`, etc.), migrate it to IndexedDB, and verify success. Once verified, it will clear the old `localStorage` entries to avoid triggering the 5MB localStorage capacity warnings.

> [!NOTE]
> **Asynchronous Startup**
> Because IndexedDB is inherently asynchronous, the app will show a brief, premium loading splash screen (matching the app's dark theme and visual aesthetics) for a few milliseconds on startup while the database initializes.

## Open Questions

No blocker questions. We will proceed with a standard, self-contained IndexedDB wrapper without external dependencies to keep the bundle size small and load times fast.

## Proposed Changes

### Storage Layer

#### [NEW] [indexedDB.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/indexedDB.ts)
Create a clean, lightweight TypeScript wrapper for browser IndexedDB.
- Set up a database `StocksGaloreDB` (version 1).
- Create object stores for `lists`, `groups`, `alerts`, and `notifications`.
- Provide helper methods for retrieving all records and writing/deleting records.

#### [MODIFY] [storage.ts](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/storage.ts)
Refactor the storage wrapper to be async-native:
- Implement `init()` to handle IndexedDB open and localStorage data migration.
- Change retrieval functions (`getLists`, `getGroups`, `getAlerts`, `getNotifications`) to return Promises.
- Change saving functions (`saveLists`, `saveGroups`, `saveAlerts`, `saveNotifications`) to write to IndexedDB asynchronously.
- Update import/export methods to work seamlessly with the new database.

### Application Integration

#### [MODIFY] [App.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/App.tsx)
- Add an `isLoading` state (default `true`) to block layout rendering until IndexedDB data is retrieved.
- Implement a sleek loading interface (spinning skeleton loader with Stocks Galore logo).
- Update the mount `useEffect` to initialize storage (`await storage.init()`) and load the lists, groups, alerts, and notifications into state.
- Update storage capacity warning: Instead of monitoring the 5MB `localStorage` limit, use the browser's `navigator.storage.estimate()` (Origin Quota) to monitor total workspace storage. Since IndexedDB allows virtually unlimited space relative to typical usage, remove the 5MB banner unless the browser origin itself runs low on system disk space.
- Address caching: Document that ticker data is already cached inside list states (making initial render instant). Provide a memory-cache layer in fetch calls to prevent duplicate requests.

#### [MODIFY] [AnalyticsModal.tsx](file:///c:/Users/rikar/OneDrive/Skrivbord/Stocks%20Galore/src/components/AnalyticsModal.tsx)
- Modify the storage statistics section to read storage usage from IndexedDB/Origin Quota using the Storage Estimate API, rather than measuring `localStorage` string lengths.
- Update the donut chart categories to show IndexedDB stores (Lists & Tickers, Groups, Alerts, Notifications) by serializing current states to estimate sizes, and compare them against the large origin quota.

## Verification Plan

### Automated Tests
- Run `npm run build` to verify TypeScript compiler passes cleanly.

### Manual Verification
- **First Load Migration**: Seed `localStorage` with mock data, open the app, and verify that the data is successfully copied to IndexedDB and the old keys are cleaned up.
- **Data Persistence**: Add new groups, lists, and tickers. Refresh the browser and verify all changes persist.
- **Export/Import**: Test exporting the database to JSON, clearing IndexedDB, and importing the JSON file.
- **Storage Donut Chart**: Verify the analytics panel correctly displays the updated IndexedDB categories and estimates.
