# PawSwipe — Swipe-to-Vote (Expo SDK 54 + Supabase)

**Theme:** Adoptable pets — swipe right to say you’d adopt (yes), left to pass (no).

Mobile app built with **React Native (Expo SDK 54)** and **Supabase Postgres** as the source of truth for votes aggregated across all users.

> **Note on assignment format:** The brief targets a *mobile web* app (390×844). This repo uses **React Native / Expo** as requested. Demo with Expo Go on a phone, iOS Simulator, or `npm run web`.

## Quick start

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run migrations **in order**:
   - [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
   - [`supabase/migrations/002_simple_login.sql`](supabase/migrations/002_simple_login.sql)
   - [`supabase/migrations/003_vote_upsert_constraint.sql`](supabase/migrations/003_vote_upsert_constraint.sql)
3. Enable **pgcrypto** under Database → Extensions if `gen_salt` errors appear when seeding users.

### 2. Environment

Create a `.env` file in the project root with values from **Project Settings → API**:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # seed scripts only — never ship in the app
```

### 3. Install & seed

```bash
npm install
npm run seed                  # 110 pets into items table
npm run seed-demo-votes       # ~3,600 fake community votes (Results/Matches)
npm run seed-user             # demo@pawswipe.app / password123
```

Optional — refresh pet photos from APIs:

```bash
npm run generate-items   # fetches dog.ceo + thecatapi URLs
npm run seed
```

### 4. Run the app

```bash
npx expo start --clear
```

Then open in **Expo Go** (scan QR), press `i` for iOS Simulator, or `w` for web.

**Demo login:** `demo@pawswipe.app` / `password123`  
Or sign up with any email + username (no email confirmation required).

---

## Architecture

- **Client:** Expo Router — Login, Vote (swipe deck), Results, Matches tabs.
- **Backend:** Supabase Postgres (`items`, `votes`, `users`, `analytics_events`) + view `item_results`.
- **Auth:** Simple email/password stored in `public.users` with bcrypt (`pgcrypto`). Session saved on device via SecureStore. **No Supabase Auth** (avoids email rate limits / confirm-link issues).
- **API mapping** (assignment names → implementation):

| Spec endpoint | Implementation |
|---------------|----------------|
| `GET /items` | `supabase.from('items').select(...)` → `fetchItems()` |
| `POST /vote` | `votes` insert/update on `(item_id, user_id)` → `submitVote()` |
| `GET /results` | `supabase.from('item_results').select(...)` → `fetchResults()` |

**Idempotency / dedup:** `UNIQUE (item_id, user_id)` on logged-in votes. App checks for existing row then updates or inserts (one vote per user per pet).

**Persistence choice:** Supabase Postgres — managed SQL, aggregates via view, RLS for anon client, no custom server to deploy under time pressure.

**Images:** Real photos via `npm run generate-items` ([dog.ceo](https://dog.ceo), [The Cat API](https://thecatapi.com)). Fallback seed uses [picsum.photos](https://picsum.photos) placeholders.

---

## Requirements checklist

### Core (3.1)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Theme in README | ✅ Adoptable pets |
| 2 | 100+ items with image + label/description | ✅ 110 in `supabase/seed/items.json` |
| 3 | Swipe UI + Yes/No buttons, tilt/tint/threshold, next card | ✅ `SwipeDeck` |
| 4 | Results view (tab + swipe down), sort/filter | ✅ Most loved / divisive / fewest votes |
| 5 | Backend source of truth | ✅ Supabase |
| 6 | End-of-deck state | ✅ Home screen |

### Stretch (3.2)

| # | Feature | Status |
|---|---------|--------|
| 7 | User identity (email login + persisted session) | ✅ |
| 8 | Undo last swipe | ✅ |
| 9 | Matches view (≥60% global yes) | ✅ |
| 10 | Real-time results (polling 5s) | ✅ |
| 11 | Seed script for items | ✅ `npm run seed` |
| 12 | Basic analytics | ✅ swipe count, sessions, avg decision ms |

### Out of scope (per brief)

Production deployment, custom domains, and CI/CD are not required. Local demo via Expo Go is sufficient.

---

## Project structure

```
app/
  login.tsx           # email/password sign in & sign up
  (tabs)/
    index.tsx         # swipe home — Hi {username}, sign out
    results.tsx       # community aggregates
    matches.tsx       # your yes + high community yes rate
src/
  lib/api.ts          # items, votes, results
  lib/authApi.ts      # login_user / register_user RPCs
  contexts/AuthContext.tsx
supabase/migrations/  # 001, 002, 003 SQL
scripts/              # seed, seed-demo-votes, seed-user, generate-items
```

---

## Known issues

- First image load depends on network.
- `npm run generate-items` needs internet and ~30s.
- Web swipe feel may differ slightly from a physical device.
- Demo votes use `session_id` like `demo-voter-001`; your votes use `user_id`.

---

## AI usage

See [`AI_NOTES.md`](AI_NOTES.md).
