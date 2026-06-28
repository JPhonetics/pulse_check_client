# Pulse Check — Project Overview

> "Your daily pulse on the world."

---

## What Is Pulse Check?

Pulse Check is a full-stack news aggregator web application. Users can browse top headlines by region (World, US, or Local), filter by topic sub-category, search across all articles, and — when registered — save articles and searches for later. A Stripe-powered donation flow is also integrated for users who want to support the platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Vite 8 |
| Styling | CSS Modules + CSS custom properties (design tokens) |
| Backend | Supabase (PostgreSQL + Auth + REST API) |
| Edge Functions | Deno (TypeScript), hosted on Supabase |
| News Source | newsdata.io API |
| Payments | Stripe (Payment Intents API) |

---

## Repository Structure

The project is a monorepo with two independent sub-projects:

```
pulse_check/
├── client/       # React 19 frontend (Vite)
└── backend/      # Supabase schema, migrations, and Edge Functions
```

---

## Features

### Browse & Search
- **Three regions:** World, US, Local (Local requires a user-set city)
- **Nine sub-categories:** All, Business, Crime, Entertainment, Health, Politics, Sports, Tech, Weather
- **Article cards:** image, headline, source, publish date, snippet, and a bookmark button
- **Pagination:** 9 articles per page (3×3 grid), ordered by newest first
- **Article grouping:** Multiple outlets covering the same story are collapsed into one card showing a "N sources" badge. Clicking it opens a source picker so the user can choose which outlet to read.
- **Search:** Full-text search across title and description, with optional date-range filter and ascending/descending sort toggle

### Accounts & Saved Content
- **Guest users** can browse and set a local region (stored in the browser)
- **Registered users** can additionally:
  - Save and unsave articles (including entire source groups)
  - Save and re-run searches
  - Persist their local region across devices via their profile

### Donations
- Stripe-powered donation flow available from the header on every page
- Guests and logged-in users both supported (guest flow uses an anonymous token)

---

## Architecture

### Data Flow

```
newsdata.io
    ↓
get-news (Supabase Edge Function — Deno, service-role key)
    ↓ upserts
article_cache (PostgreSQL table — RLS blocks all client access)
    ↑ reads
newsService.js (client) → React components
```

The `get-news` Edge Function is the **only** path to `article_cache`. The client never reads or writes that table directly. This keeps the newsdata.io API key server-side and enforces cache freshness logic centrally.

### Frontend Provider Stack

```
BrowserRouter
  └── AuthProvider       (session, login, register, logout)
        └── LocationProvider  (local region, persisted to DB)
              └── SavedProvider    (saved articles + searches, Supabase)
                    └── App
```

### Backend (Supabase)

**Database tables:**

| Table | Purpose |
|---|---|
| `user` | User profiles — name, email, optional local region |
| `article_cache` | Cached news articles from newsdata.io |
| `saved_article` | Articles bookmarked by users (metadata stored inline so saves survive cache eviction) |
| `saved_search` | Keyword searches saved by users |
| `donations` | Stripe donation records |

**Row Level Security (RLS):** All user-facing tables enforce RLS — users can only read and write their own rows. `article_cache` has no client-facing policies at all; only the service-role Edge Function can touch it.

**DB Triggers:**
- On new auth user → auto-creates a `public.user` profile row
- On profile update → auto-sets `modified_date`
- On email change confirmed → syncs email to `public.user`

**Edge Functions:**

| Function | Purpose |
|---|---|
| `get-news` | Fetches from newsdata.io, caches in `article_cache`, groups by story, paginates |
| `process-donation` | Creates a Stripe Payment Intent and returns `client_secret` to the client |
| `stripe-webhook` | Handles Stripe webhook events and updates the `donations` table |

### Article Grouping

Multiple sources reporting the same story share a `group_key` (a normalized, punctuation-stripped version of the title). The Edge Function groups articles in memory by `group_key` before paginating. Each response item includes `sourceCount` and a `sources[]` array. The client uses this to render the "N sources" badge and `SourcePickerPopover`.

### Local Region Resolution

Because the news API has no city/state field, local news is synthesized via keyword search with a two-tier fallback:
1. Search the city name (e.g. `"Hacienda Heights"`)
2. If results are fewer than one page, widen to the state (e.g. `"California"`)

A banner is shown when the search widens: *"Limited results for {City} — showing {State} news."*

---

## Auth

- **Supabase Auth** manages credentials, email verification, and password reset emails
- **`AuthContext`** exposes `user`, `login`, `register`, `logout`, `updateProfile`, and `updatePassword` to the component tree
- On login, if the user had a guest local region set, a prompt asks whether to carry it over to their profile
- Protected routes (`/saved-articles`, `/saved-searches`) redirect unauthenticated users to the home page

---

## Routing

| Route | Page |
|---|---|
| `/` | Home — region/category browse |
| `/search` | Search results |
| `/saved-articles` | Saved articles (auth required) |
| `/saved-searches` | Saved searches (auth required) |
| `/password-reset/:token` | Password reset |
| `/verify-email/:token` | Email verification |
| `/about` | About page |

---

## External Services

| Service | Purpose |
|---|---|
| **newsdata.io** | Live article source (API key stored as Edge Function secret) |
| **Supabase** | Database, Auth, REST API, Edge Function hosting |
| **Stripe** | Donation payment processing |

---

## Development Status

All planned features are implemented and wired to production services:

| Area | Status |
|---|---|
| Article fetching via Edge Function + newsdata.io | Complete |
| Article grouping by source | Complete |
| Saved articles + searches (Supabase) | Complete |
| Supabase Auth (sign up, login, logout, password reset, email verification) | Complete |
| Location context — DB persistence + device sync | Complete |
| Donation flow — Stripe Payment Intents + webhook handler | Complete |
