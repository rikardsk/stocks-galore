# Tech Stack - Stocks Galore

A high-performance stock workbench built with a modern React frontend and a Python-powered financial backend.

## Frontend
- **React (Vite)**: The core UI framework, providing a fast and reactive development environment.
- **TypeScript**: Ensures type safety and improves developer experience with robust interfaces for stock data and application state.
- **Vanilla CSS**: Custom styling using CSS Variables and Backdrop Filters to achieve a premium "glassmorphism" aesthetic and responsive layouts.
- **Lucide React**: A clean and consistent icon library used for the toolbar, sidebar, and list actions.
- **React Draggable**: Enables the free-form "workbench" experience, allowing users to position stock lists anywhere on the canvas.
- **Framer Motion**: Used for smooth micro-animations and transitions (e.g., sidebar sliding and modal fades).
- **LocalStorage**: Provides persistent browser-based storage for user-defined lists, groups, alerts, and settings.
- **SVG Sparklines**: Custom-built lightweight trend visualizations using SVG paths for performant price history rendering.

## Backend
- **FastAPI**: A high-performance Python web framework used to build the asynchronous REST API.
- **yfinance**: The primary data source, fetching real-time and historical stock data from Yahoo Finance.
- **Pandas**: Utilized for efficient data manipulation and calculation of technical indicators (SMAs, performance metrics, and 30-day price history).
- **Uvicorn**: An ASGI server that runs the FastAPI application with high concurrency.

## Recent Features & Enhancements
- **Chunked Data Refresh**: Intelligent batching of API requests in chunks (e.g., 15 tickers) to ensure stability for large portfolios (150+ stocks) and avoid URL limits.
- **Real-time Performance Heatmaps**: Dynamic color-coding of headers and lists based on real-time average percentage gains.
- **Notification & Alert System**: Persistent price-based alerts that trigger browser-level notifications and a filtered notification history panel.
- **Market Overview Table**: A comprehensive, sortable, and filterable view of all stocks with custom `@media print` support for professional reporting.
- **Pinned Primary Lists**: Forced vertical alignment and pinning for the Watchlist and Portfolio in the sidebar for consistent navigation.

## Tools & Utilities
- **UUID**: Generates unique identifiers for lists, groups, and tickers to ensure data integrity during drag-and-drop operations.
- **CORS Middleware**: Configured in the backend to allow secure communication between the local dev server and the frontend.
- **Vite**: The build tool and development server providing lightning-fast Hot Module Replacement (HMR).
