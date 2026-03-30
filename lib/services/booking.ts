import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { BookingWithPassenger, BookingsRow, TripsRow, UserProfile } from '@/lib/types';
import { trackEvent } from './analytics';
import { UnauthorizedError, NotFoundError, AppError } from '@/lib/utils/errors';
import { createNotification } from './notification';
import { canJoinTrip, canCancelBooking } from '@/lib/auth/permissions';
import { getEffectiveTripStatus, syncTripStatusWithSeats } from '@/lib/trips/lifecycle';

export async function bookSeat(tripId: string, seats: number = 1) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

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

    const existingBookings = await tx.get(
      db.collection('bookings')
        .where('trip_id', '==', tripId)
        .where('passenger_id', '==', user.id)
        .where('status', '==', 'confirmed')
    );

    const joinGate = canJoinTrip(user.id, effectiveTrip, !existingBookings.empty);
    if (!joinGate.allowed) {
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

    if (new Date(effectiveTrip.departure_time).getTime() < Date.now()) {
      throw new AppError('Trip has already departed', 'BAD_REQUEST');
    }
    if (!Number.isInteger(seats) || seats < 1) {
      throw new AppError('Must book at least 1 whole seat', 'BAD_REQUEST');
    }
    if (effectiveTrip.seats_available < seats) {
      throw new AppError('Not enough seats available', 'BAD_REQUEST');
    }

    const nextSeatsAvailable = effectiveTrip.seats_available - seats;
    const nextStatus = syncTripStatusWithSeats(effectiveTrip.status, nextSeatsAvailable);

    const bookingRef = db.collection('bookings').doc();
    const createdAt = new Date().toISOString();
    tx.set(bookingRef, {
      trip_id: tripId,
      passenger_id: user.id,
      seats,
      status: 'confirmed',
      created_at: createdAt,
    });

    tx.update(tripRef, {
      seats_available: nextSeatsAvailable,
      status: nextStatus,
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
        seats,
        status: 'confirmed' as const,
        created_at: createdAt,
      } as BookingWithPassenger,
    };
  });

  await trackEvent('booking_confirmed', {
    userId: user.id,
    payload: { trip_id: tripId, booking_id: result.booking_id },
  });

  let passenger: UserProfile | null = null;
  try {
    const passengerDoc = await db.collection('users').doc(user.id).get();
    if (passengerDoc.exists) {
      const passengerData = passengerDoc.data()!;
      passenger = {
        id: passengerDoc.id,
        display_name: passengerData.display_name ?? null,
        avatar_url: passengerData.avatar_url ?? null,
        rating_avg: passengerData.rating_avg ?? 0,
        rating_count: passengerData.rating_count ?? 0,
      };
    }
  } catch {
    // non-critical
  }

  try {
    const tripDoc = await db.collection('trips').doc(tripId).get();
    const driverId = tripDoc.data()?.driver_id;
    if (driverId) {
      await createNotification({
        userId: driverId,
        type: 'booking',
        title: 'New Booking',
        body: `${user.displayName || 'Someone'} booked ${seats} seat(s) on your trip.`,
        linkUrl: `/trips/${tripId}`
      });
    }
  } catch {
    // non-critical
  }

  return {
    ...result,
    booking: {
      ...result.booking,
      passenger,
    },
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
        rating_avg: u.rating_avg ?? 0,
        rating_count: u.rating_count ?? 0,
      });
    }
  }

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      passenger: userMap.get(data.passenger_id) ?? null,
    } as BookingWithPassenger;
  });
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
      throw new UnauthorizedError(`Unauthorized to cancel this booking: ${cancelGate.reason ?? 'forbidden'}`);
    }

    if (booking.status !== 'confirmed') throw new AppError('Booking already cancelled', 'BAD_REQUEST');

    const cancelledAt = new Date().toISOString();

    tx.update(bookingRef, {
      status: 'cancelled',
      cancelled_at: cancelledAt,
      cancelled_by: user.id,
    });

    // Inject cancellation signal
    const messageRef = db.collection('messages').doc();
    tx.set(messageRef, {
      trip_id: booking.trip_id,
      sender_id: user.id,
      content: 'cancelled a seat',
      coordination_action: 'PASSENGER_CANCELED_SEAT',
      created_at: cancelledAt,
      sender_display_name: user.displayName ?? null,
      sender_avatar_url: user.photoURL ?? null,
    });

    // Ensure seats don't exceed the total capacity
    const currentSeats = effectiveTrip.seats_available ?? 0;
    const totalSeats = effectiveTrip.seats_total ?? booking.seats;
    const updatedSeats = Math.min(currentSeats + booking.seats, totalSeats);
    const nextStatus = syncTripStatusWithSeats(effectiveTrip.status, updatedSeats);

    tx.update(tripRef, {
      seats_available: updatedSeats,
      status: nextStatus,
    });
    
    return { 
      driverId: effectiveTrip.driver_id, 
      passengerId: booking.passenger_id, 
      tripId: booking.trip_id, 
      seats: booking.seats,
      status: nextStatus,
      cancelledAt,
      cancelledBy: user.id,
      bookingId: bookingRef.id,
    };
  });

  try {
    const notifyId = user.id === result.driverId ? result.passengerId : result.driverId;
    if (notifyId) {
      await createNotification({
        userId: notifyId,
        type: 'cancellation',
        title: 'Booking Cancelled',
        body: `${user.displayName || 'Someone'} cancelled ${user.id === result.driverId ? 'your booking' : `their booking for ${result.seats} seat(s)`}.`,
        linkUrl: `/trips/${result.tripId}`
      });
    }
  } catch {
    // non-critical
  }

  return result;
}
