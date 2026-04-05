import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { CommunityType, TripWithDriver, UserProfile } from '@/lib/types';
import { trackEvent } from './analytics';
import { createNotification } from './notification';
import {
  describeProfileActionFields,
  getTripCreationProfileReadiness,
  getUserProfile,
} from './user';
import { logWarn } from '@/lib/observability/logger';
import { syncTripMembershipsForTrip, queueDriverTripMembership } from './trip-membership';
import { UnauthorizedError, NotFoundError, AppError } from '@/lib/utils/errors';
import { canCancelTrip, canCompleteTrip, canEditTrip, canStartTrip } from '@/lib/auth/permissions';
import type { TripStatus } from '@/lib/types';
import {
  ACTIVE_TRIP_STATUSES,
  BOOKABLE_TRIP_STATUSES,
  canTransitionTripState,
  getEffectiveTripStatus,
} from '@/lib/trips/lifecycle';
import { getCompletedRideStats, getCompletedDriveCountForDriver } from './trust';
import { getCommunityById } from './community';

function withEffectiveStatus<T extends { status: TripStatus; seats_available: number }>(trip: T): T {
  return {
    ...trip,
    status: getEffectiveTripStatus(trip),
  };
}

type TripCommunitySnapshotTarget = {
  community_id: string;
  community_name?: string | null;
  community_type?: CommunityType | null;
};

async function hydrateTripsWithCommunityInfo<T extends TripCommunitySnapshotTarget>(
  trips: T[],
  db: FirebaseFirestore.Firestore
): Promise<T[]> {
  const missingCommunityIds = [...new Set(
    trips
      .filter((trip) => !trip.community_name || !trip.community_type)
      .map((trip) => trip.community_id)
  )];

  if (missingCommunityIds.length === 0) {
    return trips;
  }

  const communityMap = new Map<string, { name: string; type: CommunityType }>();
  const chunks: string[][] = [];
  for (let i = 0; i < missingCommunityIds.length; i += 30) {
    chunks.push(missingCommunityIds.slice(i, i + 30));
  }

  for (const chunk of chunks) {
    const communitySnap = await db.collection('communities').where('__name__', 'in', chunk).get();
    communitySnap.docs.forEach((doc) => {
      const data = doc.data();
      communityMap.set(doc.id, {
        name: typeof data.name === 'string' ? data.name : 'Community',
        type: data.type === 'public' ? 'public' : 'verified',
      });
    });
  }

  return trips.map((trip) => {
    if (trip.community_name && trip.community_type) {
      return trip;
    }

    const community = communityMap.get(trip.community_id);
    if (!community) {
      return trip;
    }

    return {
      ...trip,
      community_name: trip.community_name ?? community.name,
      community_type: trip.community_type ?? community.type,
    };
  });
}

export type CreateTripInput = {
  communityId: string;
  originLat: number;
  originLng: number;
  originName: string;
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  departureTime: string;
  seatsTotal: number;
  priceCents?: number | null;
};

export async function createTrip(input: CreateTripInput) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const [membershipDoc, community, userProfileDoc] = await Promise.all([
    db.collection('community_members').doc(`${input.communityId}_${user.id}`).get(),
    getCommunityById(input.communityId, db),
    db.collection('users').doc(user.id).get(),
  ]);
  if (!membershipDoc.exists) {
    throw new UnauthorizedError('You must belong to this community to create a trip');
  }
  if (!community) {
    throw new NotFoundError('Community not found');
  }

  if (!input.originName.trim() || !input.destinationName.trim()) {
    throw new AppError('Origin and destination are required', 'BAD_REQUEST');
  }

  if (!Number.isInteger(input.seatsTotal) || input.seatsTotal < 1) {
    throw new AppError('Trips must offer at least 1 seat', 'BAD_REQUEST');
  }

  if (input.priceCents != null && (!Number.isInteger(input.priceCents) || input.priceCents < 0)) {
    throw new AppError('Price must be a positive whole number of cents', 'BAD_REQUEST');
  }

  const departureTime = new Date(input.departureTime);
  if (Number.isNaN(departureTime.getTime())) {
    throw new AppError('Departure time is invalid', 'BAD_REQUEST');
  }
  if (departureTime.getTime() <= Date.now()) {
    throw new AppError('Departure time must be in the future', 'BAD_REQUEST');
  }

  const userProfileData = userProfileDoc.data() ?? null;
  const tripCreationReadiness = getTripCreationProfileReadiness(userProfileData);
  if (!tripCreationReadiness.isReady) {
    logWarn('trip.create_denied', {
      communityId: input.communityId,
      userId: user.id,
      reason: 'profile_incomplete',
      missingFields: tripCreationReadiness.missingFields,
    });
    throw new AppError(
      `Trip creation requires driver-ready profile details. Missing or incomplete: ${describeProfileActionFields(tripCreationReadiness.missingFields)}. Update it on your profile page. Placeholder document selections do not count as verification.`,
      'PROFILE_INCOMPLETE',
      403
    );
  }

  if (community.type === 'public') {
    const existingPublicTrips = await db
      .collection('trips')
      .where('community_id', '==', input.communityId)
      .where('driver_id', '==', user.id)
      .where('status', 'in', ['scheduled', 'full', 'in_progress'])
      .limit(1)
      .get();

    if (!existingPublicTrips.empty) {
      throw new AppError(
        'Public community drivers can only have one active trip at a time',
        'PUBLIC_COMMUNITY_LIMIT',
        403
      );
    }
  }

  const now = new Date().toISOString();
  const ref = await db.collection('trips').add({
    community_id: input.communityId,
    community_name: community.name,
    community_type: community.type,
    driver_id: user.id,
    origin_lat: input.originLat,
    origin_lng: input.originLng,
    origin_name: input.originName,
    destination_lat: input.destinationLat,
    destination_lng: input.destinationLng,
    destination_name: input.destinationName,
    departure_time: input.departureTime,
    seats_total: input.seatsTotal,
    seats_available: input.seatsTotal,
    price_cents: input.priceCents ?? null,
    status: 'scheduled',
    created_at: now,
  });

  const tripMembershipBatch = db.batch();
  queueDriverTripMembership({
    db,
    writer: tripMembershipBatch,
    tripId: ref.id,
    driverId: user.id,
    updatedAt: now,
  });
  await tripMembershipBatch.commit();

  await trackEvent('trip_created', {
    userId: user.id,
    communityId: input.communityId,
    payload: { trip_id: ref.id },
  });

  return { id: ref.id };
}



export async function getTripById(tripId: string): Promise<TripWithDriver> {
  const db = getAdminFirestore();
  const doc = await db.collection('trips').doc(tripId).get();
  if (!doc.exists) throw new NotFoundError('Trip not found');

  let trip = withEffectiveStatus({ id: doc.id, ...doc.data() } as TripWithDriver);
  if (!trip.community_name || !trip.community_type) {
    const community = await getCommunityById(trip.community_id, db);
    if (community) {
      trip = {
        ...trip,
        community_name: trip.community_name ?? community.name,
        community_type: trip.community_type ?? community.type,
      };
    }
  }
  const driver = await getUserProfile(trip.driver_id, db);
  const driverCompletedDrives = await getCompletedDriveCountForDriver(trip.driver_id, db);

  return { ...trip, driver, driver_completed_drives: driverCompletedDrives };
}

export async function getTripsByCommunity(communityId: string): Promise<TripWithDriver[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('trips')
    .where('community_id', '==', communityId)
    .where('status', 'in', [...BOOKABLE_TRIP_STATUSES])
    .orderBy('departure_time', 'asc')
    .get();

  if (snap.empty) return [];

  const driverIds = [...new Set(snap.docs.map((d) => d.data().driver_id as string))];
  const userMap = new Map<string, UserProfile>();

  for (const driverId of driverIds) {
    const profile = await getUserProfile(driverId, db);
    if (profile) userMap.set(driverId, profile);
  }

  const trips = snap.docs.map((d) => {
    const data = d.data();
    return withEffectiveStatus({
      id: d.id,
      ...data,
      driver: userMap.get(data.driver_id) ?? null,
    } as TripWithDriver);
  });

  return hydrateTripsWithCommunityInfo(trips, db);
}

export async function updateTripStatus(tripId: string, status: TripStatus) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();
  const ref = db.collection('trips').doc(tripId);
  if (status !== 'in_progress' && status !== 'completed' && status !== 'cancelled') {
    throw new AppError(`Trip status ${status} cannot be set manually`, 'BAD_REQUEST');
  }

  const updatedTrip = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new NotFoundError('Trip not found');

    const currentTrip = withEffectiveStatus({ id: doc.id, ...doc.data() } as TripWithDriver);
    const currentStatus = currentTrip.status;
    if (currentStatus === status) {
      return { ...currentTrip, status };
    }

    const permissionGate =
      status === 'cancelled'
        ? canCancelTrip(user.id, currentTrip)
        : status === 'in_progress'
          ? canStartTrip(user.id, currentTrip)
          : status === 'completed'
            ? canCompleteTrip(user.id, currentTrip)
            : { allowed: canEditTrip(user.id, currentTrip), reason: 'unauthorized' };

    if (!permissionGate.allowed) {
      logWarn('trip.status_update_denied', {
        tripId,
        requestedStatus: status,
        userId: user.id,
        reason: permissionGate.reason ?? 'forbidden',
      });
      throw new UnauthorizedError(`Trip update not allowed: ${permissionGate.reason ?? 'forbidden'}`);
    }

    if (!canTransitionTripState(currentStatus, status)) {
      logWarn('trip.invalid_transition', {
        tripId,
        fromStatus: currentStatus,
        toStatus: status,
        userId: user.id,
      });
      throw new AppError(`Cannot move trip from ${currentStatus} to ${status}`, 'BAD_REQUEST');
    }

    tx.update(ref, { status });

    if (status === 'in_progress') {
      const now = new Date();
      const departureTime = new Date(currentTrip.departure_time);
      const earliestStart = new Date(departureTime.getTime() - 30 * 60 * 1000); // 30 mins before

      if (now < earliestStart) {
        throw new AppError('Trip cannot be started more than 30 minutes before departure', 'BAD_REQUEST');
      }

      const startedAt = now.toISOString();
      tx.update(ref, { started_at: startedAt });
      return { ...currentTrip, status, started_at: startedAt };
    }

    if (status === 'completed') {
      if (currentStatus !== 'in_progress') {
        throw new AppError('Trip must be in progress before it can be completed', 'BAD_REQUEST');
      }
      const completedAt = new Date().toISOString();
      tx.update(ref, { completed_at: completedAt });
      return { ...currentTrip, status, completed_at: completedAt };
    }

    if (status === 'cancelled') {
      const userRef = db.collection('users').doc(user.id);
      const userDoc = await tx.get(userRef);
      const userProfile = userDoc.data();
      const cancelledAt = new Date().toISOString();
      const messageRef = db.collection('messages').doc();
      tx.set(messageRef, {
        trip_id: tripId,
        sender_id: user.id,
        content: 'cancelled the trip',
        coordination_action: 'DRIVER_CANCELED_TRIP',
        created_at: cancelledAt,
        sender_display_name: userProfile?.display_name ?? null,
        sender_avatar_url: userProfile?.avatar_url ?? null,
      });
      tx.update(ref, {
        status,
        cancelled_at: cancelledAt,
        cancelled_by: user.id,
      });
      return { ...currentTrip, status, cancelled_at: cancelledAt, cancelled_by: user.id };
    }

    return { ...currentTrip, status };
  });

  if (status === 'completed') {
    await trackEvent('trip_completed', { userId: user.id, payload: { trip_id: tripId } });
  } else if (status === 'in_progress') {
    await trackEvent('trip_started', { userId: user.id, payload: { trip_id: tripId } });
  } else if (status === 'cancelled') {
    await syncTripMembershipsForTrip(
      { id: tripId, driver_id: updatedTrip.driver_id },
      [],
      db
    );
    try {
      const bookingsSnap = await db.collection('bookings').where('trip_id', '==', tripId).where('status', '==', 'confirmed').get();
      const notifyPromises = bookingsSnap.docs.map(b => 
         createNotification({
           userId: b.data().passenger_id as string,
           type: 'cancellation',
           title: 'Trip Cancelled',
           body: 'A trip you booked has been cancelled by the driver.',
           linkUrl: `/trips/${tripId}`
         })
      );
      await Promise.all(notifyPromises);
    } catch {
      // non-critical
    }
  }

  return updatedTrip;
}

/** Get upcoming trips where the current user is the driver */
export async function getMyTripsAsDriver(): Promise<TripWithDriver[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();
  const snap = await db
    .collection('trips')
    .where('driver_id', '==', user.id)
    .where('status', 'in', [...ACTIVE_TRIP_STATUSES])
    .get();

  if (snap.empty) return [];

  const trips = snap.docs
    .map((d) => withEffectiveStatus({ id: d.id, ...d.data(), driver: null } as TripWithDriver))
    .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());

  return hydrateTripsWithCommunityInfo(trips, db);
}

/** Get upcoming trips in a community for the home page preview */
export async function getUpcomingCommunityTrips(communityId: string, limitCount = 3): Promise<TripWithDriver[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('trips')
    .where('community_id', '==', communityId)
    .where('status', 'in', [...BOOKABLE_TRIP_STATUSES])
    .get();

  if (snap.empty) return [];

  const validTrips = snap.docs
    .map((d) => withEffectiveStatus({ id: d.id, ...d.data() } as TripWithDriver))
    .filter((t) => t.seats_available > 0 && new Date(t.departure_time) > new Date())
    .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime())
    .slice(0, limitCount);

  // Fetch driver profiles
  const results: TripWithDriver[] = [];
  for (const trip of validTrips) {
    const driver = await getUserProfile(trip.driver_id, db);
    results.push({ ...trip, driver });
  }

  return hydrateTripsWithCommunityInfo(results, db);
}

export async function getUpcomingTripsForCommunities(
  communityIds: string[],
  limitCount = 6
): Promise<TripWithDriver[]> {
  if (communityIds.length === 0) return [];

  const groupedTrips = await Promise.all(
    communityIds.map((communityId) => getUpcomingCommunityTrips(communityId, limitCount))
  );

  return groupedTrips
    .flat()
    .sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime())
    .slice(0, limitCount);
}

/** Get upcoming reservations where the current user is a passenger */
export async function getMyBookings(): Promise<TripWithDriver[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();
  const bookingsSnap = await db
    .collection('bookings')
    .where('passenger_id', '==', user.id)
    .where('status', '==', 'confirmed')
    .get();

  if (bookingsSnap.empty) return [];

  const tripIds = [...new Set(bookingsSnap.docs.map((d) => d.data().trip_id as string))];
  const results: TripWithDriver[] = [];

  for (const tripId of tripIds) {
    const tripDoc = await db.collection('trips').doc(tripId).get();
    if (!tripDoc.exists) continue;
    const data = tripDoc.data()!;
    const trip = withEffectiveStatus({ id: tripDoc.id, ...data, driver: null } as TripWithDriver);
    if (!['scheduled', 'full', 'in_progress'].includes(trip.status)) continue;

    const driver = await getUserProfile(data.driver_id, db);
    results.push({ ...trip, driver });
  }

  const hydratedResults = await hydrateTripsWithCommunityInfo(results, db);
  return hydratedResults.sort((a, b) => new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime());
}

/** Get past trips (completed/cancelled) where user was driver or passenger */
export async function getMyPastTrips(): Promise<TripWithDriver[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();

  // Trips as driver
  const driverSnap = await db
    .collection('trips')
    .where('driver_id', '==', user.id)
    .where('status', 'in', ['completed', 'cancelled'])
    .get();

  // Bookings as passenger
  const bookingsSnap = await db
    .collection('bookings')
    .where('passenger_id', '==', user.id)
    .get();

  const tripIds = new Set<string>();
  const results: TripWithDriver[] = [];

  for (const d of driverSnap.docs) {
    tripIds.add(d.id);
    const data = d.data();
    const driver = await getUserProfile(data.driver_id, db);
    results.push(withEffectiveStatus({ id: d.id, ...data, driver } as TripWithDriver));
  }

  for (const b of bookingsSnap.docs) {
    const tid = b.data().trip_id as string;
    if (tripIds.has(tid)) continue;
    const tripDoc = await db.collection('trips').doc(tid).get();
    if (!tripDoc.exists) continue;
    const data = tripDoc.data()!;
    if (data.status !== 'completed' && data.status !== 'cancelled') continue;
    tripIds.add(tid);
    const driver = await getUserProfile(data.driver_id, db);
    results.push(withEffectiveStatus({ id: tripDoc.id, ...data, driver } as TripWithDriver));
  }

  const hydratedResults = await hydrateTripsWithCommunityInfo(results, db);
  return hydratedResults.sort((a, b) => new Date(b.departure_time).getTime() - new Date(a.departure_time).getTime()).slice(0, 10);
}

/** Get high-level stats for trust display */
export async function getUserStats(userId: string): Promise<{ completedDrives: number; completedJoins: number }> {
  const stats = await getCompletedRideStats(userId);
  return {
    completedDrives: stats.completedDrives,
    completedJoins: stats.completedJoins,
  };
}
