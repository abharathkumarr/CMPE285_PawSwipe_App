# PawSwipe — Two-part demo script

**Part 1:** Talk on camera (or voiceover) — project overview, no app required.  
**Part 2:** Screen recording — live walkthrough of the app.

Total time: about **8–10 minutes** (3–4 min overview + 5–6 min app).

---

# PART 1 — Project overview (say this first, ~3–4 min)

*You can record this facing the camera, or over a title slide. You do not need the app open yet.*

---

### Opening (20 sec)

“Hi, I’m **[your name]**. For CMPE 285 I built **PawSwipe** — a mobile swipe-to-vote app where users decide yes or no on adoptable pets, and the whole class shares one source of truth in the database.”

---

### The assignment idea (40 sec)

“The assignment is a **swipe-to-vote** pattern: one item at a time, a binary choice, and a backend that stores everyone’s answers so results are global, not stuck on one phone.

I chose the theme **adoptable pets** because photos and short bios make each card interesting, and yes/no maps naturally to ‘I’d adopt’ versus ‘pass.’ It feels like a small adoption discovery app, not a generic poll.”

---

### What I built (1 min)

“**PawSwipe** has four main areas:

1. **Vote** — swipe deck with gestures and Yes/No buttons, plus undo.  
2. **Results** — community rankings with yes/no counts and percentages.  
3. **Analytics** — total swipes, sessions, average decision time, and charts.  
4. **Matches** — pets you liked that at least sixty percent of voters also liked.

Under the hood there are **over 110 pets** in the database, **one vote per user per pet**, and seed scripts so Results and Matches look real during the demo.”

---

### Tech & backend (1 min)

“I used **Expo SDK 54** and **React Native** so I could demo on a real phone with Expo Go, not only in a browser.

The backend is **Supabase Postgres** — no custom server. Items and votes live in SQL tables; results come from a view that aggregates yes and no counts. Login is a simple **users** table with hashed passwords, because Supabase Auth email links were unreliable on mobile for a class demo.

The assignment’s REST shape maps to Supabase calls: get items, post vote, get results. Analytics events log swipes, sessions, and timing for the Analytics tab.”

---

### Stretch goals & trade-offs (40 sec)

“I implemented the stretch pieces: **user login**, **undo**, **matches**, **polling results**, **seed scripts**, and **basic analytics**.

One trade-off: the brief asked for mobile **web**; I shipped **native Expo** for a better swipe feel on a phone. Another: for time, auth trusts the client user id with RLS — fine for a class project, not for production.”

---

### Transition to the app (15 sec)

“That’s the overview. Next I’ll walk through the running app — sign in, swipe a few pets, and show Results, Analytics, and Matches.”

*[Stop Part 1 recording. Start Part 2 with the app open.]*

---

# PART 2 — App walkthrough (screen recording, ~5–6 min)

### Before you hit record

```bash
npm run seed
npm run seed-demo-votes
npm run seed-user
npx expo start --clear
```

- App on **login** screen.  
- Account ready: **bharath@pawswipe.app** / **password123**

---

### 1. Sign in (30 sec)

**Do:** Enter email and password → Sign in.

**Say:**  
“Here’s the login screen. I’ll sign in as bharath — the session is saved on the device so I stay logged in.”

**Show:** Home — **Hi, bharath** and the first pet card.

---

### 2. Vote tab (1½ min)

**Do:** Swipe **right** on one pet. Swipe **left** on another. Tap **Yes** or **No** on a third.

**Say:**  
“This is the core loop — one pet per card with photo, name, and description. Swipe right for adopt, left for pass, or use the buttons. You can see the card tilt and color feedback.”

**Do:** Tap **Undo**.

**Say:**  
“Undo deletes my last vote in Supabase so I can vote again on that pet. Progress shows how many pets I’ve finished.”

---

### 3. Results tab (1 min)

**Do:** Open **Results**. Tap sort chips: Most loved → Most divisive → Fewest votes.

**Say:**  
“Results pull from every vote in the database, including seeded demo voters. Each row shows yes percentage and counts. Sorting changes the order; the list refreshes on a timer during the demo.”

---

### 4. Analytics tab (1 min)

**Do:** Open **Analytics**. Scroll through stat cards and charts.

**Say:**  
“The Analytics tab shows total swipes, sessions, average decision time, and undos. The donut charts split yes versus no; the bar charts show how long people spend deciding. This uses our analytics events table plus decision time on each vote.”

---

### 5. Matches tab (1 min)

**Do:** Open **Matches**.

**Say:**  
“Matches are pets I voted yes on where the community yes rate is at least sixty percent — my taste aligned with the crowd.”

**If empty:** Swipe yes on a few pets that are high in Results, open Matches again, pull to refresh.

**Say:**  
“After a few yes votes on popular pets, matches show up here.”

---

### 6. Sign out & closing (30 sec)

**Do:** Vote tab → **Sign out** (optional).

**Say:**  
“That’s PawSwipe — swipe voting, shared results, analytics, and matches, all backed by Supabase. Setup and code are in the GitHub repo. Thanks for watching.”

---

# Cheat sheet (keep on second monitor)

| Part | Time | What |
|------|------|------|
| 1 Overview | ~3–4 min | Concept, features, stack, trade-offs — **no app** |
| 2 App | ~5–6 min | Login → Vote → Results → Analytics → Matches |

**Login:** bharath@pawswipe.app / password123

**If something breaks:** `npm run seed` · `npm run seed-demo-votes` · `npm run seed-user`
