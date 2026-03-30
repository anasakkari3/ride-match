import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import type { BookingsRow, TripsRow } from '@/lib/types';

type FirestoreDb = FirebaseFirestore.Firestore;

async function getTripOrNull(tripId: string, db: FirestoreDb): Promise<(TripsRow & { id: string }) | null> {
  const tripDoc = await db.collection('trips').doc(tripId).get();
  if (!tripDoc.exists) return null;

  return {
    ...(tripDoc.data() as TripsRow),
    id: tripDoc.id,
  };
}

async function getTripBookings(
  tripId: string,
  db: FirestoreDb
): Promise<Array<BookingsRow & { id: string }>> {
  const snap = await db.collection('bookings')
    .where('trip_id', '==', tripId)
    .get();

  return snap.docs.map((doc) => ({
    ...(doc.data() as BookingsRow),
    id: doc.id,
  }));
}

export async function hasDirectBlockRelationship(
  userId: string,
  otherUserId: string,
  passedDb?: FirestoreDb
): Promise<boolean> {
  const db = passedDb ?? getAdminFirestore();
  const [forwardDoc, reverseDoc] = await Promise.all([
    db.collection('user_blocks').doc(`${userId}_${otherUserId}`).get(),
    db.collection('user_blocks').doc(`${otherUserId}_${userId}`).get(),
  ]);

  return forwardDoc.exists || reverseDoc.exists;
}

export async function hasTripParticipantBlockConflict(
  userId: string,
  tripId: string,
  passedDb?: FirestoreDb
): Promise<boolean> {
  const db = passedDb ?? getAdminFirestore();
  const trip = await getTripOrNull(tripId, db);
  if (!trip) return false;

  const bookings = await getTripBookings(tripId, db);
  const activeParticipantIds = new Set<string>([trip.driver_id]);

  bookings
    .filter((booking) => booking.status === 'confirmed')
    .forEach((booking) => {
      activeParticipantIds.add(booking.passenger_id);
    });

  for (const participantId of activeParticipantIds) {
    if (participantId === userId) continue;
    if (await hasDirectBlockRelationship(userId, participantId, db)) {
      return true;
    }
  }

  return false;
}

export async function validateTripReportParticipants(input: {
  reporterId: string;
  reportedUserId: string;
  tripId: string;
  passedDb?: FirestoreDb;
}): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const db = input.passedDb ?? getAdminFirestore();
  const trip = await getTripOrNull(input.tripId, db);
  if (!trip) return { allowed: false, reason: 'trip_not_found' };

  const bookings = await getTripBookings(input.tripId, db);
  const participantIds = new Set<string>([trip.driver_id]);

  bookings.forEach((booking) => {
    if (booking.status === 'confirmed' || booking.status === 'cancelled') {
      participantIds.add(booking.passenger_id);
    }
  });

  if (!participantIds.has(input.reporterId)) {
    return { allowed: false, reason: 'reporter_not_participant' };
  }

  if (!participantIds.has(input.reportedUserId)) {
    return { allowed: false, reason: 'reported_user_not_participant' };
  }

  if (input.reporterId === input.reportedUserId) {
    return { allowed: false, reason: 'cannot_report_self' };
  }

  return { allowed: true };
}
