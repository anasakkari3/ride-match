# onway — بطريقك

**A smart, community-centered ride coordination platform.**

Batreeqak ("on your way" in Arabic) transforms informal transportation coordination into a structured, trusted, and intelligent experience. Built for communities with recurring shared movement patterns — students, campuses, neighborhoods — where WhatsApp groups fail to provide reliability, safety, or scale.

---

## The Problem

Ride coordination in semi-closed communities is genuinely unsolved. Ride-hailing is too expensive for daily use. Public transit is often inadequate. Informal messaging is chaotic and trust-deficient. Batreeqak closes this gap with a system that gives community transportation the rigor, clarity, and user confidence that informal tools cannot.

---

## What It Does

Batreeqak is a coordination system built around five interacting layers:

**1. Trip Lifecycle Management**
Trips move through a well-defined state machine (`draft` > `scheduled` > `full` > `in_progress` > `completed`), with transitions validated on every operation. The system prevents premature state changes, handles seat accounting atomically, and automatically syncs trip status with real-time seat availability.

**2. Booking Integrity**
Every booking runs inside a Firestore transaction. Seat counts are atomically decremented, duplicate bookings are rejected, and cancellations restore capacity with a cap against the original total to prevent overflow.

**3. Permission System**
All user-facing actions (`canJoinTrip`, `canCancelBooking`, `canCancelTrip`, `canViewTripCommunication`, `canSendTripCommunication`, `canRateUser`) return typed `{ allowed: boolean; reason?: string }` objects with explicit reason codes, ensuring the frontend and backend always agree on what is allowed and why.

**4. Trip-Scoped Communication**
In-trip chat is gated by participation status. A passenger who cancels immediately loses read and write access. Visibility is enforced both at render time and at the server action layer. Firestore security rules provide an additional real-time enforcement boundary.

**5. Discovery and Matching**
Search is multi-factor: location match score (with multilingual normalization), time proximity penalty, seat availability bonus, and driver trust signals. Results are ranked and split into exact matches and intelligent recommendations.

---

## Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 4 |
| Runtime | React 19 |
| Backend | Firebase Admin SDK (Firestore) |
| Auth | Firebase Authentication (Email/Password) |
| Security | Firestore Security Rules + Row-Level Access |
| PWA | next-pwa (installable, offline-ready) |
| E2E Testing | Playwright |

### Key Architecture Decisions

**Firestore transactions for booking integrity.**
`bookSeat` and `cancelBooking` run entirely inside `db.runTransaction()`. Seat decrement, booking creation, trip status sync, and membership record update are atomic. Under concurrent booking attempts, only one transaction wins.

**State machine with explicit transition table.**
Trip lifecycle is defined as a static `TRIP_TRANSITIONS` record mapping each status to its valid successors. `canTransitionTripState(from, to)` is the single gate for all status changes.

**Permission layer as a first-class module.**
`lib/auth/permissions.ts` is a pure function module. Every permission check returns `PermissionDecision` with a reason code (`'duplicate_booking'`, `'community_membership_required'`, `'departed'`, `'invalid_status'`). These flow from the backend into structured log entries and user-facing errors.

**Symmetric block enforcement.**
Block lists are checked at two independent points: during `searchTrips` (filtered from results) and during `bookSeat` (checked inside the booking transaction). The shield holds even via direct URL access.

**Multi-factor search scoring.**
Results are ranked, not just filtered. The scoring model combines:
- Location match quality via normalized cross-language comparison
- Time penalty: `min(20, hoursAway * 0.5)` — deprioritizes distant trips
- Seat availability bonus: `min(5, seatsAvailable)` — favors easier booking
- Results split into exact matches (score 100) and ranked recommendations

**Location normalization.**
Origin and destination names pass through normalization before comparison, tolerating language variation, transliteration differences, and naming inconsistencies across Arabic, Hebrew, and English.

**Chat access via deterministic membership documents.**
`trip_memberships/{tripId}_{userId}` documents drive Firestore security rules. Cancellation flips the membership status in real-time, triggering client-side redirect and server-side access denial simultaneously.

**Observability.**
Structured warning logs (`logWarn`) capture permission denials and gate failures. Analytics events (`trackEvent`) instrument the funnel: `booking_attempted`, `booking_confirmed`, `trip_search`, `trip_results_shown`.

---

## Feature Modules

| Module | Description |
|---|---|
| Authentication | Email/Password auth, session cookies, protected routes |
| Community system | Create, join, and scope all activity to a community |
| Trip management | Create, edit, publish, and manage trip lifecycle |
| Booking flow | Reserve seats, cancel, view passenger roster |
| In-trip chat | Real-time messaging gated by participation and trip status |
| Driver coordination | Status signals: running late, arrived, confirmed |
| Ratings | Post-trip mutual rating with role-aware eligibility |
| Trust profiles | Driver completed rides, received ratings |
| Smart search | Multi-factor ranked search with recommendations |
| Discovery feed | Nearby and relevant trips surfaced without manual search |
| Admin analytics | Funnel metrics, daily activity, community insights |
| Notifications | In-app notifications for bookings, cancellations, updates |
| Multilingual | English, Arabic, Hebrew with full RTL support |
| PWA | Installable on mobile, designed for on-the-go use |

---

## Project Structure

```
app/
  (app)/            # Authenticated app shell
    app/            # Discovery feed, search, trip cards
    trips/          # Trip detail, chat, rating, coordination
    profile/        # User profile, settings, trust summary
    messages/       # Inbox with trip-scoped threads
    notifications/
  (auth)/           # Pre-auth flows (login, community selection)
  (public)/         # Public landing, privacy, terms, contact
  admin/            # Admin analytics and community management
  onboarding/       # New user onboarding flow

lib/
  trips/            # Lifecycle state machine, coordination, permissions
  auth/             # Session, permissions module, onboarding state
  services/         # Booking, matching, messaging, rating, trust, safety
  firebase/         # Firebase Admin and client configuration
  i18n/             # Internationalization, locale formatting, RTL
  observability/    # Structured logging
  brand/            # Brand configuration and multilingual meta
  types/            # Shared TypeScript type definitions
```

---

## Setup

### Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.

**Client-side (NEXT_PUBLIC_):**
`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`

**Server-side:**
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Deploy security rules and indexes:

```bash
npx firebase-tools login
npx firebase-tools use <project-id>
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

### Run

```bash
npm install
npm run dev              # development server
npm run build            # production build
npm run seed:system-community  # seed initial community
npm run smoke:e2e        # end-to-end smoke tests
```

### Verification

```bash
npm run build
npx tsc --noEmit
npm run lint
```

---

## Authentication Model

1. Browser signs in with Firebase Authentication
2. App exchanges Firebase ID token for a secure HTTP-only session cookie
3. Server components and actions trust the session cookie
4. Sign-out clears both server session and browser auth state

---

## Design Philosophy

- **Correctness over convenience.** Permissive logic that allows invalid actions erodes trust faster than UX friction. Every action is gated, every gate has a reason, and every reason is surfaced.
- **Community as context.** Trips, bookings, chat, and visibility are scoped to community membership. The platform serves closed or semi-closed groups, not generic marketplaces.
- **Reliability as a feature.** Atomic transactions, permission consistency, and lifecycle enforcement are the product. Users coordinate real transportation, and the system must not fail silently.

---

## Status

**Active product-hardening phase.** Core architecture is stable. Current focus:

- Visual polish and design system refinement
- Trip lifecycle edge case validation
- E2E smoke test coverage
- Discovery and homepage experience
- Onboarding flow completion

---

## Academic Context

> This section is relevant for academic evaluation. It can be skipped for portfolio or product review.

**Objectives.** Design and implement a production-grade platform that solves a real-world transportation coordination problem through system design, backend correctness, and user-centered product thinking.

**Methodology.** Iterative full-stack development with explicit tradeoff analysis. System design decisions (state machines, permission layers, transactional integrity) were made against clearly identified alternatives. QA includes structured smoke testing and permission boundary validation.

**Technical scope.** Full-stack application covering authentication, authorization, data integrity, real-time communication, analytics instrumentation, multilingual support, and PWA delivery.

**Evaluation criteria.** Problem definition, system architecture decisions, implementation correctness, scalability considerations, and product-level thinking beyond basic functionality.
