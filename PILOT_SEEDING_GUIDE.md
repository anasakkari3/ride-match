# Recurring Trips — Pilot Seeding & Operator Guide

## Purpose

This guide helps operators seed realistic recurring trips for the ride-match pilot.
It also explains how recurring trips work internally and what to watch for in production.

---

## Architecture Summary

Recurring trips in this MVP are **normal trip records** with extra metadata.

| Field | One-time | Recurring |
|---|---|---|
| `trip_mode` | absent / `"one_time"` | `"recurring"` |
| `recurring_days` | absent | `[1, 2, 4]` (0=Sun…6=Sat) |
| `recurring_departure_time` | absent | `"07:30"` (HH:MM 24h) |
| `departure_time` | Caller-provided ISO datetime | **Service-computed** next occurrence ISO |

> **No automation.** Drivers re-publish manually each period. There is no template system, no auto-renewal, and no subscription engine. This is an explicit MVP pilot constraint.

---

## How `departure_time` Is Set for Recurring Trips

At creation, `lib/services/trip.ts` calls `getNextOccurrence(recurringDays, recurringDepartureTime)`, which:

1. Starts scanning from "now + 5 minutes."
2. Steps forward day-by-day (up to 14 days) looking for a matching weekday.
3. Sets the time to the given HH:MM and returns the first future occurrence.

All existing lifecycle guards (30-min start window, past-check) apply unchanged to this computed datetime.

---

## Running the Seed Script

### Prerequisites

- Firebase Admin credentials JSON (service account)
- A verified community ID from your Firestore `communities` collection
- A verified driver user ID with a complete profile

### Steps

```bash
# Set credentials
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
$env:FIRESTORE_COMMUNITY_ID = "your-community-id"
$env:FIRESTORE_DRIVER_ID = "your-driver-user-id"

# Run the script
npx ts-node scripts/seed-recurring-trips.ts
```

### What It Creates

The script seeds **3 realistic recurring trips**:

| Route | Days | Time | Seats | Price |
|---|---|---|---|---|
| Tel Aviv University → Jerusalem Central | Sun–Thu | 07:30 | 3 | ₪30 |
| Modiin → WeWork Tel Aviv | Sun–Thu | 08:00 | 2 | ₪25 |
| Haifa Bat Galim → Technion | Sun/Tue/Thu | 08:30 | 3 | Free |

Each trip is created with:
- `trip_mode: "recurring"`
- Correct `recurring_days` and `recurring_departure_time`
- A computed `departure_time` (next valid occurrence)
- A driver trip membership record

---

## What Riders See

On **TripCard** (discovery feed), recurring trips display:
- Time from `departure_time` (next occurrence)
- `↻ Recurring` badge next to the time
- Full schedule summary: `Mon · Wed · Fri · 07:30 AM`
- Violet left accent bar instead of the usual sky/amber color

On **TripDetailClient** (trip page):
- `↻ Recurring` badge below the time/date header with full schedule
- A **Schedule** row in the Ride Details section showing the full summary

On **CreateTripForm** (driver creates trip):
- "Trip type" toggle: One-time / ↻ Recurring
- Weekday chip selectors (Mon-first order)
- Fixed time input
- Live "Recurring schedule" preview before publishing

---

## Defensive Behavior

All recurring metadata is **optional** in TypeScript types and **never crashes** if absent:

- `isRecurringTrip()` returns `false` for any incomplete metadata
- `formatRecurringSummary()` returns `''` for invalid inputs
- `sanitizeWeekdays()` returns `[]` for bad data
- All UI components use optional chaining (`?.`) and conditional rendering

Old one-time trips render exactly as before — no behavioral change.

---

## QA Checklist (Pilot Readiness)

### Create trip — recurring flow
- [ ] Visit `/trips/new` while logged in as a verified driver
- [ ] Select a community, enter origin and destination
- [ ] Click "↻ Recurring" button — verify departure time section changes to weekday chips + time input
- [ ] Click "Mon", "Wed", "Fri" chips — verify they highlight in violet
- [ ] Enter a time (e.g., 07:30) — verify the "Recurring schedule" preview updates
- [ ] Click "↻ One-time" — verify it switches back to the datetime picker
- [ ] Submit a recurring trip — verify redirect to trip detail page with `?created=1`

### Trip card — recurring display
- [ ] Navigate to the discovery feed or home page
- [ ] Find the recurring trip card
- [ ] Confirm: time is shown, `↻ Recurring` badge is visible, days+time summary is on a second line
- [ ] Confirm old one-time trip cards are unchanged

### Trip detail — recurring section
- [ ] Open a recurring trip's detail page
- [ ] Confirm `↻ Recurring` badge appears below the time header
- [ ] Confirm the **Schedule** row appears in Ride Details

### Backward compatibility
- [ ] Open an old one-time trip — confirm no crash, no recurring UI elements shown
- [ ] Book the old trip — confirm booking flow works identically

---

## Known Constraints (By Design)

- **No auto-renewal.** Drivers re-publish manually for new periods.
- **No multi-instance creation.** One trip document per published occurrence.
- **No live tracking.** Out of scope for this pilot.
- **No public launch support.** Pilot is closed/verified communities only.
