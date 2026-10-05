# SimpleDash - Project Context

> A polished, modern, highly extensible dashboard web application with a modular architecture.

**Last Updated:** 2026-10-05  
**Version:** 1.4.3  
**Status:** MVP with account-scoped Finance, Wishlist, and Bookmarks modules

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

### Module Visual Distinction

**Important design rule:** Modules must not use the exact same UI structure as one another. They should share the application design system, including theme tokens, typography, spacing, borders, buttons, animation timing, responsive behavior, and accessibility conventions, but each module must have a recognizable composition suited to its purpose. Modules do not need to be dramatically different; they do need distinguishable layouts, information hierarchies, controls, and interaction patterns so Finance, Wishlist, Bookmarks, and future modules feel like separate tools within the same product.

**Important layout rule:** A module body must never change size when switching sections, tabs, categories, filters, or states. Each module must reserve a stable responsive body viewport and handle longer content with internal scrolling, so the surrounding modal and page do not jump or resize.

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
✅ **Transaction History** - Sorted by date, with description editing and delete  
✅ **Categories** - Default categories for income/expense  
✅ **Quick Statistics** - Total income, expenses, net change  
✅ **Balance Display** - Prominent, auto-updating  
✅ **Responsive UI** - Mobile-friendly transaction list  
✅ **Animations** - Smooth transitions and micro-interactions  
✅ **Financial Goals** - Targets with balance-based progress bars  
✅ **Account Storage** - Email/password accounts with guest data migration  
✅ **Responsive Module Workspace** - Larger desktop and mobile-friendly module modal  

### Features Not Yet Implemented

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

### Customization

Every module is highly customizable through code. Module metadata, components, services, storage keys, styles, and responsive behavior can be extended or changed without coupling modules to the dashboard shell.

---

## ✦ Wishlist Module

### Purpose

The Wishlist module is a catalogue for things a user wants to remember, plan for, or eventually purchase. It supports fixed-size catalogue cards, richer item detail views, media, links, notes, prices, target dates, completion, and a complete change history.

### Structure
```
src/modules/wishlist/
├── wishlistService.js       # Account-scoped items and history
├── WishlistComponent.js     # Catalogue, forms, detail view, and countdowns
└── wishlistModule.js        # Module registration
```

### Item Data Model
```javascript
{
    id: string,
    name: string,
    mediaUrl: string,
    mediaType: 'image' | 'gif' | 'video',
    mediaPosition: string,        // Normalized crop point, e.g. '50% 50%'
    price: number | null,
    notes: string,
    link: string,
    targetDate: ISO8601 | null,
    status: 'active' | 'completed',
    createdAt: ISO8601,
    updatedAt: ISO8601
}
```

### History Data Model
```javascript
{
    id: string,
    itemId: string,
    action: 'added' | 'edited' | 'completed' | 'reopened' | 'removed',
    details: object,
    date: ISO8601
}
```

### Features Implemented

✅ **Fixed Catalogue Cards** - Cards remain the same size as item count changes  
✅ **Media** - Image, GIF, and video URLs with larger media in detail view  
✅ **Media Upload and Positioning** - Local image/GIF/video uploads are stored as data URLs and can be dragged to choose their crop position  
✅ **Hover Media Playback** - GIFs and videos load/play on hover or keyboard focus and stop when leaving  
✅ **Item Details** - Name, price, notes, links, status, and target date  
✅ **Finance Progress** - Price-bearing items show progress from the current Finance balance  
✅ **Countdowns** - Target dates display remaining days or elapsed days  
✅ **Completion** - Items can be completed and reopened  
✅ **History** - Added, edited, completed, reopened, and removed actions are recorded with compact media thumbnails  
✅ **Catalogue Deletion** - Each card has a confirmed Delete action; successful removals are recorded in history  
✅ **Responsive Layout** - Fixed-size catalogue adapts to mobile without stretching cards  
✅ **Account Storage** - Wishlist data uses the active account namespace  
✅ **Save Failure Recovery** - Failed storage writes restore the last persisted data and show an error instead of leaving unsaved changes in memory  
✅ **Media Preview State** - Add/Edit forms reset stale drafts; pasted URLs, media type changes, and uploads update the crop preview  
✅ **Grab-and-Pan Cropping** - Pointer capture tracks the grabbed point; image translation follows mouse deltas 1:1 and clamps at crop boundaries  
✅ **Animated Sections** - Catalogue cards and history rows enter with staggered motion; detail and form overlays use modal transitions  
✅ **Animated Closing** - Module, Settings, Finance, Wishlist form, and Wishlist detail overlays use coordinated fade/scale exit animations  

### WishlistService API
```javascript
wishlistService.addItem(item) → Item
wishlistService.updateItem(itemId, updates) → Item
wishlistService.completeItem(itemId) → Item
wishlistService.removeItem(itemId)
wishlistService.getItem(itemId) → Item | null
wishlistService.getItems() → [Item]
wishlistService.getHistory() → [HistoryEntry]
```

### Storage Schema
```javascript
{
    wishlist_data: {
        items: [Item],
        history: [HistoryEntry]
    }
}
```

---

## 🎨 Theme System

Themes are applied through shared CSS variables on `document.documentElement`, so the dashboard, module cards, modals, forms, buttons, Finance, Wishlist, and Settings all change together. The selected theme is persisted through account-scoped `theme_settings` data.

Wishlist uses the shared animation language from `src/styles/animations.css`: fixed-size cards and history rows use a short staggered entrance, tabs use a restrained hover transition, crop form panels fade without moving, detail panels use a modal slide, and all overlays use the coordinated `fadeOut`/`modalSlideOut` close pair. Reduced-motion preferences disable these effects through the global animation rule.

Wishlist and Bookmarks media editors share these crop interaction rules: the editor frame has a fixed 220px height and a constrained grid row; preview images are scaled to provide pan room; pointer deltas move the image from its grabbed point at 1:1 speed until a crop boundary is reached. `mediaPosition` stores the normalized crop point and is applied to editor previews and catalogue/detail media. History thumbnails remain unscaled.

All module scroll regions keep wheel and touch scrolling available without visible scrollbar chrome. This prevents a native scrollbar from flashing during Wishlist section changes or shifting the catalogue layout when content becomes scrollable.

Available themes:
- **Midnight** - Existing deep blue-black dashboard palette
- **Graphite** - Formal charcoal and steel palette
- **Paper** - Light editorial palette
- **Forest** - Dark green with warm copper accents

Theme behavior is centralized in `src/services/themeService.js`; new themes should add a token set there and a matching `data-theme` selector in `src/styles/base.css`.

---

## 🔖 Bookmarks Module

### Purpose

Bookmarks is a visual link library for saving useful pages with a name, URL, description, and optional image, GIF, or video media. It follows the Wishlist interaction language while keeping its own account-scoped data and history.

### Structure
```
src/modules/bookmarks/
├── bookmarksService.js       # Account-scoped bookmarks and history
├── BookmarksComponent.js     # Catalogue, forms, detail view, and media editor
└── bookmarksModule.js        # Module registration
```

### Bookmark Data Model
```javascript
{
    id: string,
    name: string,
    url: string,
    mediaUrl: string,
    mediaType: 'image' | 'gif' | 'video',
    mediaPosition: string,      // Normalized crop point, e.g. '50% 50%'
    description: string,
    createdAt: ISO8601,
    updatedAt: ISO8601
}
```

### Features Implemented

✅ **Visual Catalogue** - Fixed-size cards with media-first presentation  
✅ **Distinct Reference Shelf UI** - Featured bookmark presentation, compact quick-access rows, and a timeline history instead of the Wishlist catalogue structure  
✅ **Bookmark Links** - Required URL with an open-in-new-tab detail action  
✅ **Descriptions** - Optional explanatory text shown on cards and detail views  
✅ **Media URLs and Uploads** - Images, GIFs, and videos from URLs or local files  
✅ **Media Positioning** - Drag uploaded or URL-based media from the point grabbed; movement follows the pointer 1:1 and is saved as a normalized crop point  
✅ **Fresh Media Previews** - Add/Edit forms clear stale drafts and refresh the preview when media URL/type changes  
✅ **Hover Playback** - GIFs and videos load/play only on hover or keyboard focus  
✅ **Add, Edit, and Delete** - Full bookmark lifecycle with confirmation before deletion  
✅ **Detail View** - Larger media and complete bookmark information  
✅ **History** - Added, edited, and removed actions with compact thumbnails  
✅ **Account Storage** - Uses the active account namespace without changing Finance or Wishlist data  
✅ **Themes and Animations** - Uses shared themes, card entrances, overlay transitions, and responsive rules

### BookmarksService API
```javascript
bookmarksService.addItem(bookmark) → Bookmark
bookmarksService.updateItem(itemId, updates) → Bookmark
bookmarksService.removeItem(itemId)
bookmarksService.getItem(itemId) → Bookmark | null
bookmarksService.getItems() → [Bookmark]
bookmarksService.getHistory() → [HistoryEntry]
```

### Storage Schema
```javascript
{
    bookmarks_data: {
        items: [Bookmark],
        history: [HistoryEntry]
    }
}
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
│   │   └── themeService.js            # Persisted application-wide themes
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
│   │   ├── wishlist/
│   │   │   ├── wishlistModule.js      # Registration
│   │   │   ├── wishlistService.js     # Items and history
│   │   │   └── WishlistComponent.js   # Catalogue and detail UI
│   │   │
│   │   ├── bookmarks/
│   │   │   ├── bookmarksModule.js     # Registration
│   │   │   ├── bookmarksService.js     # Bookmarks and history
│   │   │   └── BookmarksComponent.js   # Catalogue and detail UI
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

- **Backend:** localStorage with `simpledash_` prefix and account-scoped keys
- **Interface:** Save/Load/Remove/Subscribe
- **Observer Pattern:** Listeners notified on changes
- **Export/Import:** Full data backup/restore

### Accounts and Migration

The default `guest` account preserves existing data. Creating an email/password account copies legacy guest module data into the new account without deleting the guest copy, then switches the active storage namespace. Credentials are local-browser credentials in this MVP; production authentication should use a backend and password hashing.

### Module-Specific Data

Each module manages its own data through a dedicated service:
- FinanceService → `simpledash_finance_data`
- WishlistService → `simpledash_wishlist_data`
- BookmarksService → `simpledash_bookmarks_data`
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
        theme: 'midnight',                    // Active theme is stored in theme_settings
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

### Latest Live Validation

✅ Finance and Wishlist modules load together without changing existing account-scoped data  
✅ Wishlist add, edit, completion, reopening, history, countdown, and Finance progress flows work  
✅ Wishlist image/GIF/video media renders in catalogue, detail, and compact history views  
✅ GIFs and videos load/play only on hover or keyboard focus and stop when leaving  
✅ Local media upload converts files to persistent data URLs  
✅ Wishlist uploaded and URL-based media previews load, can be dragged from the grabbed point at 1:1 mouse speed, and persist `mediaPosition` across refresh  
✅ Crop drags remain aligned while form panels fade in; 220px crop frames do not resize to intrinsic image dimensions  
✅ Wishlist form reopening starts with a clean draft and does not override saved item media or crop values  
✅ Wishlist storage write failures roll back in-memory changes and report an error; confirmed catalogue deletion records history  
✅ Catalogue cards remain fixed-size on desktop and mobile  
✅ Theme selection applies shared tokens across modules and persists per account  
✅ Module, Settings, Finance, and Wishlist overlays show coordinated close animations  
✅ Wishlist section changes keep the body stable and do not flash visible scrollbars  
✅ Wishlist and Bookmarks reserve stable responsive body viewports across their library/history sections  
✅ Bookmarks module registers beside Finance and Wishlist without changing their data  
✅ Bookmarks add/edit flows save links, descriptions, uploaded or URL-based media, and pointer-following crop positions across refresh  
✅ Bookmarks detail, edit, delete, history, media, animations, and mobile layout work live  
✅ Bookmarks uses a distinct featured-shelf, quick-access, and timeline composition rather than Wishlist's catalogue structure  
✅ Bookmarks Library and History keep stable body dimensions without visible native scrollbar flashes  
✅ Fresh acceptance pass migrated representative Finance, Wishlist, and Bookmarks data into a new account without loss  
✅ Fresh acceptance pass opened all modules, verified stable section heights, mobile viewport bounds, theme switching, and Settings close animation  
✅ JavaScript syntax checks and editor diagnostics pass across changed files

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

### 4. Distinct Module Experiences
- Reuse shared visual tokens and interaction conventions
- Choose module-specific layouts and primary workflows
- Avoid copying another module's exact toolbar, card, list, or detail structure
- Make each module recognizable at a glance while preserving the overall product aesthetic
- Keep the module body dimension stable across every view; scroll content inside the reserved body area

### 5. CSS Grid for Layout
- Native responsive without Bootstrap/Tailwind
- Flexible grid system for different module sizes
- Better performance than frameworks

### 6. Observer Pattern for Storage
- Modules can subscribe to data changes
- Reactive updates without re-rendering entire app
- Scalable state management

---

## 🚀 Future Module Ideas

These are NOT implemented yet, but the architecture supports them. Each can be built independently with a service, component, registration file, account-scoped storage key, responsive styles, and documented module API:

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

### Additional Module Ideas

11. **Dashboard Widgets** - Customizable information blocks for balances, goals, upcoming dates, and quick actions. Could provide a reusable widget configuration service for the dashboard.
12. **Meal Planner** - Weekly meals, recipes, ingredients, and grocery-list generation. Could connect to the Shopping List module.
13. **Recipe Box** - Save recipes with images, ingredients, tags, ratings, and preparation steps.
14. **Travel Planner** - Trips with destinations, dates, reservations, packing lists, links, and expense summaries from Finance.
15. **Reading Tracker** - Books with covers, authors, notes, ratings, progress, and reading goals.
16. **Game Backlog** - Track games by platform, status, playtime, rating, media, and links. Could import items from Wishlist.
17. **Movie and Series Tracker** - Watchlist, watch history, ratings, release dates, and optional media artwork.
18. **Inventory** - Track owned items, purchase dates, values, warranties, serial numbers, and storage locations.
19. **Subscriptions** - Recurring services with billing dates, prices, renewal countdowns, and Finance expense links.
20. **Debt Payoff Planner** - Debts, interest rates, minimum payments, payoff projections, and progress visualization.
21. **Fitness Log** - Workouts, exercises, personal records, measurements, and recurring routines.
22. **Mood Journal** - Daily mood, notes, tags, and private trend summaries stored only in the active account.
23. **Focus Dashboard** - A daily command view combining tasks, calendar events, Pomodoro sessions, and one selected goal.
24. **File Cabinet** - Organize links and small uploaded documents with tags, descriptions, and expiration reminders.
25. **Contact and Relationship Notes** - Important dates, contact details, interaction notes, and follow-up reminders.
26. **Home Maintenance** - Appliances, maintenance schedules, warranties, service history, and cost tracking through Finance.
27. **Price Watch** - Products with current price, target price, source link, and manual price history. Could connect directly to Wishlist.
28. **Digital Garden** - Interlinked notes, ideas, references, and tags for long-term knowledge building.
29. **Export Center** - Module-specific CSV/JSON exports, filtered backups, and import validation without changing existing account data.
30. **Automation Rules** - User-defined local rules such as "when a goal reaches 100%, mark it complete" or "remind me before a subscription renews."

### Strong Next Candidates

For the current product, the strongest next modules are **Subscriptions**, **Game Backlog**, **Price Watch**, **Calendar**, and **Tasks**. Together they extend existing Finance and Wishlist data without requiring a new backend, and they can demonstrate cross-module links while preserving the modular architecture.

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
