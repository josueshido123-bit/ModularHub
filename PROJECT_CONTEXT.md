# SimpleDash - Project Context

> A polished, modern, highly extensible dashboard web application with a modular architecture.

**Last Updated:** 2026-08-29  
**Version:** 1.0.0  
**Status:** MVP with Toolbelt Interface & Working Settings

---

## 📋 Overview

SimpleDash is a **personal dashboard framework** with a **toolbelt console interface**. Modules appear as clickable square cards displaying name and description. Click a card to open the full module functionality in a modal.

**Core Philosophy:** The dashboard is module-agnostic. Adding new modules requires no changes to the core framework or existing modules.

---

## 🏗️ Architecture

### Toolbelt Interface Design

The dashboard displays **modules as clickable square cards** in a responsive grid (like a command center toolbelt):

1. **Module Card (Preview)** - Shows icon, name, and description
2. **Click Card** - Opens module in a modal with full functionality
3. **Modal Interface** - Clean header with icon/name and close button

This design allows:
- Quick visual scanning of available tools
- Open only what you need
- Easy addition of new modules (just add a new card)
- Scalable to many modules without overwhelming the UI

### System Design

```
┌─────────────────────────────────────────┐
│      SimpleDash Dashboard UI            │
│  (Responsive Grid Layout)               │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    ┌───▼────────┐     ┌──────▼────────┐
    │   Module   │     │    Module     │
    │  Registry  │     │    System     │
    └────────────┘     └───────────────┘
        │                     │
        │        ┌────────────┤
        │        │            │
    ┌───▼───┐  ┌─▼──┐    ┌───▼──────┐
    │Module │  │Data│    │Components│
    │Defs   │  │Svc │    │& Utils   │
    └───────┘  └────┘    └──────────┘
```

### Key Components

#### 1. **Module Registry** (`src/core/moduleRegistry.js`)
- Central registry for all available modules
- Discovers and stores module metadata
- Prevents duplicate registrations
- Validates required module fields

#### 2. **Module System** (`src/core/moduleSystem.js`)
- Manages module lifecycle (load/unload)
- Renders modules to DOM
- Handles module state
- Supports initialization/cleanup hooks

#### 3. **Storage Service** (`src/services/storageService.js`)
- Centralized data persistence using localStorage
- Observer pattern for state changes
- Data import/export utilities
- Prefixed key namespace for isolation

#### 4. **Utilities** (`src/utilities/uiUtils.js`)
- Toast notifications
- Currency formatting
- Date formatting
- ID generation
- Debounce/throttle helpers

---

## 📦 Module Structure

### Module Definition

Every module must implement this structure:

```javascript
{
    id: string,                          // Unique identifier
    name: string,                        // Display name (short)
    description: string,                 // Brief one-line description
    category: string,                    // Category grouping
    version: string,                     // Semantic version
    icon: string,                        // Display icon (emoji, best practice)
    component: Class,                    // Component class with render()
    defaultSize: { width: 1, height: 1 }, // (future: for resizable cards)
    init?: function,                     // Optional initialization
    destroy?: function,                  // Optional cleanup
    settings?: object                    // Optional settings schema
}
```

### Module Card Display

In the toolbelt view, each module shows:
```
┌─────────────┐
│             │
│      💰     │  Icon (emoji)
│             │
│   Finance   │  Name (module name)
│  Track...   │  Description (first line of description)
│             │
└─────────────┘
```

### Module Component Interface

Each module must export a component class with:

```javascript
class ModuleComponent {
    constructor(state = {}) {
        // Initialize with state
    }

    render() {
        // Return HTMLElement to render in modal
        // This can be the full UI with all functionality
    }
}
```

### Adding a New Module

1. Create module folder: `src/modules/{module-name}/`
2. Create service layer: `{module-name}Service.js` (business logic)
3. Create component: `{ModuleName}Component.js` (UI rendering)
4. Create registration: `{module-name}Module.js` with module definition
5. Register in `src/main.js`:
   ```javascript
   import { register{ModuleName}Module } from './modules/{module-name}/{module-name}Module.js';
   register{ModuleName}Module();
   ```
6. The module will automatically appear as a square card in the toolbelt
7. Update PROJECT_CONTEXT.md with module details

### Module Lifecycle

1. **Registration** - Module is registered with metadata
2. **Card Display** - Module appears as clickable square in grid
3. **User Click** - Modal opens with full module UI
4. **Functionality** - User interacts with module inside modal
5. **Close** - Modal closes, returns to toolbelt view

---

## 💰 Finance Module

### Purpose
Personal finance tracker for recording transactions and goals.

### Structure
```
src/modules/finance/
├── financeService.js      # Business logic
├── FinanceComponent.js    # UI rendering
└── financeModule.js       # Module registration
```

### Data Model

**Transaction:**
```javascript
{
    id: string,           // Unique ID
    type: 'income' | 'expense',
    amount: number,
    category: string,     // Category ID
    note: string,
    date: ISO8601,
    createdAt: ISO8601
}
```

**Goal:**
```javascript
{
    id: string,
    name: string,
    targetAmount: number,
    deadline?: ISO8601,
    description: string,
    createdAt: ISO8601,
    completed: boolean
}
```

**Category:**
```javascript
{
    id: string,           // Unique identifier
    name: string,         // Display name
    icon: string,         // Emoji icon
    type: 'income' | 'expense'
}
```

### Features Implemented

✅ **Initial Balance Setup** - User can set starting balance  
✅ **Add Transactions** - Income/expense with category, amount, note, date  
✅ **Transaction History** - Sorted by date, with edit/delete  
✅ **Categories** - Default categories for income/expense  
✅ **Quick Statistics** - Total income, expenses, net change  
✅ **Balance Display** - Prominent, auto-updating  
✅ **Responsive UI** - Mobile-friendly transaction list  
✅ **Animations** - Smooth transitions and micro-interactions  

### Features Not Yet Implemented

⚠️ **Financial Goals** - Infrastructure exists, UI pending  
⚠️ **Advanced Statistics** - Category breakdown charts  
⚠️ **Budget Limits** - Per-category spending limits  
⚠️ **Recurring Transactions** - Automatic repeat transactions  
⚠️ **Export/Import** - CSV export functionality  

### Storage Schema

```javascript
{
    finance_data: {
        balance: number,
        transactions: [Transaction],
        goals: [Goal],
        categories: [Category]
    }
}
```

### FinanceService API

```javascript
// Balance
financeService.setInitialBalance(amount)
financeService.getBalance() → number

// Transactions
financeService.addTransaction(transaction) → Transaction
financeService.removeTransaction(transactionId)
financeService.updateTransaction(transactionId, updates)
financeService.getTransactions() → [Transaction]

// Goals
financeService.createGoal(goal) → Goal
financeService.getGoals() → [Goal]
financeService.updateGoal(goalId, updates)
financeService.removeGoal(goalId)
financeService.getGoalProgress(goalId) → number (0-100)

// Statistics
financeService.getStatistics() → {totalIncome, totalExpenses, netChange, ...}

// Categories
financeService.getCategories() → [Category]
financeService.getCategory(categoryId) → Category
```

---

## 🎨 Design System

### Color Palette

| Variable | Purpose | Value |
|----------|---------|-------|
| `--color-primary` | Primary actions | #6366f1 |
| `--color-secondary` | Secondary elements | #8b5cf6 |
| `--color-income` | Income indicators | #10b981 |
| `--color-expense` | Expense indicators | #ef4444 |
| `--color-bg` | Background | #0f172a |
| `--color-text` | Primary text | #f1f5f9 |

### Typography

- **Font:** System font stack (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Base Size:** 16px
- **Headings:** Bold (700), tight line-height (1.25)
- **Body:** Normal (400), relaxed line-height (1.5)

### Spacing Scale

```
--space-xs: 0.25rem    (4px)
--space-sm: 0.5rem     (8px)
--space-md: 1rem       (16px)
--space-lg: 1.5rem     (24px)
--space-xl: 2rem       (32px)
--space-2xl: 3rem      (48px)
```

### Responsive Breakpoints

- **Desktop:** 1024px+
- **Tablet:** 768px - 1024px
- **Mobile:** < 768px

### Shadows & Borders

- **Border Radius:** 0.5rem (md), 0.75rem (lg), 1rem (xl)
- **Shadows:** sm, md, lg, xl (elevation progression)
- **Borders:** 1px solid with semantic colors

---

## 🎬 Animation Strategy

### Principles

- **Respect User Preferences:** Honor `prefers-reduced-motion`
- **Purpose-Driven:** Every animation serves user feedback
- **Performance:** Use GPU-accelerated transforms
- **Consistent Timing:** `150ms` (fast), `200ms` (base), `300ms` (slow)

### Common Animations

| Animation | Duration | Use Case |
|-----------|----------|----------|
| `slideUpFade` | 400ms | Module cards on load |
| `balanceFloat` | 4s (infinite) | Balance amount (subtle) |
| `buttonHoverGlow` | 600ms | Button hover effects |
| `fadeIn/Out` | 300ms | General visibility changes |
| `shake` | 400ms | Error states |
| `scaleIn` | 200ms | Modal appearances |

---

## 📁 Folder Structure

```
simpledash/
├── index.html                          # Main entry point
├── server.js                           # Dev server (handles MIME types)
├── package.json                        # Project metadata
├── PROJECT_CONTEXT.md                  # This file - Architecture docs
│
├── src/
│   ├── main.js                        # App initialization & settings button
│   │
│   ├── core/
│   │   ├── moduleRegistry.js          # Module registration
│   │   └── moduleSystem.js            # Module lifecycle management
│   │
│   ├── services/
│   │   ├── storageService.js          # Data persistence (localStorage)
│   │   └── settingsService.js         # App-wide settings management
│   │
│   ├── utilities/
│   │   └── uiUtils.js                 # UI helper functions
│   │
│   ├── modules/
│   │   ├── finance/
│   │   │   ├── financeModule.js       # Registration
│   │   │   ├── financeService.js      # Business logic
│   │   │   └── FinanceComponent.js    # UI component
│   │   │
│   │   └── settings/
│   │       ├── SettingsComponent.js   # Settings UI
│   │       └── settingsPanel.js       # Settings panel wrapper
│   │
│   └── styles/
│       ├── base.css                   # Design tokens & global styles
│       ├── dashboard.css              # Dashboard & grid layout
│       ├── modules.css                # Module & modal styles
│       ├── animations.css             # Animation definitions
│       └── settings.css               # Settings panel styles
```

---

## 🔌 Data Layer

### StorageService

- **Backend:** localStorage with `simpledash_` prefix
- **Interface:** Save/Load/Remove/Subscribe
- **Observer Pattern:** Listeners notified on changes
- **Export/Import:** Full data backup/restore

### Module-Specific Data

Each module manages its own data through a dedicated service:
- FinanceService → `simpledash_finance_data`
- (Future) NotesService → `simpledash_notes_data`
- (Future) TasksService → `simpledash_tasks_data`

### Future Backend Integration

To migrate to a backend/database:
1. Create new service (e.g., `apiStorageService.js`)
2. Implement same interface as `StorageService`
3. Modules use service via dependency, not direct imports
4. Switch storage provider in `main.js`

---

## 🧩 Component System

### Module Cards

- Responsive grid (CSS Grid)
- Support for 1x1, 2x1, 1x2, 2x2 sizes
- Smooth entrance animations
- Hover elevation and border changes
- Dark mode by default (light mode with media query)

### UI Patterns

**Forms:**
- Consistent styling across inputs/selects
- Currency input with $ prefix
- Radio button groups for selection
- Required field validation

**Modals:**
- Centered overlay with backdrop blur
- Slide-in animation
- Close button (×)
- Keyboard-friendly (TODO: ESC to close)

**Toasts:**
- Fixed top-right positioning
- Type-specific styling (success/error/info/warning)
- Auto-dismiss or manual close
- Smooth slide-in/out animation

**Lists:**
- Transaction items with icon, info, amount
- Hover state shows actions (delete)
- Category-specific border color
- Staggered entrance animation

---

## ⚙️ Settings System

### Overview
Application-wide settings panel accessible via the gear icon (⚙️) in the header.

### SettingsService Features

✅ **Display & Behavior Settings**
- Enable/disable animations
- Sound effects toggle (placeholder)
- Respect system reduced-motion preferences

✅ **Data Management**
- **Export Data** - Download all data as JSON backup
- **Import Data** - Restore from previously exported JSON file
- **Clear All Data** - Nuclear option to reset everything

✅ **About Section**
- Version information
- Project description

### Storage Schema

```javascript
{
    app_settings: {
        theme: 'dark',                        // Future: theme support
        animationsEnabled: true,              // Animation toggle
        respectReducedMotion: boolean,        // OS preference
        soundEnabled: false,                  // Sound effects
        dataExportFormat: 'json'              // Export format
    }
}
```

### Settings Button
- Located in top-right header
- Clicking opens settings modal
- Settings modal can be closed via × button or clicking backdrop

---

## ⚡ Performance Considerations

### Implemented

✅ CSS Grid for responsive layout  
✅ GPU-accelerated animations (transform/opacity)  
✅ Efficient event listeners (event delegation where applicable)  
✅ Minimal DOM operations  
✅ Debounced/throttled functions for resize/scroll  

### Future Optimizations

⚠️ Lazy load modules  
⚠️ Virtual scrolling for large transaction lists  
⚠️ Service Worker caching  
⚠️ Code splitting per module  

---

## 🧪 Testing

No testing framework currently implemented. Recommended:
- Unit: Jest (business logic in services)
- Integration: Testing Library (component rendering)
- E2E: Cypress (user workflows)

---

## 📝 Important Implementation Decisions

### 1. Vanilla JavaScript
- No framework dependency (Vue/React) initially
- Simpler component model with `render()` method
- Easier to add framework later

### 2. localStorage for Data
- Fast, simple, suitable for MVP
- Easy to migrate to IndexedDB or backend later
- No user authentication initially

### 3. Modular Component Structure
- Each module is independent
- Services handle business logic
- Components handle UI only
- Clear separation of concerns

### 4. CSS Grid for Layout
- Native responsive without Bootstrap/Tailwind
- Flexible grid system for different module sizes
- Better performance than frameworks

### 5. Observer Pattern for Storage
- Modules can subscribe to data changes
- Reactive updates without re-rendering entire app
- Scalable state management

---

## 🚀 Future Module Ideas

These are NOT implemented yet, but the architecture supports them:

1. **Notes** - Quick note-taking with tags
2. **Tasks** - To-do list with priorities and due dates
3. **Calendar** - Event management and scheduling
4. **Habits** - Daily habit tracking with streaks
5. **Weather** - Local weather display with forecast
6. **Pomodoro** - Timer for productivity sessions
7. **Statistics** - General data analytics and insights
8. **Bookmarks** - Quick access to saved links
9. **Shopping List** - Shareable lists with checkboxes
10. **Music** - Now playing and playlist management

---

## 🔧 Development Workflow

### Running the Application

```bash
# Option 1: Simple HTTP server
python -m http.server 8000

# Open: http://localhost:8000
```

### Adding a Feature

1. Read this PROJECT_CONTEXT.md
2. Identify module/system component
3. Make changes
4. Update this file with:
   - Feature description
   - Data structures if changed
   - Storage schema if changed
   - Move feature from "Not Yet Implemented" to "Implemented"

### Adding a Module

1. Create `src/modules/{name}/` directory
2. Implement `{name}Service.js` with business logic
3. Implement `{Name}Component.js` with UI
4. Create `{name}Module.js` with registration
5. Import and register in `src/main.js`
6. Document in PROJECT_CONTEXT.md

---

## 🐛 Known Limitations

1. **No Authentication** - All data is local to browser
2. **Single Device** - No cloud sync
3. **No Recurring Transactions** - Each must be added manually
4. **Limited Goals Feature** - Only basic structure implemented
5. **No Budget Enforcement** - Goals are visualization only
6. **No Categories Customization** - Pre-defined only
7. **No Dark/Light Toggle** - Respects system preference only
8. **Module Resizing** - All modules fixed at 1x1 size (future feature)
9. **Sound Effects** - Setting exists but not implemented

---

## 📚 Key File Locations Quick Reference

| Purpose | File |
|---------|------|
| App initialization & settings | `src/main.js` |
| Module system | `src/core/moduleSystem.js` |
| Module registry | `src/core/moduleRegistry.js` |
| Data storage | `src/services/storageService.js` |
| Settings management | `src/services/settingsService.js` |
| Finance logic | `src/modules/finance/financeService.js` |
| Finance UI | `src/modules/finance/FinanceComponent.js` |
| Settings UI | `src/modules/settings/SettingsComponent.js` |
| Global styles | `src/styles/base.css` |
| Dashboard layout | `src/styles/dashboard.css` |
| Module/modal styles | `src/styles/modules.css` |
| Settings styles | `src/styles/settings.css` |
| Animations | `src/styles/animations.css` |

---

## 🎓 For Future Developers

When continuing this project:

1. **Always read this file first** - It's the source of truth for architecture
2. **Maintain module independence** - Don't hardcode Finance-specific logic into core
3. **Follow naming conventions** - Classes PascalCase, functions camelCase, files as-is
4. **Update this file when making changes** - Architecture documentation must stay current
5. **Respect animations** - Use CSS variables, honor `prefers-reduced-motion`
6. **Test responsiveness** - Desktop (1024px+), tablet (768-1024px), mobile (<768px)
7. **Add descriptions** - Modules need clear, concise one-line descriptions
8. **Square cards first** - Module cards should always show icon + name + description

---

## 📋 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-08-29 | Toolbelt interface, Settings system, Modal-based modules |
| 1.0.0 | 2026-08-29 | Initial release with Finance module and modular architecture |

---

**Built with ❤️ as a modular, extensible personal dashboard.**
