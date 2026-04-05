import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import type { BookingsRow, CommunityMembersRow, TripsRow } from '@/lib/types';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';
import { hasTripDeparted, isPreDepartureTrip } from '@/lib/trips/coordination';

export { canCompleteTrip, canStartTrip } from '@/lib/trips/lifecycle-permissions';

type FirestoreDb = FirebaseFirestore.Firestore;
type TripPermissionTarget = Pick<
  TripsRow,
  'community_id' | 'driver_id' | 'seats_available' | 'status' | 'departure_time'
>;
type BookingPermissionTarget = Pick<BookingsRow, 'passenger_id' | 'status'>;
type CommunityMembershipTarget = Pick<CommunityMembersRow, 'community_id'>;
type PermissionDecision = { allowed: boolean; reason?: string };

function isDriverForTrip(
  userId: string | undefined | null,
  trip: Pick<TripsRow, 'driver_id'>
): boolean {
  return Boolean(userId) && trip.driver_id === userId;
}

function getPermissionTripStatus(
  trip: Pick<TripsRow, 'status' | 'seats_available'>
): TripsRow['status'] {
  return getEffectiveTripStatus({
    status: trip.status,
    seats_available: trip.seats_available,
  });
}

export function canEditTrip(userId: string | undefined | null, trip: TripPermissionTarget): boolean {
  if (!isDriverForTrip(userId, trip)) return false;
  const status = getEffectiveTripStatus(trip);
  return (status === 'draft' || status === 'scheduled' || status === 'full') && !hasTripDeparted(trip);
}

export function canViewTrip(
  userId: string | undefined | null,
  trip: Pick<TripsRow, 'community_id'>,
  userCommunities: CommunityMembershipTarget[]
): boolean {
  if (!userId) return false;
  return userCommunities.some(c => c.community_id === trip.community_id);
}

export function canJoinTrip(
  userId: string | undefined | null,
  trip: TripPermissionTarget,
  isAlreadyBooked: boolean,
  hasCommunityMembership: boolean
): PermissionDecision {
  const status = getEffectiveTripStatus(trip);
  if (!userId) return { allowed: false, reason: 'unauthorized' };
  if (!hasCommunityMembership) return { allowed: false, reason: 'community_membership_required' };
  if (trip.driver_id === userId) return { allowed: false, reason: 'self_booking' };
  if (isAlreadyBooked) return { allowed: false, reason: 'duplicate_booking' };
  if (trip.seats_available <= 0) return { allowed: false, reason: 'full' };
  if (hasTripDeparted(trip)) return { allowed: false, reason: 'departed' };
  if (status !== 'scheduled') return { allowed: false, reason: 'invalid_status' };
  return { allowed: true };
}

export function canCancelBooking(
  userId: string | undefined | null,
  booking: Pick<BookingsRow, 'passenger_id' | 'status'>,
  trip: TripPermissionTarget
): PermissionDecision {
  if (!userId) return { allowed: false, reason: 'unauthorized' };
  if (booking.status !== 'confirmed') return { allowed: false, reason: 'booking_inactive' };
  if (!isPreDepartureTrip(trip)) {
    return { allowed: false, reason: hasTripDeparted(trip) ? 'departed' : 'invalid_status' };
  }
  if (userId !== booking.passenger_id && userId !== trip.driver_id) {
    return { allowed: false, reason: 'unauthorized' };
  }
  return { allowed: true };
}

export function canCancelTrip(
  userId: string | undefined | null,
  trip: TripPermissionTarget
): PermissionDecision {
  if (!isDriverForTrip(userId, trip)) return { allowed: false, reason: 'unauthorized' };
  if (!isPreDepartureTrip(trip)) {
    return { allowed: false, reason: hasTripDeparted(trip) ? 'departed' : 'invalid_status' };
  }
  return { allowed: true };
}

// Determines if a user can see the passenger roster of a trip
export function canViewTripRoster(
  userId: string | undefined | null,
  trip: Pick<TripsRow, 'driver_id' | 'status' | 'seats_available'>,
  activeBookings: BookingPermissionTarget[]
): boolean {
  if (!userId) return false;
  const status = getPermissionTripStatus(trip);
  if (status === 'cancelled') return false;
  if (trip.driver_id === userId) return true;
  // Confirmed passengers can see the roster
  return activeBookings.some((b) => b.passenger_id === userId && b.status === 'confirmed');
}

export function canViewTripCommunication(
  userId: string | undefined | null,
  trip: Pick<TripsRow, 'driver_id' | 'status' | 'seats_available'>,
  participantBookings: BookingPermissionTarget[]
): boolean {
  if (!userId) return false;
  if (trip.driver_id === userId) return true;

  // Revoke visibility for cancelled passengers
  return participantBookings.some((booking) => {
    return booking.passenger_id === userId && booking.status === 'confirmed';
  });
}

export function canSendTripCommunication(
  userId: string | undefined | null,
  trip: Pick<TripsRow, 'driver_id' | 'status' | 'seats_available'>,
  participantBookings: BookingPermissionTarget[]
): boolean {
  const status = getPermissionTripStatus(trip);
  if (status !== 'scheduled' && status !== 'full' && status !== 'in_progress') return false;

  if (!userId) return false;
  if (trip.driver_id === userId) return true;

  return participantBookings.some((booking) => booking.passenger_id === userId && booking.status === 'confirmed');
}

// Backward-compatible wrapper for older call sites
export function canAccessTripChat(
  userId: string | undefined | null,
  trip: Pick<TripsRow, 'driver_id' | 'status' | 'seats_available'>,
  confirmedBookings: BookingPermissionTarget[]
): boolean {
  return canViewTripCommunication(userId, trip, confirmedBookings);
}

// Determines if `raterId` is allowed to submit a rating against `ratedUserId`
export function canRateUser(
  raterId: string | undefined | null,
  ratedUserId: string,
  trip: Pick<TripsRow, 'driver_id'>,
  booking: Pick<BookingsRow, 'passenger_id'>
): boolean {
  if (!raterId) return false;
  const isDriver = trip.driver_id === raterId;
  const expectedTarget = isDriver ? booking.passenger_id : trip.driver_id;
  return expectedTarget === ratedUserId;
}

// Strictly checks if a user holds an admin role entry in the db
export async function isAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;
  const db = getAdminFirestore();
  const adminSnap = await db.collection('community_members')
    .where('user_id', '==', userId)
    .where('role', '==', 'admin')
    .limit(1)
    .get();
  return !adminSnap.empty;
}

export async function getCommunityMembershipRole(
  userId: string | undefined | null,
  communityId: string,
  passedDb?: FirestoreDb
): Promise<CommunityMembersRow['role'] | null> {
  if (!userId) return null;

  const db = passedDb ?? getAdminFirestore();
  const membershipDoc = await db.collection('community_members').doc(`${communityId}_${userId}`).get();

  if (!membershipDoc.exists) return null;

  const membership = membershipDoc.data() as CommunityMembersRow;
  return membership.role;
}

export async function isCommunityMember(
  userId: string | undefined | null,
  communityId: string,
  passedDb?: FirestoreDb
): Promise<boolean> {
  return (await getCommunityMembershipRole(userId, communityId, passedDb)) !== null;
}

export async function isCommunityAdmin(
  userId: string | undefined | null,
  communityId: string,
  passedDb?: FirestoreDb
): Promise<boolean> {
  return (await getCommunityMembershipRole(userId, communityId, passedDb)) === 'admin';
}
