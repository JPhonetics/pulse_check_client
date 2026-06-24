# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # production build
npm run preview    # preview production build locally
npm run lint       # ESLint
```

No test runner is configured yet.

## Project Overview

**Pulse Check** is a news aggregator ("Your daily pulse on the world."). Users browse headlines by region (World / US / Local) and topic sub-category, search across all articles, and — when registered — save articles and searches.

The frontend is React 19 + React Router v7, bundled with Vite 8. **Stage 1 (mock data + mock auth) is complete.** Stage 2 will wire up a real backend API and auth service.

## Product Spec

`app_outline/user_journey_optimized.md` is the authoritative product spec — read it before implementing any feature. Key decisions locked there:

- **Article cards**: image, category, title, publish date, source, snippet. Save flag (bookmark) top-right. Clicking card body opens source in new tab.
- **Pagination**: numbered pages of 9 (3 × 3) across all paginated views.
- **Regions**: World / US / Local (Local requires a set location; triggers Set Local Region popup if unset).
- **Sub-categories**: All, Business, Crime, Entertainment, Health, Politics, Sports, Tech, Weather (defined in `src/components/ui/subcategories.js`).
- **Search**: searches title/description across all regions/sub-categories; mutually exclusive with active region/sub-category filtering (switching to a region tab exits search). Query is driven by the `?q=` URL param (via `useSearchParams`). `SearchPage` also exposes a date-range filter and an asc/desc sort toggle (`SortControl`).
- **Guest vs. registered**: guests can browse and set a local region (stored in browser); registered users can also save articles and searches.
- **Donate button**: Stripe-powered donation flow (on every page in the header).
- **Saved searches**: each card has a dedicated Search button (re-run) separate from the save flag (unsave).

Wireframes for every screen live in `app_outline/pages/` as PNGs. Consult them alongside the spec when building UI.

## Architecture

### Provider Stack (`src/main.jsx`)

```
BrowserRouter > AuthProvider > LocationProvider > SavedProvider > App
```

- **`AuthContext`** — `user` (null = guest), `login`, `register`, `logout`, `updateProfile`, `updatePassword`
- **`LocationContext`** — `localRegion` string (persisted to `localStorage` under key `pc_local_region`), `setLocalRegion`
- **`SavedContext`** — in-memory `savedArticleIds` (Set) and `savedSearches` (array); not yet persisted
  - Full API: `toggleSaveArticle(id)`, `isArticleSaved(id)`, `saveSearch(query)`, `unsaveSearch(id)`, `isSearchSaved(query)`, `getSavedSearchId(query)`

### Modal State (`src/App.jsx`)

All modals are managed in `App` via a single `modal` state: `null | 'auth' | 'location' | 'donate' | 'profile'`. Modal open/close calls flow down from `App` through props. `App` also owns the global `region` and `category` filter state and passes them to `Header` and `HomePage`.

`App` also holds `authInitScreen` (`'login' | 'register'`) which is forwarded to `AuthModal` as `initialScreen` so callers can open directly to the register tab if needed.

**`onAuthRequired` callback convention** (used throughout the tree): passing the string `'profile'` opens the profile modal directly; passing any other string (or no argument) opens the auth modal and uses the string as a contextual hint displayed to the user (e.g. `'Log in to save articles.'`).

### Services (`src/services/`)

All service modules expose stable async function signatures. Stage 1 internals are mocks; replace internals only in Stage 2 — callers do not change.

- **`articlesService.js`** — `getArticles`, `searchArticles`, `getArticlesByIds`; reads from `src/data/articles.json`
- **`authService.js`** — `login`, `register`, `requestPasswordReset`, `validateResetToken`, `setNewPassword`, `updateProfile`, `updatePassword`; in-memory accounts, seed: `demo@example.com / password`. In mock mode, any token passed to `validateResetToken` is valid **except** the literal string `'expired'` — navigate to `/password-reset/expired` to exercise the expired-token UI.
- **`paymentService.js`** — `initiateDonation({ amount })`; stub returning `{ ok: true, stub: true }`

**Stage 1 note**: `getArticles` / `searchArticles` / `getArticlesByIds` are currently synchronous (they read a local JSON import), so their callers use `useMemo` rather than `useEffect`+`useState`. Stage 2 will need to change callers to async data-fetching when the service internals become real `fetch` calls.

### Article Data Shape (`src/data/articles.json`)

Each article object has these fields — the contract between the service layer and all UI components:

```
id          string   e.g. "w-biz-1"
region      string   "World" | "US" | "Local"
category    string   e.g. "Business"
title       string
publishDate string   ISO 8601
source      string   e.g. "Reuters"
snippet     string   short description
imageUrl    string   URL
url         string   source article URL (opened in new tab on card click)
```

### Routing (`src/App.jsx`)

| Route | Component | Guard |
|---|---|---|
| `/` | `HomePage` | — |
| `/search` | `SearchPage` | — |
| `/saved-articles` | `SavedArticlesPage` | `ProtectedRoute` |
| `/saved-searches` | `SavedSearchesPage` | `ProtectedRoute` |
| `/password-reset/:token` | `PasswordResetPage` | — |
| `/verify-email/:token` | `VerifyEmailPage` | — |
| `/about` | inline `AboutPage` | — |
| `*` | `ErrorPage` | — |

`ProtectedRoute` (`src/router/ProtectedRoute.jsx`) redirects unauthenticated users to `/`.

### Pagination Reset Pattern

`HomePage` and `SearchPage` both reset to page 1 when their filter inputs change using React's render-time state adjustment (not `useEffect`). A `[prevFilters, setPrevFilters]` pair tracks the previous filter values; when they differ, `setPage(1)` is called during render. This is intentional — don't refactor it to `useEffect`.

### CSS Architecture

Each component has a co-located `.module.css` file (CSS Modules). Global design tokens are in `src/index.css`:

- **Color tokens** (semantic aliases over raw palette): `--bg`, `--surface`, `--text`, `--text-muted`, `--text-inverted`, `--border`, `--border-dark`, `--accent` (red `#C41E3A`), `--accent-hover`, `--nav-bg`, `--nav-text`
- **Raw palette**: `--color-navy` (#0B1D3A), `--color-navy-dark`, `--color-navy-light`, `--color-red`, `--color-gray-{50,100,200,300,400,500}`, `--color-white`
- **Font tokens**: `--font-heading` (Montserrat), `--font-body` (Open Sans)
- **Spacing scale**: `--space-{1,2,3,4,5,6,8,10,12}` (4 px increments)
- **Other tokens**: `--radius-{sm,md,lg,xl,full}`, `--shadow-{sm,md,lg,xl}`, `--transition-{fast,base}`
- **No dark mode** — there is no `prefers-color-scheme` media query
- **Root layout**: `#root` is `max-width: 1126px` (`--max-width`), flexbox column
- **Responsive breakpoints**: `max-width: 1024px` → 17 px → 15 px; `max-width: 640px` → 15 px → 14 px
- CSS nesting is used throughout — supported by Vite's PostCSS defaults

`src/App.css` is a starter-template artifact; it can be replaced or emptied.

### Other Conventions

- `public/icons.svg` is a sprite sheet; reference icons via `<use href="/icons.svg#icon-name">` (wrapped by `src/components/ui/Icon.jsx`).
- `src/components/ui/PasswordInput.jsx` is a reusable password field with a show/hide toggle — use it in any form that takes a password.
- `src/components/ui/SortControl.jsx` renders the asc/desc sort toggle button — used on `SearchPage` and available for other list views.
- `app_outline/` contains wireframes (PNG) and the product spec — not shipped to production.
- `src/data/locations.js` exports `searchLocations(query)` for the Local Region type-ahead (static list of ~80 US cities).

## Stage 2 Upgrade Checklist

When connecting a real backend:

1. Replace `authService.js` internals — function signatures stay the same
2. Replace `articlesService.js` internals — switch `getArticles`/`searchArticles` to fetch calls; update callers from `useMemo` to `useEffect`+`useState` (currently synchronous)
3. Replace `paymentService.js` `initiateDonation` with Stripe Checkout redirect
4. Persist `SavedContext` state to the backend (currently in-memory only)
5. `LocationContext` already persists to `localStorage` — no change needed
6. `axios` is already installed as a dependency — use it for API calls in service modules
7. `app_outline/db_schema.sql` contains the planned database schema for reference
