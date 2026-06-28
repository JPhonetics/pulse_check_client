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

## Environment Variables

Copy `.env.example` to `.env` and fill in values before running:

```
VITE_SUPABASE_BASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_URL=https://your-project-id.supabase.co/rest/v1
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

`VITE_SUPABASE_BASE_URL` is used by `supabaseClient.js` (Supabase JS SDK for auth session management) and by `newsService.js` to build the Edge Function URL (`/functions/v1/get-news`). `VITE_SUPABASE_URL` is the REST base URL used by the axios `supabaseHttp` instance in `http.js`. `VITE_NEWSDATA_API_KEY` is no longer a frontend concern — it lives only as a server-side secret on the `get-news` Edge Function.

## Project Overview

**Pulse Check** is a news aggregator ("Your daily pulse on the world."). Users browse headlines by region (World / US / Local) and topic sub-category, search across all articles, and — when registered — save articles and searches.

The frontend is React 19 + React Router v7, bundled with Vite 8.

**Current state (hybrid):** Article fetching and saved-content operations use real Supabase + newsdata.io APIs. Auth is still the in-memory mock from Stage 1. `SavedContext` reads `user?.id` from `AuthContext` (null for guests); saved-content features are gated on being logged in.

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
- **`SavedContext`** — persisted to Supabase via `savedArticleService` / `savedSearchService`; uses optimistic updates with rollback on error
  - Article API: `toggleSaveArticle(article)`, `isArticleSaved(id)`, `savedArticles`, `savedArticleIds` (Set)
  - Group-aware API: `getGroupSaveState(groupKey, sourceIds)` → `'all'|'some'|'none'`; `saveGroup(sources)`, `unsaveGroup(articleIds)`, `toggleGroupSource(source, groupKey)`; `savedByGroup` (Map of groupKey → Set\<articleId\>)
  - Search API: `saveSearch(query, dateFrom, dateTo)`, `unsaveSearch(id)`, `isSearchSaved(query)`, `getSavedSearchId(query)`, `savedSearches`

### Modal State (`src/App.jsx`)

All modals are managed in `App` via a single `modal` state: `null | 'auth' | 'location' | 'donate' | 'profile'`. Modal open/close calls flow down from `App` through props. `App` also owns the global `region` and `category` filter state and passes them to `Header` and `HomePage`.

`App` also holds `authInitScreen` (`'login' | 'register'`) which is forwarded to `AuthModal` as `initialScreen` so callers can open directly to the register tab if needed.

**`onAuthRequired` callback convention** (used throughout the tree): passing the string `'profile'` opens the profile modal directly; passing any other string (or no argument) opens the auth modal and uses the string as a contextual hint displayed to the user (e.g. `'Log in to save articles.'`). When the auth modal opens, the current path is saved to `sessionStorage` under `pc_return_to` for post-login redirect.

**`RegionCarryoverModal`** is outside the `modal` state — it renders when `pendingRegionCarryover` is non-null in `AuthContext`. This triggers on login when the user had a guest local region set, prompting them to carry it over to their profile.

### Services (`src/services/`)

All service modules expose stable async function signatures. Replace internals in Stage 2 — callers do not change.

- **`supabaseClient.js`** — exports a single `supabase` client (Supabase JS SDK) used for auth session management. `http.js` imports it to attach the session JWT to every `supabaseHttp` request.
- **`http.js`** — exports one pre-configured axios instance: `supabaseHttp` (Supabase REST with `apikey` + `Authorization` headers; JWT attached via request interceptor).
- **`articlesService.js`** — re-exports `getArticles` and `searchArticles` from `newsService.js`; `getArticlesByIds` is retired (returns empty).
- **`newsService.js`** — thin client over the `get-news` Supabase Edge Function. `getArticles` calls with `mode=browse`; `searchArticles` calls with `mode=search`. The function owns all cache logic and newsdata.io access server-side.
- **`savedArticleService.js`** — `getSavedArticles`, `saveArticle`, `unsaveArticle`; bulk: `saveArticles` (POST array with `Prefer: resolution=ignore-duplicates`), `unsaveArticles(userId, articleIds)` (DELETE with `in.(...)` filter); all inserts write `group_key`; reads/writes Supabase `saved_article` table.
- **`savedSearchService.js`** — `getSavedSearches`, `saveSearch`, `unsaveSearch`; reads/writes Supabase `saved_search` table.
- **`authService.js`** — **still mock**: in-memory accounts, seed: `demo@example.com / password`. Replace internals in Stage 2 — function signatures stay the same. Any token passed to `validateResetToken` is valid **except** the literal string `'expired'` — navigate to `/password-reset/expired` to exercise the expired-token UI.
- **`paymentService.js`** — `initiateDonation({ amount })`; stub returning `{ ok: true, stub: true }`

### Article Data Shape

Each article object in the app has these fields — the contract between the service layer and all UI components:

```
id          string     e.g. "reuters-abc123"
region      string     "World" | "US" | "Local" | "Saved" | "Search"
category    string     e.g. "Business"
title       string
publishDate string     ISO 8601
source      string     e.g. "reuters" (representative source)
snippet     string     short description
imageUrl    string     URL
url         string     source article URL
groupKey    string     normalized group key (group_key ?? article_id from cache)
sourceCount number     count of syndicated sources in the group (≥ 1)
sources     object[]   all sources sorted a→z: { id, source, url, imageUrl, publishDate, title, snippet }
```

Cards with `sourceCount > 1` show a "N sources" badge and open a `SourcePickerPopover` on click. Single-source cards open the URL directly. `SourcePickerPopover` (`src/components/articles/SourcePickerPopover.jsx`) is anchored below the card via `position: absolute; top: 100%` inside a `position: relative` wrapper in `ArticleGrid`.

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

## Stage 2 Status

All Stage 2 backend wiring is complete:

| Item | Status |
|---|---|
| `newsService.js` — real newsdata.io + Supabase article cache | Done |
| `savedArticleService.js` / `savedSearchService.js` — real Supabase | Done |
| `SavedContext` — persisted to Supabase with optimistic updates | Done |
| `authService.js` — real Supabase auth (`signInWithPassword`, `signUp`, `updateUser`, etc.) | Done |
| `AuthContext` — session via `getSession` + `onAuthStateChange`; region carryover on SIGNED_IN | Done |
| `LocationContext` — loads DB profile region on login; persists on `setLocalRegion` | Done |
| `donationService.js` — calls `process-donation` Edge Function, returns `client_secret` | Done |
