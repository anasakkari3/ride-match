import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getTripMembershipDocId } from '@/lib/trips/membership';
import type {
  BookingsRow,
  TripMembershipRole,
  TripMembershipStatus,
  TripMembershipsRow,
  TripsRow,
} from '@/lib/types';

type MembershipWriter = FirebaseFirestore.Transaction | FirebaseFirestore.WriteBatch;

type MembershipRecord = Pick<BookingsRow, 'passenger_id' | 'status'>;

function buildTripMembershipPayload(params: {
  tripId: string;
  userId: string;
  role: TripMembershipRole;
  status: TripMembershipStatus;
  updatedAt: string;
}): TripMembershipsRow {
  return {
    trip_id: params.tripId,
    user_id: params.userId,
    role: params.role,
    status: params.status,
    updated_at: params.updatedAt,
  };
}

function setTripMembership(
  writer: MembershipWriter,
  ref: FirebaseFirestore.DocumentReference,
  data: TripMembershipsRow
) {
  if ('commit' in writer) {
    writer.set(ref, data, { merge: true });
    return;
  }

  writer.set(ref, data, { merge: true });
}

export function queueDriverTripMembership(params: {
  db: FirebaseFirestore.Firestore;
  writer: MembershipWriter;
  tripId: string;
  driverId: string;
  updatedAt: string;
}) {
  const ref = params.db
    .collection('trip_memberships')
    .doc(getTripMembershipDocId(params.tripId, params.driverId));

  setTripMembership(
    params.writer,
    ref,
    buildTripMembershipPayload({
      tripId: params.tripId,
      userId: params.driverId,
      role: 'driver',
      status: 'driver',
      updatedAt: params.updatedAt,
    })
  );
}

export function queuePassengerTripMembership(params: {
  db: FirebaseFirestore.Firestore;
  writer: MembershipWriter;
  tripId: string;
  passengerId: string;
  status: Extract<TripMembershipStatus, 'confirmed' | 'cancelled'>;
  updatedAt: string;
}) {
  const ref = params.db
    .collection('trip_memberships')
    .doc(getTripMembershipDocId(params.tripId, params.passengerId));

  setTripMembership(
    params.writer,
    ref,
    buildTripMembershipPayload({
      tripId: params.tripId,
      userId: params.passengerId,
      role: 'passenger',
      status: params.status,
      updatedAt: params.updatedAt,
    })
  );
}

function resolvePassengerMembershipStatuses(
  bookings: MembershipRecord[]
): Map<string, Extract<TripMembershipStatus, 'confirmed' | 'cancelled'>> {
  const statuses = new Map<string, Extract<TripMembershipStatus, 'confirmed' | 'cancelled'>>();

  for (const booking of bookings) {
    if (booking.status !== 'confirmed' && booking.status !== 'cancelled') {
      continue;
    }

    const nextStatus = booking.status;
    const previousStatus = statuses.get(booking.passenger_id);

    if (previousStatus === 'confirmed') {
      continue;
    }

    statuses.set(booking.passenger_id, nextStatus);
  }

  return statuses;
}

export async function syncTripMembershipsForTrip(
  trip: Pick<TripsRow, 'id' | 'driver_id'>,
  bookings: MembershipRecord[],
  passedDb?: FirebaseFirestore.Firestore
) {
  const db = passedDb ?? getAdminFirestore();
  const batch = db.batch();
  const updatedAt = new Date().toISOString();

  queueDriverTripMembership({
    db,
    writer: batch,
    tripId: trip.id,
    driverId: trip.driver_id,
    updatedAt,
  });

  const statuses = resolvePassengerMembershipStatuses(bookings);
  for (const [passengerId, status] of statuses.entries()) {
    queuePassengerTripMembership({
      db,
      writer: batch,
      tripId: trip.id,
      passengerId,
      status,
      updatedAt,
    });
  }

  await batch.commit();
}
