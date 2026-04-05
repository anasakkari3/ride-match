import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type {
  BookingsRow,
  CommunityType,
  MessageWithSender,
  TripsRow,
  UserProfile,
} from '@/lib/types';
import { trackEvent } from './analytics';
import { createNotification } from './notification';
import {
  canSendTripCommunication,
  canViewTripCommunication,
  isCommunityMember,
} from '@/lib/auth/permissions';
import { UnauthorizedError } from '@/lib/utils/errors';
import { hasTripParticipantBlockConflict } from './safety';
import { getAvailableCoordinationActions } from '@/lib/trips/coordination';
import { logWarn } from '@/lib/observability/logger';

export type InboxThread = {
  tripId: string;
  tripTitle: string;
  tripOrigin: string;
  tripDestination: string;
  tripDate: string;
  communityName: string | null;
  communityType: CommunityType | null;
  lastMessage: MessageWithSender | null;
  currentUserRole: 'driver' | 'passenger';
  conversationWith: string;
  isRestricted: boolean;
  canSendMessages: boolean;
};

export type TripCommunicationAccess = {
  canView: boolean;
  canSendMessages: boolean;
  canSendCoordination: boolean;
  isRestricted: boolean;
  restrictionReason: 'blocked_participant' | 'community_membership_required' | null;
  isActiveTrip: boolean;
};

async function getUserProfile(
  db: FirebaseFirestore.Firestore,
  userId: string
): Promise<UserProfile | null> {
  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return null;
  const data = doc.data()!;

  return {
    id: doc.id,
    display_name: data.display_name ?? null,
    avatar_url: data.avatar_url ?? null,
    rating_avg: data.rating_avg ?? 0,
    rating_count: data.rating_count ?? 0,
  };
}

function toMessageWithSender(
  id: string,
  data: FirebaseFirestore.DocumentData,
  userMap: Map<string, UserProfile>
): MessageWithSender {
  const senderProfile = userMap.get(data.sender_id);

  return {
    id,
    ...data,
    sender: senderProfile ?? {
      display_name: data.sender_display_name ?? null,
      avatar_url: data.sender_avatar_url ?? null,
    },
  } as MessageWithSender;
}

function getEffectiveTripStatus(trip: Pick<TripsRow, 'status' | 'seats_available'>): TripsRow['status'] {
  if (trip.status === 'scheduled' && trip.seats_available <= 0) {
    return 'full';
  }

  return trip.status;
}

async function getTripParticipantBookings(
  db: FirebaseFirestore.Firestore,
  tripId: string
): Promise<BookingsRow[]> {
  const snap = await db.collection('bookings').where('trip_id', '==', tripId).get();
  return snap.docs.map((doc) => {
    const data = doc.data() as Omit<BookingsRow, 'id'>;
    return { ...data, id: doc.id };
  });
}

export async function getTripCommunicationAccessForUser(
  userId: string | null | undefined,
  tripId: string,
  passedDb?: FirebaseFirestore.Firestore
): Promise<TripCommunicationAccess> {
  if (!userId) {
    return {
      canView: false,
      canSendMessages: false,
      canSendCoordination: false,
      isRestricted: false,
      restrictionReason: null,
      isActiveTrip: false,
    };
  }

  const db = passedDb ?? getAdminFirestore();
  const tripDoc = await db.collection('trips').doc(tripId).get();
  if (!tripDoc.exists) {
    return {
      canView: false,
      canSendMessages: false,
      canSendCoordination: false,
      isRestricted: false,
      restrictionReason: null,
      isActiveTrip: false,
    };
  }

  const tripData = tripDoc.data()! as TripsRow;
  const isActiveTrip = ['scheduled', 'full', 'in_progress'].includes(getEffectiveTripStatus(tripData));
  const hasCommunityAccess = await isCommunityMember(userId, tripData.community_id, db);

  if (!hasCommunityAccess) {
    return {
      canView: false,
      canSendMessages: false,
      canSendCoordination: false,
      isRestricted: false,
      restrictionReason: 'community_membership_required',
      isActiveTrip,
    };
  }

  const participantBookings = await getTripParticipantBookings(db, tripId);
  const canView = canViewTripCommunication(userId, tripData, participantBookings);

  if (!canView) {
    return {
      canView: false,
      canSendMessages: false,
      canSendCoordination: false,
      isRestricted: false,
      restrictionReason: null,
      isActiveTrip,
    };
  }

  const isRestricted = await hasTripParticipantBlockConflict(userId, tripId, db);
  const canParticipate = canSendTripCommunication(userId, tripData, participantBookings);
  const isDriver = tripData.driver_id === userId;
  const hasConfirmedBooking = participantBookings.some(
    (booking) => booking.passenger_id === userId && booking.status === 'confirmed'
  );

  return {
    canView: true,
    canSendMessages: canParticipate && isActiveTrip && !isRestricted,
    canSendCoordination:
      getAvailableCoordinationActions({
        trip: tripData,
        isDriver,
        hasConfirmedBooking,
      }).length > 0,
    isRestricted,
    restrictionReason: isRestricted ? 'blocked_participant' : null,
    isActiveTrip,
  };
}

export async function getTripCommunicationAccess(tripId: string): Promise<TripCommunicationAccess> {
  const user = await getCurrentUser();
  return getTripCommunicationAccessForUser(user?.id ?? null, tripId);
}

/** Checks if the current user is authorized to view a trip's chat */
export async function canUserAccessChat(tripId: string): Promise<boolean> {
  const access = await getTripCommunicationAccess(tripId);
  return access.canView;
}

/** Fetches messages for a specific trip */
export async function getTripMessages(tripId: string): Promise<MessageWithSender[]> {
  const access = await getTripCommunicationAccess(tripId);
  if (!access.canView) {
    logWarn('chat.read_denied', { tripId });
    throw new UnauthorizedError();
  }

  const db = getAdminFirestore();
  let snap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;

  try {
    snap = await db
      .collection('messages')
      .where('trip_id', '==', tripId)
      .orderBy('created_at', 'asc')
      .get();
  } catch {
    snap = await db
      .collection('messages')
      .where('trip_id', '==', tripId)
      .get();
  }

  if (snap.empty) return [];

  const senderIds = [...new Set(snap.docs.map((doc) => doc.data().sender_id as string))];
  const userMap = new Map<string, UserProfile>();

  for (const senderId of senderIds) {
    const profile = await getUserProfile(db, senderId);
    if (profile) userMap.set(senderId, profile);
  }

  return snap.docs
    .map((doc) => toMessageWithSender(doc.id, doc.data(), userMap))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/** Sends a message to a trip chat */
export async function sendTripMessage(tripId: string, content: string): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const access = await getTripCommunicationAccessForUser(user.id, tripId);
  if (!access.canView) {
    logWarn('chat.read_denied', {
      tripId,
      userId: user.id,
      reason: 'cannot_view_trip_communication',
    });
    throw new UnauthorizedError('Unauthorized to view this trip communication');
  }

  if (!access.canSendMessages) {
    logWarn('chat.send_denied', {
      tripId,
      userId: user.id,
      reason: access.restrictionReason ?? 'trip_read_only',
    });
    if (access.restrictionReason === 'blocked_participant') {
      throw new UnauthorizedError('Free-text messaging is unavailable because a participant is blocked');
    }

    throw new UnauthorizedError('Trip messaging is read-only for this trip');
  }

  const db = getAdminFirestore();
  const userProfileDoc = await db.collection('users').doc(user.id).get();
  const userProfile = userProfileDoc.data();
  const trimmedContent = content.trim();
  const senderDisplayName = userProfile?.display_name ?? 'Someone';
  const senderAvatarUrl = userProfile?.avatar_url ?? null;
  const ref = await db.collection('messages').add({
    trip_id: tripId,
    sender_id: user.id,
    content: trimmedContent,
    created_at: new Date().toISOString(),
    sender_display_name: senderDisplayName,
    sender_avatar_url: senderAvatarUrl,
  });

  await trackEvent('message_sent', {
    userId: user.id,
    payload: { trip_id: tripId, message_id: ref.id },
  });

  try {
    const tripDoc = await db.collection('trips').doc(tripId).get();
    const tripData = tripDoc.data();
    if (tripData) {
      const notifyIds = new Set<string>();
      if (tripData.driver_id !== user.id) notifyIds.add(tripData.driver_id);

      const bookings = await db.collection('bookings')
        .where('trip_id', '==', tripId)
        .where('status', '==', 'confirmed')
        .get();

      bookings.docs.forEach((doc) => {
        const passengerId = doc.data().passenger_id as string;
        if (passengerId !== user.id) notifyIds.add(passengerId);
      });

      await Promise.all(
        Array.from(notifyIds).map((id) =>
          createNotification({
            userId: id,
            type: 'message',
            title: 'New trip message',
            body: `${senderDisplayName}: ${trimmedContent}`,
            linkUrl: `/trips/${tripId}/chat`,
          })
        )
      );
    }
  } catch {
    // non-critical
  }

  return ref.id;
}

/** Fetches the message inbox (grouped by trips) for the current user */
export async function getInboxThreads(): Promise<InboxThread[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();

  const [driverSnap, passengerSnap] = await Promise.all([
    db.collection('trips')
      .where('driver_id', '==', user.id)
      .get(),
    db.collection('bookings')
      .where('passenger_id', '==', user.id)
      .where('status', 'in', ['confirmed', 'cancelled'])
      .get(),
  ]);

  const tripMap = new Map<string, (TripsRow & { role: 'driver' | 'passenger' })>();

  for (const doc of driverSnap.docs) {
    tripMap.set(doc.id, { ...(doc.data() as TripsRow), role: 'driver' });
  }

  for (const bookingDoc of passengerSnap.docs) {
    const tripId = bookingDoc.data().trip_id as string;
    if (tripMap.has(tripId)) continue;

    const tripDoc = await db.collection('trips').doc(tripId).get();
    if (!tripDoc.exists) continue;

    tripMap.set(tripId, { ...(tripDoc.data() as TripsRow), role: 'passenger' });
  }

  const threads: InboxThread[] = [];

  for (const [tripId, tripData] of tripMap.entries()) {
    const access = await getTripCommunicationAccessForUser(user.id, tripId, db);
    if (!access.canView) {
      continue;
    }

    let msgSnap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
    try {
      msgSnap = await db
        .collection('messages')
        .where('trip_id', '==', tripId)
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();
    } catch {
      msgSnap = await db
        .collection('messages')
        .where('trip_id', '==', tripId)
        .get();
    }

    let lastMessage: MessageWithSender | null = null;

    if (!msgSnap.empty) {
      const latestDoc = [...msgSnap.docs].sort((a, b) => {
        const timeA = new Date((a.data().created_at as string) ?? 0).getTime();
        const timeB = new Date((b.data().created_at as string) ?? 0).getTime();
        return timeB - timeA;
      })[0];

      const senderProfile = await getUserProfile(db, latestDoc.data().sender_id as string);
      lastMessage = {
        id: latestDoc.id,
        ...latestDoc.data(),
        sender: senderProfile ?? {
          display_name: latestDoc.data().sender_display_name ?? null,
          avatar_url: latestDoc.data().sender_avatar_url ?? null,
        },
      } as MessageWithSender;
    }

    if (!lastMessage && !access.isActiveTrip) {
      continue;
    }

    let conversationWith = 'Passengers';
    if (tripData.role === 'passenger') {
      const driverProfile = await getUserProfile(db, tripData.driver_id);
      conversationWith = driverProfile?.display_name ?? 'Driver';
    }

    threads.push({
      tripId,
      tripTitle: `${tripData.origin_name} to ${tripData.destination_name}`,
      tripOrigin: tripData.origin_name,
      tripDestination: tripData.destination_name,
      tripDate: tripData.departure_time,
      communityName:
        typeof tripData.community_name === 'string' ? tripData.community_name : null,
      communityType: tripData.community_type === 'public' ? 'public' : 'verified',
      lastMessage,
      currentUserRole: tripData.role,
      conversationWith,
      isRestricted: access.isRestricted,
      canSendMessages: access.canSendMessages,
    });
  }

  return threads.sort((a, b) => {
    const timeA = new Date(a.lastMessage?.created_at ?? a.tripDate).getTime();
    const timeB = new Date(b.lastMessage?.created_at ?? b.tripDate).getTime();
    return timeB - timeA;
  });
}
