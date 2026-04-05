# E2E Smoke Coverage

## Purpose

`npm run smoke:e2e` is a minimal browser-driven smoke suite for the current community model.

It covers:

- open community join
- approval-required join request
- admin approval
- trip creation
- booking
- chat send
- report submission
- admin report resolution
- booking cancellation
- post-cancellation chat denial
- outsider trip access denial
- outsider admin access denial

## Prerequisites

1. Install browsers once:

```bash
npm run smoke:e2e:install
```

2. Start the app locally:

```bash
npm run dev
```

3. Make sure Firebase Admin env vars are available in `.env.local`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

The script reads `.env.local` and `.env` automatically.

## Run

```bash
npm run smoke:e2e
```

Optional overrides:

- `SMOKE_BASE_URL=http://127.0.0.1:3001 npm run smoke:e2e`
- `PLAYWRIGHT_HEADLESS=false npm run smoke:e2e`

## Pass Criteria

The script exits `0` only if all of these checks pass:

1. Admin, driver, rider, and outsider can sign in.
2. Driver can join the open community.
3. Rider can join the open community.
4. Rider can request access to the approval-required community.
5. The request stays pending and does not create membership early.
6. A non-admin cannot keep access to `/admin/communities`.
7. An admin can approve the pending request.
8. Approval creates the rider membership.
9. Driver can create a trip in the open community.
10. An outsider gets a `404` for the trip page.
11. Rider can book the trip.
12. A booked rider can open trip chat and send a message.
13. A trip participant can submit a report.
14. A community admin can resolve that report.
15. Rider can cancel the booking.
16. After cancellation, the rider is redirected away from trip chat.

## Fail Criteria

The script exits non-zero if any of the following happen:

- the app is not reachable
- Firebase Admin env is missing
- any UI action fails
- any permission denial is weaker than expected
- any backend assertion about membership, requests, reports, or redirects fails

## Data Created

Each run creates unique smoke-test users and communities using a timestamped run id.

Artifacts created in Firebase:

- four auth users
- four `users` docs
- one open community
- one approval-required community
- admin memberships for both
- one test trip
- one join request
- one booking
- one report

The script does not delete these records automatically.
