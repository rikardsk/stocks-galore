# Migration to IndexedDB Checklist

- [x] Create IndexedDB wrapper (`src/indexedDB.ts`)
- [x] Refactor Storage adapter (`src/storage.ts`) to be async and support localStorage migration
- [x] Integrate database loading and async state synchronization in `App.tsx`
- [x] Add visual loading state & splash screen in `App.tsx`
- [x] Update localStorage warnings to use Origin Quota Storage Estimate
- [x] Update `AnalyticsModal.tsx` storage details & donut chart calculations
- [x] Verify build and functionality
