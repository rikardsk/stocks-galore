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

## Backend
- **FastAPI**: A high-performance Python web framework used to build the asynchronous REST API.
- **yfinance**: The primary data source, fetching real-time and historical stock data from Yahoo Finance.
- **Pandas**: Utilized for efficient data manipulation and calculation of technical indicators (SMAs, performance metrics).
- **Uvicorn**: An ASGI server that runs the FastAPI application with high concurrency.

## Tools & Utilities
- **UUID**: Generates unique identifiers for lists, groups, and tickers to ensure data integrity during drag-and-drop operations.
- **CORS Middleware**: Configured in the backend to allow secure communication between the local dev server and the frontend.
- **Vite**: The build tool and development server providing lightning-fast Hot Module Replacement (HMR).
