# Ride-Match Pilot Smoke Checklist

## Authentication
- Sign up with email and password.
- Sign in with an existing account.
- Reload a protected page and confirm the session persists.
- Sign out and confirm protected pages redirect back to `/login`.

## Trip Lifecycle
- Create a trip in a joined community.
- Open the trip as the driver and confirm `Start trip` is disabled until the trip is within 30 minutes of `departure_time`.
- Start the trip inside the allowed window.
- Confirm the trip cannot move directly from `scheduled` or `full` to `completed`.
- Complete the trip only after it is `in_progress`.

## Booking Flow
- Book a seat as a passenger.
- Confirm seat counts drop and the passenger appears in the roster.
- Cancel the booking as the passenger.
- Confirm seat counts return and the roster marks the passenger as cancelled.

## Chat Integrity
- Send a free-text trip message as the driver.
- Send a free-text trip message as a confirmed passenger.
- Cancel the passenger booking while the passenger chat tab is open.
- Confirm the open chat view loses access and redirects away from the thread.
- Confirm direct Firestore reads for `messages` fail for the cancelled passenger after cancellation.

## Identity Truth
- Edit profile display name and avatar.
- Book a trip, cancel a booking, and send a message after editing the profile.
- Confirm notifications, trip activity, and chat message sender identity use the edited Firestore profile values.
- Sign out and sign back in, then confirm the edited profile values persist.
