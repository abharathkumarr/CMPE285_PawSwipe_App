# AI collaboration notes (required reflection)

## Which parts did Claude / Cursor write end-to-end?

- Expo SDK 54 project scaffold and `package.json` / config files.
- Supabase SQL migrations (`items`, `votes`, `users`, `item_results` view, RLS, login RPCs).
- Seed scripts: `seed.mjs`, `generate-items.mjs`, `seed-demo-votes.mjs`, `seed-user.mjs`.
- Client modules: `src/lib/api.ts`, `authApi.ts`, `AuthContext`, swipe components, all tab screens.
- Login flow, home header (“Hi, {username}”), sign out, Matches empty-state hints.
- This README and the requirements checklist.

## Where I pushed back / fixed AI output

**Example 1 — Supabase Auth email confirmation:**  
The first design used Supabase Auth with confirm-email links redirecting to `localhost:3000`, which failed on mobile (`otp_expired`, connection refused). I switched to **simple email/password** in a `users` table with Postgres `crypt()` — no confirmation emails, no rate limits for the class demo.

**Example 2 — Vote upsert error:**  
Postgres complained: *“no unique or exclusion constraint matching the ON CONFLICT specification.”* The AI used `upsert` with a partial unique index only. I added `votes_item_user_key` in migration 003 and changed the app to **update-or-insert** so voting works reliably.

**Example 3 — “0 of 0 pets” empty state:**  
When the database had no seeded items, the UI incorrectly showed “You’ve voted on everything!” I added `EmptyDatabaseScreen` and separated “no items in DB” from “deck finished.”

## Better vs worse than expected

- **Better:** Fast vertical slice (seed → swipe → vote → results) and consistent API-shaped Supabase queries. Gesture + Reanimated swipe deck was mostly correct after dependency fixes (`babel-preset-expo`, `react-native-worklets`, `react-native-get-random-values`).
- **Worse:** Assumed Supabase Auth and `localhost` redirects would “just work” on Expo Go. Underestimated partial unique indexes vs PostgREST upsert. Initial project restore after accidental folder loss required manual file recovery.

## Other AI tools

- **Cursor agent** — primary implementation, debugging, terminal/Expo runs, iterative fixes from screenshots and logs.

## What I verified myself

- Ran `npm run seed` and confirmed 110 items in Supabase Table Editor.
- Ran `npm run seed-demo-votes` and saw Results populate.
- Signed in as demo user and swiped yes/no; votes appear in Results.
- Swiped right on pets #1–25 and checked Matches after refresh.
- Tested undo and sign out / sign back in (votes persist per account).

*Edit the checklist above after you run through the app on your phone.*

## Honest gaps / trade-offs

- Passwords are checked via RPC with `security definer` — acceptable for a class project; production would need stricter rate limiting and HTTPS-only keys.
- RLS allows the anon key to insert votes with any `user_id` (client-trusted). Tighter design would use JWT or server-side session validation.
- Assignment asked for mobile **web**; we shipped **Expo native** per preference — note this in the demo.

