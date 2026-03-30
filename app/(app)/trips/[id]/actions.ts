'use server';

import { bookSeat as bookSeatService, cancelBooking as cancelBookingService } from '@/lib/services/booking';
import { updateTripStatus as updateTripStatusService } from '@/lib/services/trip';
import { getCurrentUser } from '@/lib/auth/session';
import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { createNotification } from '@/lib/services/notification';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';
import type { BookingsRow, TripsRow } from '@/lib/types';
import { getTripCommunicationAccessForUser } from '@/lib/services/message';
import { canSendCoordinationAction, type CoordinationActionKey } from '@/lib/trips/coordination';
import {
  validateTripReportParticipants,
} from '@/lib/services/safety';

export async function bookSeat(tripId: string, seats: number = 1) {
  return bookSeatService(tripId, seats);
}

export async function cancelBookingAction(bookingId: string) {
  return cancelBookingService(bookingId);
}

export async function updateTripStatusAction(
  tripId: string,
  status: 'in_progress' | 'completed' | 'cancelled'
) {
  return updateTripStatusService(tripId, status);
}

const ACTION_COPY: Record<CoordinationActionKey, string> = {
  PASSENGER_HERE: 'is at the pickup point',
  PASSENGER_LATE: 'is running late',
  DRIVER_CONFIRMED: 'confirmed the trip',
};

const ACTION_NOTIFICATION: Record<
  CoordinationActionKey,
  {
    notifyDriver: boolean;
    notifyPassengers: boolean;
    title: string;
    body: (name: string) => string;
  }
> = {
  PASSENGER_HERE: {
    notifyDriver: true,
    notifyPassengers: false,
    title: 'Passenger arrived',
    body: (name) => `${name} is at the pickup point`,
  },
  PASSENGER_LATE: {
    notifyDriver: true,
    notifyPassengers: false,
    title: 'Passenger running late',
    body: (name) => `${name} is running late`,
  },
  DRIVER_CONFIRMED: {
    notifyDriver: false,
    notifyPassengers: true,
    title: 'Trip confirmed',
    body: (name) => `${name} confirmed the trip is still on`,
  },
};

export async function sendCoordinationAction(
  tripId: string,
  action: CoordinationActionKey
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'unauthorized' };

  const db = getAdminFirestore();
  const tripDoc = await db.collection('trips').doc(tripId).get();
  if (!tripDoc.exists) return { ok: false, error: 'trip_not_found' };

  const trip = tripDoc.data() as TripsRow;
  const effectiveStatus = getEffectiveTripStatus(trip);
  const isActiveTrip =
    effectiveStatus === 'scheduled' ||
    effectiveStatus === 'full' ||
    effectiveStatus === 'in_progress';
  if (!isActiveTrip) return { ok: false, error: 'invalid_status' };

  const isDriver = trip.driver_id === user.id;
  const communicationAccess = await getTripCommunicationAccessForUser(user.id, tripId, db);

  if (!communicationAccess.canView) {
    return { ok: false, error: communicationAccess.restrictionReason ?? 'unauthorized' };
  }

  if (action === 'DRIVER_CONFIRMED' && !isDriver) {
    return { ok: false, error: 'unauthorized' };
  }

  if ((action === 'PASSENGER_HERE' || action === 'PASSENGER_LATE') && isDriver) {
    return { ok: false, error: 'unauthorized' };
  }

  let hasConfirmedBooking = false;
  if (!isDriver) {
    const bookingSnap = await db
      .collection('bookings')
      .where('trip_id', '==', tripId)
      .where('passenger_id', '==', user.id)
        .where('status', '==', 'confirmed')
        .limit(1)
        .get();

    if (bookingSnap.empty) return { ok: false, error: 'not_a_passenger' };
    hasConfirmedBooking = true;
  }

  if (!canSendCoordinationAction({ trip, isDriver, hasConfirmedBooking, action })) {
    return { ok: false, error: 'invalid_status' };
  }

  const createdAt = new Date().toISOString();
  await db.collection('messages').add({
    trip_id: tripId,
    sender_id: user.id,
    content: ACTION_COPY[action],
    coordination_action: action,
    created_at: createdAt,
    sender_display_name: user.displayName ?? null,
    sender_avatar_url: user.photoURL ?? null,
  });

  try {
    const notifConfig = ACTION_NOTIFICATION[action];
    const displayName = user.displayName ?? 'Someone';
    const linkUrl = `/trips/${tripId}/chat`;
    const notifyIds = new Set<string>();

    if (notifConfig.notifyDriver) notifyIds.add(trip.driver_id);

    if (notifConfig.notifyPassengers) {
      const passengerSnap = await db
        .collection('bookings')
        .where('trip_id', '==', tripId)
        .where('status', '==', 'confirmed')
        .get();

      passengerSnap.docs.forEach((doc) => {
        const passengerId = (doc.data() as BookingsRow).passenger_id;
        if (passengerId !== user.id) notifyIds.add(passengerId);
      });
    }

    await Promise.all(
      Array.from(notifyIds).map((uid) =>
        createNotification({
          userId: uid,
          type: 'system',
          title: notifConfig.title,
          body: notifConfig.body(displayName),
          linkUrl,
        })
      )
    );
  } catch {
    // notifications are non-critical
  }

  return { ok: true };
}

export async function submitReportAction(params: {
  tripId: string;
  reportedUserId: string;
  reason: string;
  context?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: 'unauthorized' };

    const db = getAdminFirestore();
    const participantCheck = await validateTripReportParticipants({
      reporterId: user.id,
      reportedUserId: params.reportedUserId,
      tripId: params.tripId,
      passedDb: db,
    });

    if (!participantCheck.allowed) {
      return { ok: false, error: participantCheck.reason };
    }

    await db.collection('reports').add({
      trip_id: params.tripId,
      reporter_id: user.id,
      reported_id: params.reportedUserId,
      reason: params.reason,
      context: params.context?.trim() || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function blockUserAction(params: {
  reportedUserId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: 'unauthorized' };
    if (user.id === params.reportedUserId) return { ok: false, error: 'cannot_block_self' };

    const db = getAdminFirestore();
    const blockRef = db.collection('user_blocks').doc(`${user.id}_${params.reportedUserId}`);
    const blockDoc = await blockRef.get();

    if (blockDoc.exists) {
      return { ok: true };
    }

    await blockRef.set({
      blocker_id: user.id,
      blocked_id: params.reportedUserId,
      created_at: new Date().toISOString(),
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
