import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { BookingsRow, MessageWithSender, TripsRow, UserProfile } from '@/lib/types';
import { trackEvent } from './analytics';
import { createNotification } from './notification';
import { canAccessTripChat } from '@/lib/auth/permissions';
import { UnauthorizedError } from '@/lib/utils/errors';

export type InboxThread = {
    tripId: string;
    tripTitle: string;
    tripDate: string;
    lastMessage: MessageWithSender | null;
    currentUserRole: 'driver' | 'passenger';
    conversationWith: string;
};

/** Checks if the current user is authorized to view a trip's chat */
export async function canUserAccessChat(tripId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    const db = getAdminFirestore();

    const tripDoc = await db.collection('trips').doc(tripId).get();
    if (!tripDoc.exists) return false;
    const tripData = tripDoc.data()! as TripsRow;

    const bookingSnap = await db
        .collection('bookings')
        .where('trip_id', '==', tripId)
        .where('status', '==', 'confirmed')
        .get();

    return canAccessTripChat(user.id, tripData, bookingSnap.docs.map(d => d.data() as BookingsRow));
}

async function getUserProfile(db: FirebaseFirestore.Firestore, userId: string): Promise<UserProfile | null> {
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    const d = doc.data()!;
    return {
        id: doc.id,
        display_name: d.display_name ?? null,
        avatar_url: d.avatar_url ?? null,
        rating_avg: d.rating_avg ?? 0,
        rating_count: d.rating_count ?? 0,
    };
}

/** Fetches messages for a specific trip */
export async function getTripMessages(tripId: string): Promise<MessageWithSender[]> {
    const isAuthorized = await canUserAccessChat(tripId);
    if (!isAuthorized) throw new UnauthorizedError();

    const db = getAdminFirestore();
    let snap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
    try {
        snap = await db
            .collection('messages')
            .where('trip_id', '==', tripId)
            .orderBy('created_at', 'asc')
            .get();
    } catch {
        // Fallback for missing Firestore indexes or transient query failures.
        snap = await db
            .collection('messages')
            .where('trip_id', '==', tripId)
            .get();
    }

    if (snap.empty) return [];

    const senderIds = [...new Set(snap.docs.map(d => d.data().sender_id as string))];
    const userMap = new Map<string, UserProfile>();

    for (const senderId of senderIds) {
        const profile = await getUserProfile(db, senderId);
        if (profile) userMap.set(senderId, profile);
    }

    return snap.docs
        .map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                sender: userMap.get(data.sender_id) ?? null,
            } as MessageWithSender;
        })
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

/** Sends a message to a trip chat */
export async function sendTripMessage(tripId: string, content: string): Promise<string> {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError();

    const isAuthorized = await canUserAccessChat(tripId);
    if (!isAuthorized) throw new UnauthorizedError('Unauthorized to send messages in this trip');

    const db = getAdminFirestore();

    const ref = await db.collection('messages').add({
        trip_id: tripId,
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
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
            bookings.docs.forEach(b => {
                 const pid = b.data().passenger_id as string;
                 if (pid !== user.id) notifyIds.add(pid);
            });

            const notifyPromises = Array.from(notifyIds).map(id => 
                createNotification({
                    userId: id,
                    type: 'message',
                    title: 'New Message',
                    body: `${user.displayName ?? 'Someone'}: ${content.trim()}`,
                    linkUrl: `/trips/${tripId}/chat`
                })
            );
            await Promise.all(notifyPromises);
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

    // 1. Get all trips where user is driver
    const driverSnap = await db
        .collection('trips')
        .where('driver_id', '==', user.id)
        .get();

    // 2. Get all bookings where user is passenger
    const passengerSnap = await db
        .collection('bookings')
        .where('passenger_id', '==', user.id)
        .get();

    const activeTripIds = new Set<string>();
    const tripsMap = new Map<string, (TripsRow & { role: 'driver' | 'passenger' })>();

    for (const d of driverSnap.docs) {
        activeTripIds.add(d.id);
        tripsMap.set(d.id, { ...(d.data() as TripsRow), role: 'driver' });
    }

    for (const p of passengerSnap.docs) {
        const tid = p.data().trip_id as string;
        activeTripIds.add(tid);

        // We need to fetch the trip details if we don't have them yet
        if (!tripsMap.has(tid)) {
            const tripDoc = await db.collection('trips').doc(tid).get();
            if (tripDoc.exists) {
                tripsMap.set(tid, { ...(tripDoc.data() as TripsRow), role: 'passenger' });
            }
        }
    }

    const threads: InboxThread[] = [];

    // For each trip, fetch the latest message
    for (const tripId of Array.from(activeTripIds)) {
        const tripData = tripsMap.get(tripId);
        if (!tripData) continue;

        let msgSnap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
        try {
            msgSnap = await db
                .collection('messages')
                .where('trip_id', '==', tripId)
                .orderBy('created_at', 'desc')
                .limit(1)
                .get();
        } catch {
            // Fallback for missing Firestore indexes or transient query failures.
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
            const msgData = latestDoc.data();
            const senderProfile = await getUserProfile(db, msgData.sender_id);
            lastMessage = {
                id: latestDoc.id,
                ...msgData,
                sender: senderProfile,
            } as MessageWithSender;
        }

        // Only show threads that have at least one message, or if it's an active upcoming trip, 
        // maybe we want them all available. The user specified "active conversations".
        // Let's only list trips that have at least one message to avoid cluttering the inbox.
        if (lastMessage) {
            let conversationWith = 'Passengers';
            if (tripData.role === 'passenger') {
                const driverProfile = await getUserProfile(db, tripData.driver_id);
                if (driverProfile && driverProfile.display_name) {
                    conversationWith = driverProfile.display_name;
                } else {
                    conversationWith = 'Driver';
                }
            }

            threads.push({
                tripId,
                tripTitle: `${tripData.origin_name} to ${tripData.destination_name}`,
                tripDate: tripData.departure_time,
                lastMessage,
                currentUserRole: tripData.role,
                conversationWith,
            });
        }
    }

    // Sort by latest message date
    return threads.sort((a, b) => {
        const timeA = new Date(a.lastMessage!.created_at).getTime();
        const timeB = new Date(b.lastMessage!.created_at).getTime();
        return timeB - timeA;
    });
}
