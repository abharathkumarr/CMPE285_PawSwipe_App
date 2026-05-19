# PawSwipe

Swipe-to-vote mobile app for **CMPE 282**. Users browse adoptable pets one card at a time, swipe right for “I’d adopt” or left to pass, and see how everyone else voted. Built with **Expo SDK 54** and **Supabase** (Postgres as the source of truth).

> The brief asked for mobile web; this repo uses **React Native / Expo** (Expo Go, simulator, or web).

## What it does

PawSwipe is themed around **adoptable pets** — photos, names, and short bios on each card. Sign in, vote through the deck, then check **Results** for community rankings, **Analytics** for swipes/sessions/timing charts, and **Matches** for pets you liked that at least 60% of voters also liked. You can undo your last vote; each user gets one vote per pet.

Core pieces: 110+ seeded pets, gesture swipe deck + Yes/No buttons, email login (no Supabase Auth emails), seed scripts for items and demo votes, and basic analytics (total swipes, sessions, average decision time).

## Run locally

1. Create a [Supabase](https://supabase.com) project and run `supabase/migrations/001`, `002`, and `003` in the SQL editor (enable **pgcrypto** if user seeding fails).

2. Add a `.env` file (do not commit):

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

3. Install, seed, and start:

```bash
npm install
npm run seed
npm run seed-demo-votes
npm run seed-user
npx expo start --clear
```

**Test accounts** (`npm run seed-user`):

- `demo@pawswipe.app` / `password123` (username: demo)
- `bharath@pawswipe.app` / `password123` (username: bharath)

## Stack

Expo Router · React Native · Supabase Postgres · custom email/password in `users` table · SecureStore sessions

## Requirements checklist

See [REQUIREMENTS_CHECKLIST.pdf](REQUIREMENTS_CHECKLIST.pdf) for a short summary of which CMPE 282 core and stretch requirements are met.

## AI notes

See [AI_NOTES.md](AI_NOTES.md).
