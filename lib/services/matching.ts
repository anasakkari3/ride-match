import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import type { TripSearchResult } from '@/lib/types';
import { trackEvent } from './analytics';
import { normalizeLocationName, calculateLocationMatchScore } from '../utils/locations';
import { UnauthorizedError } from '@/lib/utils/errors';
import { BOOKABLE_TRIP_STATUSES, getEffectiveTripStatus } from '@/lib/trips/lifecycle';
import { getCompletedDriveCountForDriver } from './trust';

export type SearchTripsParams = {
  communityId: string;
  originName: string;
  destinationName: string;
};

export async function searchTrips(params: SearchTripsParams) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();

  const db = getAdminFirestore();

  await trackEvent('trip_search', {
    userId: user.id,
    communityId: params.communityId,
    payload: {
      origin: params.originName,
      destination: params.destinationName,
    },
  });

  const originNorm = normalizeLocationName(params.originName);
  const destNorm = normalizeLocationName(params.destinationName);

  // Fetch all bookable trips in the community so older full-state records do not drift out of search.
  const snap = await db
    .collection('trips')
    .where('community_id', '==', params.communityId)
    .where('status', 'in', [...BOOKABLE_TRIP_STATUSES])
    .get();

  // Fetch block lists for symmetric enforcement
  const [blockedByUser, userBlockedBy] = await Promise.all([
    db.collection('user_blocks').where('blocker_id', '==', user.id).get(),
    db.collection('user_blocks').where('blocked_id', '==', user.id).get(),
  ]);

  const blockedIds = new Set([
    ...blockedByUser.docs.map(d => d.data().blocked_id),
    ...userBlockedBy.docs.map(d => d.data().blocker_id)
  ]);

  const exactMatches: TripSearchResult[] = [];
  const recommendations: TripSearchResult[] = [];

  const now = Date.now();

  for (const doc of snap.docs) {
    const t = doc.data();

    // Shield: Driver is blocked or blocked us
    if (blockedIds.has(t.driver_id)) continue;

    if (getEffectiveTripStatus({
      status: t.status,
      seats_available: t.seats_available,
    }) !== 'scheduled') continue;
    const tripOrigin = normalizeLocationName(t.origin_name as string);
    const tripDest = normalizeLocationName(t.destination_name as string);
    if (t.seats_available <= 0) continue;

    const baseScore = calculateLocationMatchScore(tripOrigin, tripDest, originNorm, destNorm);
    if (baseScore === 0) continue; // Skip unrelated routes

    // Multi-factor Scoring: Time Penalty and Seats Bonus
    const msAway = new Date(t.departure_time).getTime() - now;
    if (msAway < 0) continue; // Skip past trips

    const hoursAway = msAway / (1000 * 60 * 60);
    const timePenalty = Math.min(20, hoursAway * 0.5); // Max 20 points penalty for delays > 40hrs
    const seatsBonus = Math.min(5, t.seats_available); // Slight bonus for more ease of booking

    const finalScore = baseScore - timePenalty + seatsBonus;

    // Fetch driver trust data. Stored user ratings are generic received ratings, not driver-only ratings.
    let driverReceivedRatingAvg = 0;
    let driverReceivedRatingCount = 0;
    const driverDoc = await db.collection('users').doc(t.driver_id).get();
    if (driverDoc.exists) {
      const u = driverDoc.data()!;
      driverReceivedRatingAvg = u.rating_avg ?? 0;
      driverReceivedRatingCount = u.rating_count ?? 0;
    }
    const driverCompletedDrives = await getCompletedDriveCountForDriver(t.driver_id, db);

    const result: TripSearchResult = {
      id: doc.id,
      community_id: t.community_id,
      driver_id: t.driver_id,
      origin_name: t.origin_name,
      destination_name: t.destination_name,
      departure_time: t.departure_time,
      seats_available: t.seats_available,
      price_cents: t.price_cents,
      driver_received_rating_avg: driverReceivedRatingAvg,
      driver_received_rating_count: driverReceivedRatingCount,
      driver_completed_drives: driverCompletedDrives,
      origin_dist_m: 0,
      dest_dist_m: 0,
      time_diff_mins: Math.floor(hoursAway * 60),
      score: finalScore,
    };

    if (baseScore === 100) {
      exactMatches.push(result);
    } else {
      recommendations.push(result);
    }
  }

  // Multi-factor primary sort: Score (Descending)
  const multiFactorSort = (a: TripSearchResult, b: TripSearchResult) => {
      // 1. Sort by computed score
      if (b.score !== a.score) return b.score - a.score;
      // 2. Tie-breaker: closest time
      return new Date(a.departure_time).getTime() - new Date(b.departure_time).getTime();
  };

  exactMatches.sort(multiFactorSort);
  recommendations.sort(multiFactorSort);

  await trackEvent('trip_results_shown', {
    userId: user.id,
    communityId: params.communityId,
    payload: { exact: exactMatches.length, recommendations: recommendations.length },
  });

  return { exactMatches, recommendations };
}
