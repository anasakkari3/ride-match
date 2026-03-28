import { getAdminFirestore } from '@/lib/firebase/firestore-admin';

export async function getFunnelMetrics() {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('analytics_events').limit(10000).get();

    const counts: Record<string, number> = {};
    snap.docs.forEach((doc) => {
      const name = doc.data().event_name as string;
      counts[name] = (counts[name] ?? 0) + 1;
    });

    const order = [
      'auth_success',
      'trip_created',
      'trip_search',
      'trip_results_shown',
      'trip_opened',
      'booking_attempted',
      'booking_confirmed',
      'trip_completed',
      'rating_submitted',
    ];
    return order.map((event_name) => ({
      event_name,
      count: counts[event_name] ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getDailyTripsAndBookings() {
  try {
    const db = getAdminFirestore();

    const tripsSnap = await db.collection('trips').limit(5000).get();
    const bookingsSnap = await db.collection('bookings').limit(5000).get();

    const trips = tripsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string; community_id: string; created_at: string;
    }[];
    const bookings = bookingsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string; created_at: string; trip_id: string;
    }[];

    const tripMap = new Map(trips.map((t) => [t.id, t]));
    const communityIds = new Set<string>(trips.map((t) => t.community_id));
    bookings.forEach((b) => {
      const t = tripMap.get(b.trip_id);
      if (t) communityIds.add(t.community_id);
    });

    const nameMap = new Map<string, string>();
    for (const cid of communityIds) {
      const doc = await db.collection('communities').doc(cid).get();
      if (doc.exists) nameMap.set(cid, doc.data()!.name);
    }

    const byDateComm: Record<string, { trips: number; bookings: number; community_id: string }> = {};

    trips.forEach((t) => {
      const date = t.created_at.slice(0, 10);
      const key = `${date}-${t.community_id}`;
      if (!byDateComm[key]) byDateComm[key] = { trips: 0, bookings: 0, community_id: t.community_id };
      byDateComm[key].trips += 1;
    });

    bookings.forEach((b) => {
      const t = tripMap.get(b.trip_id);
      if (!t) return;
      const date = b.created_at.slice(0, 10);
      const key = `${date}-${t.community_id}`;
      if (!byDateComm[key]) byDateComm[key] = { trips: 0, bookings: 0, community_id: t.community_id };
      byDateComm[key].bookings += 1;
    });

    return Object.entries(byDateComm)
      .map(([key, v]) => ({
        date: key.split('-').slice(0, 3).join('-'),
        community_id: v.community_id,
        community_name: nameMap.get(v.community_id) ?? null,
        trips: v.trips,
        bookings: v.bookings,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 100);
  } catch {
    return [];
  }
}
