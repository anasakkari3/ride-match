'use server';

import { submitRating as submitRatingService } from '@/lib/services/rating';

export async function submitRating(
  tripId: string,
  ratedUserId: string,
  score: number,
  feedback?: string
) {
  return submitRatingService(tripId, ratedUserId, score, feedback);
}
