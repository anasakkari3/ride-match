import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import { isCommunityAdmin } from '@/lib/auth/permissions';
import type { CommunityInfo, ReportsRow } from '@/lib/types';
import { AppError, NotFoundError, UnauthorizedError } from '@/lib/utils/errors';
import { createNotification } from './notification';

export async function getFunnelMetrics(communityId: string) {
  try {
    const db = getAdminFirestore();
    await requireCommunityAdminAccess(communityId, db);
    const snap = await db
      .collection('analytics_events')
      .where('community_id', '==', communityId)
      .limit(10000)
      .get();

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

export async function getDailyTripsAndBookings(communityId: string) {
  try {
    const db = getAdminFirestore();
    await requireCommunityAdminAccess(communityId, db);

    const tripsSnap = await db
      .collection('trips')
      .where('community_id', '==', communityId)
      .limit(5000)
      .get();

    const trips = tripsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
      id: string; community_id: string; created_at: string;
    }[];
    const tripMap = new Map(trips.map((t) => [t.id, t]));

    const bookings: {
      id: string; created_at: string; trip_id: string;
    }[] = [];
    const tripIds = trips.map((trip) => trip.id);
    for (let i = 0; i < tripIds.length; i += 30) {
      const chunk = tripIds.slice(i, i + 30);
      if (chunk.length === 0) continue;
      const bookingSnap = await db
        .collection('bookings')
        .where('trip_id', 'in', chunk)
        .limit(5000)
        .get();
      bookings.push(
        ...bookingSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
          id: string; created_at: string; trip_id: string;
        }[]
      );
    }

    const communityDoc = await db.collection('communities').doc(communityId).get();
    const communityName = communityDoc.exists ? ((communityDoc.data()?.name as string | undefined) ?? null) : null;

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
        community_name: communityName,
        trips: v.trips,
        bookings: v.bookings,
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 100);
  } catch {
    return [];
  }
}

export type ManagedAdminCommunity = CommunityInfo & {
  role: 'admin';
};

export type CommunityJoinRequestQueueItem = {
  id: string;
  community_id: string;
  community_name: string;
  user_id: string;
  user_display_name: string | null;
  created_at: string;
  request_note: string | null;
};

export type CommunityReportQueueItem = {
  id: string;
  trip_id: string;
  community_id: string;
  community_name: string | null;
  reporter_id: string;
  reporter_display_name: string | null;
  reported_id: string;
  reported_display_name: string | null;
  reason: string;
  context: string | null;
  created_at: string;
  status: ReportsRow['status'];
};

function normalizeAdminCommunity(
  id: string,
  data: FirebaseFirestore.DocumentData
): ManagedAdminCommunity {
  return {
    id,
    name: (data.name as string) ?? 'Community',
    description: typeof data.description === 'string' ? data.description : null,
    type: data.type === 'public' ? 'public' : 'verified',
    membership_mode: data.membership_mode === 'approval_required' ? 'approval_required' : 'open',
    listed: typeof data.listed === 'boolean' ? data.listed : false,
    is_system: data.is_system === true,
    invite_code: typeof data.invite_code === 'string' ? data.invite_code : null,
    role: 'admin',
  };
}

async function requireCommunityAdminAccess(
  communityId: string,
  db: FirebaseFirestore.Firestore
): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const hasAccess = await isCommunityAdmin(user.id, communityId, db);
  if (!hasAccess) {
    throw new UnauthorizedError('Only community admins can access this queue');
  }

  return user.id;
}

export async function getAdminCommunities(): Promise<ManagedAdminCommunity[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getAdminFirestore();
  const membershipSnap = await db
    .collection('community_members')
    .where('user_id', '==', user.id)
    .where('role', '==', 'admin')
    .get();

  if (membershipSnap.empty) return [];

  const communityIds = membershipSnap.docs.map((doc) => doc.data().community_id as string);
  const chunks: string[][] = [];
  for (let i = 0; i < communityIds.length; i += 30) {
    chunks.push(communityIds.slice(i, i + 30));
  }

  const communities: ManagedAdminCommunity[] = [];
  for (const chunk of chunks) {
    const communitySnap = await db.collection('communities').where('__name__', 'in', chunk).get();
    communities.push(...communitySnap.docs.map((doc) => normalizeAdminCommunity(doc.id, doc.data())));
  }

  return communities.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPendingJoinRequestQueue(
  communityId: string
): Promise<CommunityJoinRequestQueueItem[]> {
  const db = getAdminFirestore();
  await requireCommunityAdminAccess(communityId, db);

  const [communityDoc, requestSnap] = await Promise.all([
    db.collection('communities').doc(communityId).get(),
    db
      .collection('community_join_requests')
      .where('community_id', '==', communityId)
      .where('status', '==', 'pending')
      .get(),
  ]);

  if (!communityDoc.exists) throw new NotFoundError('Community not found');
  const communityName = (communityDoc.data()?.name as string) ?? 'Community';

  const userIds = [...new Set(requestSnap.docs.map((doc) => doc.data().user_id as string))];
  const userMap = new Map<string, string | null>();
  for (const userId of userIds) {
    const userDoc = await db.collection('users').doc(userId).get();
    userMap.set(userId, userDoc.data()?.display_name ?? null);
  }

  return requestSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        community_id: communityId,
        community_name: communityName,
        user_id: data.user_id as string,
        user_display_name: userMap.get(data.user_id as string) ?? null,
        created_at: data.created_at as string,
        request_note: typeof data.request_note === 'string' ? data.request_note : null,
      };
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function getPendingReportsForCommunity(
  communityId: string
): Promise<CommunityReportQueueItem[]> {
  const db = getAdminFirestore();
  await requireCommunityAdminAccess(communityId, db);

  const reportSnap = await db.collection('reports').where('status', '==', 'pending').limit(200).get();
  if (reportSnap.empty) return [];

  const tripCache = new Map<string, FirebaseFirestore.DocumentData | null>();
  const userCache = new Map<string, string | null>();
  const queue: CommunityReportQueueItem[] = [];

  for (const doc of reportSnap.docs) {
    const data = doc.data();
    let reportCommunityId = typeof data.community_id === 'string' ? data.community_id : null;
    let reportCommunityName = typeof data.community_name === 'string' ? data.community_name : null;

    if (!reportCommunityId) {
      const tripId = data.trip_id as string;
      if (!tripCache.has(tripId)) {
        const tripDoc = await db.collection('trips').doc(tripId).get();
        tripCache.set(tripId, tripDoc.exists ? tripDoc.data() ?? null : null);
      }
      const trip = tripCache.get(tripId);
      reportCommunityId = typeof trip?.community_id === 'string' ? (trip.community_id as string) : null;
      reportCommunityName =
        typeof trip?.community_name === 'string' ? (trip.community_name as string) : reportCommunityName;
    }

    if (reportCommunityId !== communityId) continue;

    const reporterId = data.reporter_id as string;
    const reportedId = data.reported_id as string;
    if (!userCache.has(reporterId)) {
      const reporterDoc = await db.collection('users').doc(reporterId).get();
      userCache.set(reporterId, reporterDoc.data()?.display_name ?? null);
    }
    if (!userCache.has(reportedId)) {
      const reportedDoc = await db.collection('users').doc(reportedId).get();
      userCache.set(reportedId, reportedDoc.data()?.display_name ?? null);
    }

    queue.push({
      id: doc.id,
      trip_id: data.trip_id as string,
      community_id: communityId,
      community_name: reportCommunityName,
      reporter_id: reporterId,
      reporter_display_name:
        (typeof data.reporter_display_name === 'string' ? data.reporter_display_name : null) ??
        userCache.get(reporterId) ??
        null,
      reported_id: reportedId,
      reported_display_name:
        (typeof data.reported_display_name === 'string' ? data.reported_display_name : null) ??
        userCache.get(reportedId) ??
        null,
      reason: data.reason as string,
      context: typeof data.context === 'string' ? data.context : null,
      created_at: data.created_at as string,
      status: (data.status as ReportsRow['status']) ?? 'pending',
    });
  }

  return queue.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function updateReportStatus(
  reportId: string,
  communityId: string,
  status: Extract<ReportsRow['status'], 'reviewed' | 'resolved'>,
  note?: string
): Promise<{ ok: true }> {
  const db = getAdminFirestore();
  const reviewerId = await requireCommunityAdminAccess(communityId, db);

  const reportRef = db.collection('reports').doc(reportId);
  const reportDoc = await reportRef.get();
  if (!reportDoc.exists) throw new NotFoundError('Report not found');

  const report = reportDoc.data() as ReportsRow;
  let reportCommunityId = report.community_id ?? null;

  if (!reportCommunityId) {
    const tripDoc = await db.collection('trips').doc(report.trip_id).get();
    if (!tripDoc.exists) throw new NotFoundError('Trip not found for report');
    reportCommunityId = (tripDoc.data()?.community_id as string | undefined) ?? null;
  }

  if (reportCommunityId !== communityId) {
    throw new UnauthorizedError('This report does not belong to your community');
  }

  if (report.status === 'resolved' && status === 'reviewed') {
    throw new AppError('Resolved reports cannot move back to reviewed', 'BAD_REQUEST');
  }

  const trimmedNote = note?.trim() || null;
  const reviewedAt = new Date().toISOString();

  await reportRef.update({
    status,
    review_note: trimmedNote,
    reviewed_at: reviewedAt,
    reviewed_by: reviewerId,
  });

  try {
    await createNotification({
      userId: report.reporter_id,
      type: 'system',
      title: status === 'resolved' ? 'Report resolved' : 'Report reviewed',
      body: trimmedNote
        ? `Your report about ${report.reported_display_name ?? 'this user'} was ${status}. Note: ${trimmedNote}`
        : `Your report about ${report.reported_display_name ?? 'this user'} was ${status}.`,
      linkUrl: `/trips/${report.trip_id}`,
    });
  } catch {
    // notifications are non-critical
  }

  return { ok: true };
}
