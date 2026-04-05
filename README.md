# Ride-Match

Ride-Match is a community-based ride coordination app built with Next.js, Firebase Authentication, and Cloud Firestore.

## Stack

- Next.js 16
- React 19
- Firebase Authentication
- Cloud Firestore
- Firebase Admin SDK for server-side access

## Environment Setup

Copy `.env.example` to `.env.local` and fill in all values.

### Required client environment variables

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Required server environment variables

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

`FIREBASE_PRIVATE_KEY` must preserve newline escapes exactly as shown in `.env.example`.

## Firebase Project Setup

1. Create a Firebase project.
2. Enable Authentication with Email/Password.
3. Create a Firestore database in production or test mode, then deploy this repo's Firestore rules and indexes before real usage.
4. Create a Firebase service account with Firestore access and copy its credentials into `.env.local`.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).

## Firestore Security and Index Deployment

This repo now commits the authoritative Firestore configuration:

- [firebase.json](./firebase.json)
- [firestore.rules](./firestore.rules)
- [firestore.indexes.json](./firestore.indexes.json)

Deploy them with Firebase CLI:

```bash
npx firebase-tools login
npx firebase-tools use <your-firebase-project-id>
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

## Authentication Model

- The browser signs in with Firebase Authentication.
- The app exchanges the Firebase ID token for a secure HTTP-only session cookie on the server.
- Server components, server actions, and backend services trust the session cookie.
- Sign-out clears the server session cookie and the browser Firebase Auth state.

## Chat Access Model

- Trip chat reads are enforced by Firestore security rules.
- Access is derived from deterministic documents in `trip_memberships/{tripId}_{userId}`.
- Drivers have `status: driver`.
- Active passengers have `status: confirmed`.
- Cancelled passengers are switched to `status: cancelled`.
- Firestore rules allow message reads only for `driver` and `confirmed` memberships.
- The chat UI uses realtime Firestore listeners. If a passenger is cancelled while the tab is open, their `trip_memberships` document updates in realtime and the client is redirected away. Direct Firestore reads also fail after cancellation because the rules deny access.

## Verification Commands

Run these before merge or deployment:

```bash
npm run build
npx tsc --noEmit
npm run lint
git diff --check
```

## Pilot Smoke Checklist

Use [pilot_smoke_checklist.md](./pilot_smoke_checklist.md) for the manual pilot pass:

- sign up / sign in / sign out
- create trip
- book seat
- cancel seat
- chat before and after cancellation
- trip start / complete enforcement
- profile edit persistence

## Deployment Notes

- Deploy Firestore rules and indexes before exposing chat or trip pages to real users.
- Deploy the Next.js app to a Node-compatible environment with the same Firebase environment variables used locally.
- After changing Firestore rules or indexes, redeploy them explicitly.
