import { getAdminFirestore } from '@/lib/firebase/firestore-admin';
import { getCurrentUser } from '@/lib/auth/session';

export type AnalyticsEventName =
  | 'auth_success'
  | 'trip_created'
  | 'trip_search'
  | 'trip_results_shown'
  | 'trip_opened'
  | 'booking_attempted'
  | 'booking_confirmed'
  | 'trip_started'
  | 'trip_completed'
  | 'rating_submitted'
  | 'message_sent';

export async function trackEvent(
  eventName: AnalyticsEventName,
  options: { userId?: string; communityId?: string | null; payload?: Record<string, unknown> } = {}
) {
  try {
    const user = await getCurrentUser();
    const db = getAdminFirestore();
    await db.collection('analytics_events').add({
      event_name: eventName,
      user_id: options.userId ?? user?.id ?? null,
      community_id: options.communityId ?? null,
      payload: options.payload ?? {},
      created_at: new Date().toISOString(),
    });
  } catch {
    // Analytics is non-critical — never throw
  }
}
