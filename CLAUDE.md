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

The frontend is React 19 + React Router v7, bundled with Vite 8. The codebase is at the bootstrapped template stage; `src/App.jsx` is still the default Vite starter. All feature work is ahead.

## Product Spec

`app_outline/user_journey_optimized.md` is the authoritative product spec — read it before implementing any feature. Key decisions locked there:

- **Article cards**: image, category, title, publish date, source, snippet. Save flag (bookmark) top-right. Clicking card body opens source in new tab.
- **Pagination**: numbered pages of 9 (3 × 3) across all paginated views.
- **Regions**: World / US / Local (Local requires a set location; triggers Set Local Region popup if unset).
- **Sub-categories**: All, Business, Crime, Entertainment, Health, Politics, Sports, Tech, Weather.
- **Search**: searches title/description across all regions/sub-categories; mutually exclusive with active region/sub-category filtering (switching to a region tab exits search).
- **Guest vs. registered**: guests can browse and set a local region (stored in browser); registered users can also save articles and searches.
- **Donate button**: Stripe-powered donation flow (on every page in the header).
- **Saved searches**: each card has a dedicated Search button (re-run) separate from the save flag (unsave).

Wireframes for every screen live in `app_outline/pages/` as PNGs. Consult them alongside the spec when building UI.

## Architecture Notes

- `src/main.jsx` renders `<App>` inside `StrictMode` — the router setup belongs here, not in App.jsx.
- `public/icons.svg` is a sprite sheet; reference icons via `<use href="/icons.svg#icon-name">`.
- `app_outline/` contains wireframes (PNG) and the product spec — not shipped to production.

## Tech Stack

| Layer | Library / Tool | Notes |
|-------|---------------|-------|
| UI | React 19 | Concurrent features available |
| Routing | React Router DOM v7 | Installed, not yet wired up |
| Build | Vite 8 | `@vitejs/plugin-react` with Oxc transform |
| Linting | ESLint flat config | `eslint.config.js`; includes react-hooks + react-refresh rules |
| Types | `@types/react`, `@types/react-dom` | Project is JSX (not TSX); types are available if TSX is adopted |

## CSS Architecture

`src/index.css` defines the global design token layer — read this before writing component styles:

- **Color tokens**: `--text`, `--text-h`, `--bg`, `--border`, `--code-bg`, `--accent` (purple)
- **Font tokens**: `--sans` (system-ui), `--heading`, `--mono`
- **Shadow tokens**: defined at root
- **Dark mode**: via `@media (prefers-color-scheme: dark)` — tokens flip automatically
- **Root layout**: `#root` is `max-width: 1126px`, flexbox column
- **Responsive breakpoint**: `max-width: 1024px` downsizes base font from 18 px → 16 px
- CSS nesting is used throughout — supported by Vite's PostCSS defaults

`src/App.css` and its styles are all starter-template artifacts; replace freely when building real components.

## Implementation Status

Everything below is TODO — no Pulse Check–specific code exists yet:

- **Routing** — React Router is installed but `<BrowserRouter>`/`<Routes>` are not set up
- **Global Header** — menu icon, date, location label (editable), Donate button, user icon, search box
- **Region tabs + sub-category row** — World / US / Local tabs; 9 sub-category chips
- **Article grid** — 3 × 3 paginated `ArticleCard` components
- **Search page** — date-range filter, sort toggle (newest/oldest)
- **Auth popups** — Login / Register (tabbed), password-reset flow, email verification
- **Account dropdown** — Update Profile (Profile & Password tabs), Logout
- **Set Local Region popup** — type-ahead with city/state/ZIP suggestions
- **Saved Articles page** — sort by publish-date or date-saved
- **Saved Searches page** — Search (re-run) and unsave per card
- **Sidebar / menu** — guest: About Us; registered: + Saved Articles, Saved Searches, Logout
- **API client** — no fetch/axios setup exists; backend URL unknown
- **Stripe integration** — donation flow, method TBD (Checkout redirect vs. embedded)

## Expected Routes

```
/                          Home — browse by region + sub-category
/search                    Search results
/saved-articles            Registered users only
/saved-searches            Registered users only
/password-reset/:token     Reset-password confirmation step
/verify-email/:token       Email verification
```

Error and "no results" states are defined in the spec; an `<ErrorPage>` component is expected.
