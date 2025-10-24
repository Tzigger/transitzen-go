# ZeroWait — Hackathon Presentation

This deck is written as slide-ready content. Copy one section per slide.

## 1) Title & Team

- Project: ZeroWait
- One-liner: "We buy you time by telling you exactly when to leave for public transit—so you wait under 1 minute at the stop."
- Team & roles:
  - Product/PM: Tigaieriu Andrei
  - UI/UX: Catanescu George
  - Full‑stack devs: Apetroae Tudor, Tigaieriu Andrei, Catanescu George
- Stack (ship-ready today): React + Vite, TypeScript, Tailwind, shadcn/ui, Leaflet; Convex (self‑hosted) real‑time backend; Capacitor shell for mobile; Supabase functions (legacy); PWA-first.

## 2) Problem

- Public transport users in Iași waste time guessing when to leave and which vehicle to catch.
- Waiting in cold or rain is frustrating; buses/trams get crowded and ETAs vary.
- Concrete example: Student needs to reach class at 08:00; leaves too early and waits 9–12 minutes at the stop, or too late and misses the tram.

## 3) Why it matters

- Time loss adds up (10–20 min/day → ~60–90 hours/year per commuter).
- Comfort and safety drop when people wait outside longer than needed.
- Predictability and clear guidance grow public transit usage and satisfaction.

## 4) Solution (simple statement)

Our app calculates the precise departure time from your location, nudges you when to leave, guides you door‑to‑stop‑to‑destination in real time, and lets you show a valid ticket from your phone.

## 5) How it works (today)

- Real‑time map and active journey navigation
  - Component: `src/components/ActiveJourneyMap.tsx` renders the route with step states (walking vs transit) and live user position.
- Stop arrivals in real time
  - Component: `src/components/StopArrivalsDrawer.tsx` computes incoming vehicles for a selected stop and estimates minutes to arrival from GPS distance and speed.
- Tickets and wallet
  - Components: `TicketQRCode.tsx`, `Wallet.tsx` manage issued tickets and generate secure rotating QR codes every 30s for validation.
- Convex backend
  - Collections: profiles, journeys, notifications, favorite routes, payment methods, wallet transactions, tickets.
  - Type‑safe queries/mutations under `convex/` with generated types in `convex/_generated/`.

## 6) What’s unique vs. typical transit apps

- “Leave in X minutes” focus: minimizes outdoor waiting (target under 1 minute at the stop).
- Clean, mobile‑first UI with active journey view and themed maps.
- Self‑hosted Convex for real‑time updates, fast iterations, and privacy.
- Ticket QR rotation for anti‑replay without a heavy server dependency.

## 7) Demo / Key features

Show live or with screenshots/GIFs:
- Create a journey: pick origin/destination → see route segments on the map.
- Tap a stop → arrivals drawer lists the next vehicles with minute estimates.
- Start navigation → active journey map highlights current step; recenter to location.
- Open Wallet → tap a ticket → rotating QR appears for validation.
- Bonus: Favorite a route; view journey history and profile.

Backup plan: Pre‑recorded GIF of (1) arrivals, (2) active journey, (3) ticket QR.

## 8) AI/ML role (current and next)

- Today: lightweight prediction uses distance + current speed to estimate arrivals; heuristics pick the soonest viable option and compute the “leave by” time.
- Next (planned in `openspec/changes/`):
  - Smart departure notifications that adapt to drift in live data.
  - Realtime journey navigation with dynamic re‑routing.
  - Learning model from historical delays/headways for better ETAs and crowding estimates.

## 9) Impact

- Relevant problem size: tens of thousands of daily riders in Iași; solution generalizes to other cities using GTFS‑realtime.
- Potential to scale: PWA + Capacitor + Convex enable fast rollouts per city; add API adapters per operator.
- User value: punctual arrivals, less time outdoors, awareness of crowding and accessibility.

## 10) Implementation status (prototype)

- Working prototype with:
  - Real‑time map and stop arrivals (Leaflet + Convex data flows).
  - Tickets + rotating QR codes; wallet and history.
  - Auth via Convex client hooks; schema deployed locally.
- Mobile‑ready UI and navigation; runs as PWA or native shell.
- What’s left to polish: profile/journeys migration from legacy Supabase pieces; production push notifications; payment rails.

---

# Judge Rubric Mapping

Use this checklist to make it easy for evaluators to score.

## Creativity & Innovation (30%)
- Original angle: “Leave in X minutes” promise to minimize wait (comfort‑first, not just ETAs).
- Practical AI use today (heuristics) with a clear path to ML‑powered predictions and crowding estimation.
- OpenSpec change pipeline in `openspec/changes/` to inspire further development.

## Impact (20%)
- Addresses a common, high‑friction problem for a large audience (daily commuters).
- Clear path to city‑by‑city scaling using GTFS/GTFS‑realtime.

## Implementation (40%)
- Delivered prototype: live map, arrivals drawer, active journey view, tickets with rotating QR, Convex backend and types.
- Technically feasible now; adapts to constraints (mobile performance, API rate limits, privacy).
- Demonstrable value: reduces outdoor waiting, improves predictability and UX.

## Presentation (10%)
- Keep to 8–10 slides, emphasize visuals of: arrivals, active journey, ticket QR.
- Explain problem → solution → demo; highlight the AI angle and what ships next.
- Present as a collaborative, structured pitch; keep backup GIFs for no‑internet rooms.

---

# Quick Demo Script (2–3 minutes)

1) Open app on phone or simulator.
2) Tap map → select a nearby stop → show arrivals with minutes.
3) Choose a route → start navigation → highlight walking vs. transit segments.
4) Open Wallet → show an active ticket and the rotating QR.
5) End with the tagline: “ZeroWait tells you exactly when to leave so you don’t wait around.”

