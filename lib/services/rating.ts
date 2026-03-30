import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';
import { trackEvent } from './analytics';
import { AppError, NotFoundError, UnauthorizedError } from '@/lib/utils/errors';

export async function hasUserRatedTrip(tripId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  const db = getAdminFirestore();
  const existingSnap = await db.collection('ratings')
    .where('trip_id', '==', tripId)
    .where('rater_id', '==', user.id)
    .limit(1)
    .get();
  return !existingSnap.empty;
}

export async function submitRating(
  tripId: string,
  clientRatedUserId: string,
  score: number,
  feedback?: string
) {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  if (score < 1 || score > 5) throw new AppError('Score must be 1-5', 'BAD_REQUEST');

  const db = getAdminFirestore();

  const finalRatedUserId = await db.runTransaction(async (transaction) => {
    // 1. Check constraints
    const tripRef = db.collection('trips').doc(tripId);
    const tripDoc = await transaction.get(tripRef);
    if (!tripDoc.exists) throw new NotFoundError('Trip not found');
    const trip = tripDoc.data()!;
    if (trip.status !== 'completed') throw new AppError('Trip not completed', 'BAD_REQUEST');

    let ratedUserId = clientRatedUserId;

    if (trip.driver_id === user.id) {
      // Driver rating a passenger
      const targetBookingSnap = await transaction.get(
        db.collection('bookings')
          .where('trip_id', '==', tripId)
          .where('passenger_id', '==', clientRatedUserId)
          .where('status', '==', 'confirmed')
      );
      if (targetBookingSnap.empty) {
        throw new AppError('User is not a confirmed passenger on this trip', 'BAD_REQUEST');
      }
    } else {
      // Passenger rating the driver
      const myBookingSnap = await transaction.get(
        db.collection('bookings')
          .where('trip_id', '==', tripId)
          .where('passenger_id', '==', user.id)
          .where('status', '==', 'confirmed')
      );
      if (myBookingSnap.empty) {
        throw new UnauthorizedError('Not a participant');
      }
      // Strictly enforce rating target to be the driver (ignore potentially malicious client input)
      ratedUserId = trip.driver_id;
    }

    if (user.id === ratedUserId) {
      throw new AppError('Cannot rate yourself', 'BAD_REQUEST');
    }

    const existingSnap = await transaction.get(
      db.collection('ratings')
        .where('trip_id', '==', tripId)
        .where('rater_id', '==', user.id)
        .where('rated_id', '==', ratedUserId)
    );
    if (!existingSnap.empty) {
      throw new AppError('Already rated this user on this trip', 'BAD_REQUEST');
    }

    // 2. Add rating document
    const ratingRef = db.collection('ratings').doc();
    transaction.set(ratingRef, {
      trip_id: tripId,
      rater_id: user.id,
      rated_id: ratedUserId,
      score,
      feedback: feedback?.trim() ? feedback.trim() : null,
      created_at: new Date().toISOString(),
    });

    // 3. Update the user's received-rating aggregate safely.
    // Since we are adding one rating, we can calculate the new average from the old average and count.
    const userRef = db.collection('users').doc(ratedUserId);
    const userDoc = await transaction.get(userRef);
    if (userDoc.exists) {
      const u = userDoc.data();
      const oldCount = u?.rating_count || 0;
      const oldAvg = u?.rating_avg || 0;
      const newCount = oldCount + 1;
      const newAvg = ((oldAvg * oldCount) + score) / newCount;
      transaction.update(userRef, {
        rating_avg: Math.round(newAvg * 100) / 100,
        rating_count: newCount,
      });
    }

    return ratedUserId;
  });

  await trackEvent('rating_submitted', {
    userId: user.id,
    payload: { trip_id: tripId, rated_id: finalRatedUserId, score },
  });
}
