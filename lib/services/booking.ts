import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type {
  BookingAcknowledgementsRow,
  BookingWithPassenger,
  BookingsRow,
  TripsRow,
  UserProfile,
} from '@/lib/types';
import { trackEvent } from './analytics';
import { UnauthorizedError, NotFoundError, AppError } from '@/lib/utils/errors';
import { createNotification } from './notification';
import { canJoinTrip, canCancelBooking } from '@/lib/auth/permissions';
import { getEffectiveTripStatus, syncTripStatusWithSeats } from '@/lib/trips/lifecycle';
import { logWarn } from '@/lib/observability/logger';
import { queuePassengerTripMembership } from './trip-membership';
import { describeProfileActionFields, getBasicProfileActionReadiness } from './user';
import {
  collapseBookingsByPassenger,
  getTripPassengerBookingId,
} from '@/lib/bookings/canonical';
import {
  doesPassengerGenderMatchPreference,
  normalizeTripPassengerGenderPreference,
} from '@/lib/trips/comfort';

function buildPassengerSnapshot(
  userId: string,
  data?: FirebaseFirestore.DocumentData | null
): UserProfile {
  return {
    id: userId,
    display_name: typeof data?.display_name === 'string' ? data.display_name : null,
    avatar_url: typeof data?.avatar_url === 'string' ? data.avatar_url : null,
    gender: typeof data?.gender === 'string' ? data.gender : null,
    rating_avg: typeof data?.rating_avg === 'number' ? data.rating_avg : 0,
    rating_count: typeof data?.rating_count === 'number' ? data.rating_count : 0,
  };
}

export async function bookSeat(
  tripId: string,
  seats: number = 1,
  acknowledgements?: {
    tripRules: boolean;
    platformRole: boolean;
    supportPath: boolean;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  if (
    !acknowledgements?.tripRules ||
    !acknowledgements?.platformRole ||
    !acknowledgements?.supportPath
  ) {
    throw new AppError('Booking acknowledgements are required', 'BAD_REQUEST');
  }

  const db = getAdminFirestore();

  await trackEvent('booking_attempted', {
    userId: user.id,
    payload: { trip_id: tripId, seats },
  });

  // Use a transaction to avoid race conditions on seats_available
  const result = await db.runTransaction(async (tx) => {
    const tripRef = db.collection('trips').doc(tripId);
    const tripDoc = await tx.get(tripRef);

    if (!tripDoc.exists) throw new NotFoundError('Trip not found');
    const tripData = tripDoc.data()! as TripsRow;
    const effectiveTrip = {
      ...tripData,
      status: getEffectiveTripStatus(tripData),
    };
    const communityRef = db.collection('communities').doc(tripData.community_id);
    const communityDoc = await tx.get(communityRef);
    const communityType =
      communityDoc.data()?.type === 'public'
        ? 'public'
        : tripData.community_type === 'public'
          ? 'public'
          : 'verified';

    const existingPassengerBookingsSnap = await tx.get(
      db.collection('bookings')
        .where('trip_id', '==', tripId)
        .where('passenger_id', '==', user.id)
    );

    const communityMembershipRef = db.collection('community_members').doc(`${tripData.community_id}_${user.id}`);
    const userProfileRef = db.collection('users').doc(user.id);
    const [communityMembershipDoc, userProfileDoc] = await Promise.all([
      tx.get(communityMembershipRef),
      tx.get(userProfileRef),
    ]);
    const userProfileData = userProfileDoc.data() ?? null;
    const passengerSnapshot = buildPassengerSnapshot(user.id, userProfileData);
    const existingPassengerBookings = existingPassengerBookingsSnap.docs.map((doc) => ({
      id: doc.id,
      ref: doc.ref,
      data: {
        id: doc.id,
        ...(doc.data() as Omit<BookingsRow, 'id'>),
      } as BookingsRow,
    }));
    const confirmedPassengerBookings = existingPassengerBookings.filter(
      (booking) => booking.data.status === 'confirmed'
    );
    const joinGate = canJoinTrip(
      user.id,
      effectiveTrip,
      confirmedPassengerBookings.length > 0,
      communityMembershipDoc.exists
    );
    if (!joinGate.allowed) {
      if (joinGate.reason === 'duplicate_booking') {
        logWarn('booking.join_denied', {
          tripId,
          userId: user.id,
          reason: joinGate.reason,
          confirmedBookingIds: confirmedPassengerBookings.map((booking) => booking.id),
        });
        throw new AppError('You already booked this trip', 'DUPLICATE_BOOKING', 409);
      }
      logWarn('booking.join_denied', {
        tripId,
        userId: user.id,
        reason: joinGate.reason ?? 'forbidden',
      });
      throw new AppError(`Booking rejected: ${joinGate.reason}`, 'FORBIDDEN');
    }

    // Shield: Symmetric block check
    const [blockedByUser, userBlockedBy] = await Promise.all([
      tx.get(db.collection('user_blocks').where('blocker_id', '==', user.id).where('blocked_id', '==', tripData.driver_id)),
      tx.get(db.collection('user_blocks').where('blocker_id', '==', tripData.driver_id).where('blocked_id', '==', user.id)),
    ]);

    if (!blockedByUser.empty || !userBlockedBy.empty) {
      throw new AppError('You cannot book a trip with this user', 'FORBIDDEN');
    }

    if (communityType === 'public') {
      const publicBookingReadiness = getBasicProfileActionReadiness(userProfileData);
      if (!publicBookingReadiness.isReady) {
        logWarn('booking.profile_gate_denied', {
          tripId,
          userId: user.id,
          communityType,
          missingFields: publicBookingReadiness.missingFields,
        });
        throw new AppError(
          `Complete your basic profile before booking in the public community. Missing or incomplete: ${describeProfileActionFields(publicBookingReadiness.missingFields)}. Update it on your profile page.`,
          'PROFILE_INCOMPLETE',
          403
        );
      }

      if (seats !== 1) {
        throw new AppError(
          'Public community bookings are limited to 1 seat',
          'PUBLIC_COMMUNITY_LIMIT',
          403
        );
      }
    }

    if (new Date(effectiveTrip.departure_time).getTime() < Date.now()) {
      throw new AppError('Trip has already departed', 'BAD_REQUEST');
    }
    if (!Number.isInteger(seats) || seats < 1) {
      throw new AppError('Must book at least 1 whole seat', 'BAD_REQUEST');
    }
    if (seats !== 1) {
      throw new AppError('Only one seat per user is supported right now', 'BAD_REQUEST');
    }
    const passengerGenderPreference = normalizeTripPassengerGenderPreference(
      tripData.passenger_gender_preference
    );
    if (
      !doesPassengerGenderMatchPreference(userProfileData?.gender, passengerGenderPreference)
    ) {
      logWarn('booking.gender_preference_denied', {
        tripId,
        userId: user.id,
        passengerGenderPreference,
        passengerGender: userProfileData?.gender ?? null,
      });
      throw new AppError(
        passengerGenderPreference === 'women_only'
          ? 'This trip is limited to women riders'
          : 'This trip is limited to men riders',
        'FORBIDDEN',
        403
      );
    }
    if (effectiveTrip.seats_available < seats) {
      throw new AppError('Not enough seats available', 'BAD_REQUEST');
    }

    const nextSeatsAvailable = effectiveTrip.seats_available - seats;
    const nextStatus = syncTripStatusWithSeats(effectiveTrip.status, nextSeatsAvailable);

    const reusableBookingDoc = existingPassengerBookings
      .filter((booking) => booking.data.status !== 'confirmed')
      .sort((left, right) => Date.parse(right.data.created_at) - Date.parse(left.data.created_at))[0];
    const bookingRef =
      reusableBookingDoc?.ref ??
      db.collection('bookings').doc(getTripPassengerBookingId(tripId, user.id));
    const createdAt = new Date().toISOString();
    const bookingAcknowledgements: BookingAcknowledgementsRow = {
      trip_rules: true,
      platform_role: true,
      support_path: true,
      acknowledged_at: createdAt,
    };
    tx.set(bookingRef, {
      trip_id: tripId,
      passenger_id: user.id,
      passenger_display_name: passengerSnapshot.display_name,
      passenger_avatar_url: passengerSnapshot.avatar_url,
      booking_acknowledgements: bookingAcknowledgements,
      seats,
      status: 'confirmed',
      created_at: createdAt,
    });

    tx.update(tripRef, {
      seats_available: nextSeatsAvailable,
      status: nextStatus,
    });

    queuePassengerTripMembership({
      db,
      writer: tx,
      tripId,
      passengerId: user.id,
      status: 'confirmed',
      updatedAt: createdAt,
    });

    return {
      success: true,
      booking_id: bookingRef.id,
      seats_available: nextSeatsAvailable,
      status: nextStatus,
      booking: {
        id: bookingRef.id,
        trip_id: tripId,
        passenger_id: user.id,
        passenger_display_name: passengerSnapshot.display_name,
        passenger_avatar_url: passengerSnapshot.avatar_url,
        booking_acknowledgements: bookingAcknowledgements,
        seats,
        status: 'confirmed' as const,
        created_at: createdAt,
        passenger: passengerSnapshot,
      } as BookingWithPassenger,
    };
  });

  await trackEvent('booking_confirmed', {
    userId: user.id,
    payload: { trip_id: tripId, booking_id: result.booking_id },
  });

  try {
    const tripDoc = await db.collection('trips').doc(tripId).get();
    const driverId = tripDoc.data()?.driver_id;
    if (driverId) {
      await createNotification({
        userId: driverId,
        type: 'booking',
        title: 'New Booking',
        body: `${result.booking.passenger?.display_name ?? 'Someone'} booked a seat on your trip.`,
        linkUrl: `/trips/${tripId}`
      });
    }
  } catch {
    // non-critical
  }

  return {
    ...result,
    booking: result.booking,
  };
}

export async function getBookingsForTrip(tripId: string): Promise<BookingWithPassenger[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('bookings')
    .where('trip_id', '==', tripId)
    .where('status', 'in', ['confirmed', 'cancelled'])
    .get();

  if (snap.empty) return [];

  const passengerIds = [...new Set(snap.docs.map((d) => d.data().passenger_id as string))];
  const userMap = new Map<string, UserProfile>();

  for (const pid of passengerIds) {
    const userDoc = await db.collection('users').doc(pid).get();
    if (userDoc.exists) {
      const u = userDoc.data()!;
      userMap.set(pid, {
        id: userDoc.id,
        display_name: u.display_name ?? null,
        avatar_url: u.avatar_url ?? null,
        gender: u.gender ?? null,
        rating_avg: u.rating_avg ?? 0,
        rating_count: u.rating_count ?? 0,
      });
    }
  }

  const bookings = snap.docs.map((d) => {
    const data = d.data();
    const snapshotPassenger = buildPassengerSnapshot(data.passenger_id as string, data);
    const passenger = userMap.get(data.passenger_id) ?? snapshotPassenger;

    return {
      id: d.id,
      ...data,
      passenger,
    } as BookingWithPassenger;
  });

  return collapseBookingsByPassenger(bookings);
}

export async function cancelBooking(bookingId: string) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();

  const result = await db.runTransaction(async (tx) => {
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await tx.get(bookingRef);

    if (!bookingDoc.exists) throw new NotFoundError('Booking not found');
    const booking = bookingDoc.data()! as BookingsRow;

    const tripRef = db.collection('trips').doc(booking.trip_id);
    const tripDoc = await tx.get(tripRef);
    if (!tripDoc.exists) throw new NotFoundError('Trip not found');
    const tripData = tripDoc.data()! as TripsRow;
    const effectiveTrip = {
      ...tripData,
      status: getEffectiveTripStatus(tripData),
    };

    const cancelGate = canCancelBooking(user.id, booking, effectiveTrip);
    if (!cancelGate.allowed) {
      logWarn('booking.cancel_denied', {
        bookingId,
        tripId: booking.trip_id,
        userId: user.id,
        reason: cancelGate.reason ?? 'forbidden',
      });
      throw new UnauthorizedError(`Unauthorized to cancel this booking: ${cancelGate.reason ?? 'forbidden'}`);
    }

    if (booking.status !== 'confirmed') throw new AppError('Booking already cancelled', 'BAD_REQUEST');

    const userRef = db.collection('users').doc(user.id);
    const userDoc = await tx.get(userRef);
    const userProfile = userDoc.data();

    const relatedConfirmedBookingsSnap = await tx.get(
      db.collection('bookings')
        .where('trip_id', '==', booking.trip_id)
        .where('passenger_id', '==', booking.passenger_id)
        .where('status', '==', 'confirmed')
    );
    const cancelledAt = new Date().toISOString();
    const confirmedBookingsToCancel = relatedConfirmedBookingsSnap.docs.map((doc) => ({
      ref: doc.ref,
      data: {
        id: doc.id,
        ...(doc.data() as Omit<BookingsRow, 'id'>),
      } as BookingsRow,
    }));
    const totalSeatsToRelease = confirmedBookingsToCancel.reduce(
      (sum, entry) => sum + entry.data.seats,
      0
    );

    if (confirmedBookingsToCancel.length > 1) {
      logWarn('booking.duplicate_cleanup', {
        tripId: booking.trip_id,
        passengerId: booking.passenger_id,
        bookingIds: confirmedBookingsToCancel.map((entry) => entry.data.id),
      });
    }

    confirmedBookingsToCancel.forEach((entry) => {
      tx.update(entry.ref, {
        status: 'cancelled',
        cancelled_at: cancelledAt,
        cancelled_by: user.id,
      });
    });

    // Inject cancellation signal
    const messageRef = db.collection('messages').doc();
    tx.set(messageRef, {
      trip_id: booking.trip_id,
      sender_id: user.id,
      content: 'cancelled a seat',
      coordination_action: 'PASSENGER_CANCELED_SEAT',
      created_at: cancelledAt,
      sender_display_name: userProfile?.display_name ?? null,
      sender_avatar_url: userProfile?.avatar_url ?? null,
    });

    // Ensure seats don't exceed the total capacity
    const currentSeats = effectiveTrip.seats_available ?? 0;
    const totalSeats = effectiveTrip.seats_total ?? totalSeatsToRelease;
    const updatedSeats = Math.min(currentSeats + totalSeatsToRelease, totalSeats);
    const nextStatus = syncTripStatusWithSeats(effectiveTrip.status, updatedSeats);

    tx.update(tripRef, {
      seats_available: updatedSeats,
      status: nextStatus,
    });

    queuePassengerTripMembership({
      db,
      writer: tx,
      tripId: booking.trip_id,
      passengerId: booking.passenger_id,
      status: 'cancelled',
      updatedAt: cancelledAt,
    });
    
    return { 
      driverId: effectiveTrip.driver_id, 
      passengerId: booking.passenger_id, 
      tripId: booking.trip_id, 
      seats: totalSeatsToRelease,
      status: nextStatus,
      cancelledAt,
      cancelledBy: user.id,
      bookingId: bookingRef.id,
      cancellerDisplayName: userProfile?.display_name ?? 'Someone',
    };
  });

  try {
    const notifyId = user.id === result.driverId ? result.passengerId : result.driverId;
    if (notifyId) {
      await createNotification({
        userId: notifyId,
        type: 'cancellation',
        title: 'Booking Cancelled',
        body: `${result.cancellerDisplayName} cancelled ${user.id === result.driverId ? 'your booking' : `their booking for ${result.seats} seat(s)`}.`,
        linkUrl: `/trips/${result.tripId}`
      });
    }
  } catch {
    // non-critical
  }

  return result;
}
