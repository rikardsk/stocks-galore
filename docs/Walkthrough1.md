# Stocks Galore Workbench Walkthrough

Welcome to your new stock list management workbench! Below is an overview of the features and architectural decisions.

## 🚀 Key Features

### 1. Draggable Workbench Panels
- **Dynamic Layout**: Each stock list is a separate panel that you can drag anywhere on the workspace.
- **Customizable Appearance**: Each list can have its own theme color, which styles the header and accent elements.
- **Show/Hide States**: Panels can be collapsed to save space, and stock statistics (Market Cap, Volume) can be toggled per panel.

### 2. Collapsible Sidebar
- **Organization**: View all your lists in one place.
- **Toggle View**: Use the hamburger icon to slide the sidebar in and out, maximizing your "workbench" area.
- **CRUD Operations**: Directly add or delete lists from the sidebar.

### 3. Floating Action Toolbar
- **Glassmorphic Design**: A premium, blur-background toolbar at the bottom of the screen.
- **Quick Add**: Easily create new lists from any view.

### 4. Live Mock Data
- **Dynamic Stats**: Stock prices and changes are generated with mock data to demonstrate the UI's capabilities.
- **Visual Cues**: Positive/Negative change indicators (Green/Red).

## 🛠 Tech Stack
- **Frontend**: React + TypeScript (Vite)
- **Styling**: Vanilla CSS (CSS Variables, Flexbox, Gradients)
- **Persistence**: `localStorage` for seamless local storage of your lists.
- **Icons**: `lucide-react` for modern, crisp iconography.
- **Interactions**: `react-draggable` for the workbench experience.

## 📂 Project Structure
- `src/App.tsx`: Main application entry point and state coordinator.
- `src/components/`:
  - `ListPanel.tsx`: The heart of the workbench, handles draggability and list display.
  - `Sidebar.tsx`: Navigation and list management.
  - `Toolbar.tsx`: The floating action bar.
- `src/storage.ts`: Handles data persistence via JSON in `localStorage`.
- `src/index.css`: The "Premium" design system.

## ⚙️ How to use
1. **Create a List**: Click the "+" button on the floating toolbar or the "New List" button in the sidebar.
2. **Add Tickers**: Click "Add Ticker" on any panel and type a symbol (e.g., AAPL).
3. **Organize**: Drag the panel headers to reposition them. Use the "Eye" icon to show/hide extra stats.
