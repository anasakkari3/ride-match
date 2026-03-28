/**
 * Shared domain types for the ride-match app.
 * Plain TypeScript interfaces — no Supabase dependency.
 */

/** User profile stored in Firestore `users` collection */
export type UsersRow = {
  id: string;
  phone: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
};

/** Community stored in Firestore `communities` collection */
export type CommunitiesRow = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

/** Community membership stored in Firestore `community_members` collection */
export type CommunityMembersRow = {
  community_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
};

/** Trip status values */
export type TripStatus =
  | 'draft'
  | 'scheduled'
  | 'full'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

/** Trip stored in Firestore `trips` collection */
export type TripsRow = {
  id: string;
  community_id: string;
  driver_id: string;
  origin_lat: number;
  origin_lng: number;
  origin_name: string;
  destination_lat: number;
  destination_lng: number;
  destination_name: string;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  price_cents: number | null;
  status: TripStatus;
  created_at: string;
};

/** Booking stored in Firestore `bookings` collection */
export type BookingsRow = {
  id: string;
  trip_id: string;
  passenger_id: string;
  seats: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
};

/** Message stored in Firestore `messages` collection */
export type MessagesRow = {
  id: string;
  trip_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

/** Rating stored in Firestore `ratings` collection */
export type RatingsRow = {
  id: string;
  trip_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  created_at: string;
};

/** Notification stored in Firestore `notifications` collection */
export type NotificationsRow = {
  id: string;
  user_id: string;
  type: 'booking' | 'cancellation' | 'message' | 'system';
  title: string;
  body: string;
  is_read: boolean;
  link_url?: string | null;
  created_at: string;
};

/** Analytics event stored in Firestore `analytics_events` collection */
export type AnalyticsEventsRow = {
  id: string;
  event_name: string;
  user_id: string | null;
  community_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

/** User profile subset used in UI and relations */
export type UserProfile = Pick<UsersRow, 'id' | 'display_name' | 'avatar_url' | 'rating_avg' | 'rating_count'>;

/** Trip with optional driver relation */
export type TripWithDriver = TripsRow & {
  driver: UserProfile | null;
};

/** Booking with optional passenger relation */
export type BookingWithPassenger = BookingsRow & {
  passenger?: UserProfile | null;
};

/** Message with optional sender relation */
export type MessageWithSender = MessagesRow & {
  sender: Pick<UserProfile, 'display_name' | 'avatar_url'> | null;
};

/** Search result row shape */
export type TripSearchResult = {
  id: string;
  community_id: string;
  driver_id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats_available: number;
  price_cents: number | null;
  driver_rating_avg: number;
  driver_rating_count: number;
  origin_dist_m: number;
  dest_dist_m: number;
  time_diff_mins: number;
  score: number;
};

/** Community info */
export type CommunityInfo = {
  id: string;
  name: string;
};

/** Booking status values */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
