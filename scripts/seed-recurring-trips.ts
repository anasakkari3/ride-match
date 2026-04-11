#!/usr/bin/env node
/**
 * scripts/seed-recurring-trips.ts
 *
 * Pilot seeding script for recurring trips.
 *
 * Usage:
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path.
 *   2. Set FIRESTORE_COMMUNITY_ID to the target community ID.
 *   3. Set FIRESTORE_DRIVER_ID to a pre-existing verified driver user ID.
 *   4. Run: npx ts-node scripts/seed-recurring-trips.ts
 *
 * Architecture note:
 *   Each seed entry creates one Firestore trip document with recurring metadata.
 *   departure_time is set to the next computed occurrence from the fixed time + days.
 *   No subscription or auto-renewal system exists — each trip is a standalone record.
 *   Drivers must re-publish manually for each new period.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// ─── Config ───────────────────────────────────────────────────────────────────

const COMMUNITY_ID = process.env.FIRESTORE_COMMUNITY_ID;
const DRIVER_ID = process.env.FIRESTORE_DRIVER_ID;
const CREDENTIAL_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!COMMUNITY_ID || !DRIVER_ID || !CREDENTIAL_PATH) {
  console.error(
    '\n[seed-recurring-trips] Missing required environment variables.\n' +
    'Set FIRESTORE_COMMUNITY_ID, FIRESTORE_DRIVER_ID, and GOOGLE_APPLICATION_CREDENTIALS.\n'
  );
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(CREDENTIAL_PATH) });
}

const db = getFirestore();

// ─── Weekday helpers ──────────────────────────────────────────────────────────

type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

function getNextOccurrence(recurringDays: WeekdayIndex[], timeString: string): Date | null {
  if (!recurringDays.length) return null;
  const [hh, mm] = timeString.split(':').map(Number);
  const sortedDays = [...new Set(recurringDays)].sort((a, b) => a - b);
  const base = new Date();
  base.setSeconds(0, 0);

  for (let daysAhead = 0; daysAhead <= 14; daysAhead++) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + daysAhead);
    candidate.setHours(hh, mm, 0, 0);
    const weekday = candidate.getDay() as WeekdayIndex;
    if (!sortedDays.includes(weekday)) continue;
    if (candidate.getTime() > Date.now() + 5 * 60 * 1000) return candidate;
  }
  return null;
}

// ─── Sample trips ─────────────────────────────────────────────────────────────

const SAMPLE_RECURRING_TRIPS = [
  {
    origin_name: 'Tel Aviv University Station',
    origin_lat: 32.1135,
    origin_lng: 34.8044,
    destination_name: 'Jerusalem Central Bus Station',
    destination_lat: 31.7887,
    destination_lng: 35.2011,
    recurring_days: [0, 1, 2, 3, 4] as WeekdayIndex[], // Sun-Thu (Israeli work week)
    recurring_departure_time: '07:30',
    seats_total: 3,
    price_cents: 3000,
    vehicle_make_model: 'Toyota Corolla',
    vehicle_color: 'Silver',
    driver_note: 'Leave on time. Call when you reach the meeting point.',
    trip_rule_preset_keys: ['no_delay', 'no_smoking'],
    passenger_gender_preference: 'any',
  },
  {
    origin_name: 'Modiin HaMercaz Station',
    origin_lat: 31.8980,
    origin_lng: 34.9965,
    destination_name: 'WeWork Tel Aviv',
    destination_lat: 32.0680,
    destination_lng: 34.7863,
    recurring_days: [0, 1, 2, 3, 4] as WeekdayIndex[], // Sun-Thu
    recurring_departure_time: '08:00',
    seats_total: 2,
    price_cents: 2500,
    vehicle_make_model: 'Hyundai Tucson',
    vehicle_color: 'White',
    driver_note: 'Quiet ride preferred. Music off on request.',
    trip_rule_preset_keys: ['prefer_quiet', 'confirm_attendance'],
    passenger_gender_preference: 'any',
  },
  {
    origin_name: 'Haifa Bat Galim',
    origin_lat: 32.8296,
    origin_lng: 34.9736,
    destination_name: 'Technion – Israel Institute of Technology',
    destination_lat: 32.7775,
    destination_lng: 35.0218,
    recurring_days: [0, 2, 4] as WeekdayIndex[], // Sun/Tue/Thu
    recurring_departure_time: '08:30',
    seats_total: 3,
    price_cents: null,
    vehicle_make_model: 'Mazda 3',
    vehicle_color: 'Blue',
    driver_note: 'Free ride — same campus, happy to share.',
    trip_rule_preset_keys: ['fixed_meeting_point'],
    passenger_gender_preference: 'any',
  },
] as const;

// ─── Seed function ────────────────────────────────────────────────────────────

async function seedRecurringTrips() {
  console.log(`\n[seed-recurring-trips] Seeding ${SAMPLE_RECURRING_TRIPS.length} recurring trips...`);
  console.log(`  Community: ${COMMUNITY_ID}`);
  console.log(`  Driver: ${DRIVER_ID}`);
  console.log('');

  // Fetch community info
  const communityDoc = await db.collection('communities').doc(COMMUNITY_ID!).get();
  if (!communityDoc.exists) {
    console.error(`[seed-recurring-trips] Community not found: ${COMMUNITY_ID}`);
    process.exit(1);
  }
  const community = communityDoc.data()!;

  // Fetch driver info
  const driverDoc = await db.collection('users').doc(DRIVER_ID!).get();
  if (!driverDoc.exists) {
    console.error(`[seed-recurring-trips] Driver user not found: ${DRIVER_ID}`);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const createdIds: string[] = [];

  for (const trip of SAMPLE_RECURRING_TRIPS) {
    const departureDate = getNextOccurrence(
      trip.recurring_days as WeekdayIndex[],
      trip.recurring_departure_time
    );
    if (!departureDate) {
      console.warn(`  [SKIP] Could not compute next occurrence for "${trip.origin_name}" trip. Skipping.`);
      continue;
    }

    const doc = await db.collection('trips').add({
      community_id: COMMUNITY_ID,
      community_name: community.name ?? 'Community',
      community_type: community.type ?? 'verified',
      driver_id: DRIVER_ID,
      origin_lat: trip.origin_lat,
      origin_lng: trip.origin_lng,
      origin_name: trip.origin_name,
      destination_lat: trip.destination_lat,
      destination_lng: trip.destination_lng,
      destination_name: trip.destination_name,
      vehicle_make_model: trip.vehicle_make_model,
      vehicle_color: trip.vehicle_color,
      driver_note: trip.driver_note,
      trip_rule_preset_keys: trip.trip_rule_preset_keys,
      trip_rules_note: null,
      passenger_gender_preference: trip.passenger_gender_preference,
      departure_time: departureDate.toISOString(),
      seats_total: trip.seats_total,
      seats_available: trip.seats_total,
      price_cents: trip.price_cents ?? null,
      status: 'scheduled',
      created_at: now,
      // Recurring metadata
      trip_mode: 'recurring',
      recurring_days: trip.recurring_days,
      recurring_departure_time: trip.recurring_departure_time,
    });

    // Also create driver membership
    await db.collection('trip_memberships').doc(`${doc.id}_${DRIVER_ID}`).set({
      trip_id: doc.id,
      user_id: DRIVER_ID,
      role: 'driver',
      status: 'driver',
      updated_at: now,
    });

    console.log(`  [OK] Created trip ${doc.id}: "${trip.origin_name}" → "${trip.destination_name}"`);
    console.log(`       Days: [${trip.recurring_days.join(', ')}]  Time: ${trip.recurring_departure_time}`);
    console.log(`       Next occurrence: ${departureDate.toISOString()}`);
    createdIds.push(doc.id);
  }

  console.log('');
  console.log(`[seed-recurring-trips] Done. Created ${createdIds.length} trips.`);
  console.log('Created IDs:');
  createdIds.forEach((id) => console.log(`  /trips/${id}`));
}

seedRecurringTrips().catch((err) => {
  console.error('[seed-recurring-trips] Fatal error:', err);
  process.exit(1);
});
