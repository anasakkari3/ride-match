/**
 * Shared domain types for the ride-match app.
 * Plain TypeScript interfaces - no Supabase dependency.
 */

/** User profile stored in Firestore `users` collection */
export type UsersRow = {
  id: string;
  phone: string | null;
  display_name: string | null;
  city_or_area: string | null;
  age: number | null;
  gender: string | null;
  is_driver: boolean | null;
  has_driver_license: boolean | null;
  gender_preference: string | null;
  license_image_status: DocumentPlaceholderStatus;
  insurance_image_status: DocumentPlaceholderStatus;
  license_declared: boolean;
  insurance_declared: boolean;
  avatar_url: string | null;
  /** Aggregate of ratings this user has received across all completed-trip roles. */
  rating_avg: number;
  /** Count of ratings this user has received across all completed-trip roles. */
  rating_count: number;
  created_at: string;
  updated_at: string;
};

export type CommunityType = 'verified' | 'public';
export type CommunityMembershipMode = 'open' | 'approval_required';
export type CommunityJoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type CommunityJoinSource = 'auto_public' | 'open_join' | 'approval' | 'invite';
export type DocumentPlaceholderStatus = 'not_provided' | 'provided_placeholder';

/** Community stored in Firestore `communities` collection */
export type CommunitiesRow = {
  id: string;
  name: string;
  description: string | null;
  type: CommunityType;
  membership_mode: CommunityMembershipMode;
  listed: boolean;
  is_system: boolean;
  invite_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** Community membership stored in Firestore `community_members` collection */
export type CommunityMembersRow = {
  community_id: string;
  user_id: string;
  role: 'member' | 'admin';
  joined_at: string;
  joined_via?: CommunityJoinSource | null;
};

/** Pending/approved/rejected join request stored in Firestore `community_join_requests` collection */
export type CommunityJoinRequestsRow = {
  community_id: string;
  user_id: string;
  status: CommunityJoinRequestStatus;
  request_note?: string | null;
  decision_note?: string | null;
  created_at: string;
  resolved_at?: string | null;
  resolved_by?: string | null;
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
  community_name?: string | null;
  community_type?: CommunityType | null;
  seats_total: number;
  seats_available: number;
  price_cents: number | null;
  status: TripStatus;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
};

/** Booking stored in Firestore `bookings` collection */
export type BookingsRow = {
  id: string;
  trip_id: string;
  passenger_id: string;
  passenger_display_name?: string | null;
  passenger_avatar_url?: string | null;
  seats: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
};

/** Canonical identifiers for structured coordination signals */
export type TripCoordinationAction =
  | 'PASSENGER_HERE'
  | 'PASSENGER_LATE'
  | 'DRIVER_CONFIRMED'
  | 'DRIVER_CANCELED_TRIP'
  | 'PASSENGER_CANCELED_SEAT';

/** Message stored in Firestore `messages` collection */
export type MessagesRow = {
  id: string;
  trip_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_display_name?: string | null;
  sender_avatar_url?: string | null;
  /** Present only for structured coordination signals - not user-typed chat */
  coordination_action?: TripCoordinationAction | null;
};

/** Rating stored in Firestore `ratings` collection */
export type RatingsRow = {
  id: string;
  trip_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  feedback?: string | null;
  created_at: string;
};

/** Report stored in Firestore `reports` collection */
export type ReportsRow = {
  id: string;
  trip_id: string;
  community_id?: string | null;
  community_name?: string | null;
  reporter_id: string;
  reporter_display_name?: string | null;
  reported_id: string;
  reported_display_name?: string | null;
  reason: string;
  context?: string | null;
  status: 'pending' | 'reviewed' | 'resolved';
  review_note?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

/** User block stored in Firestore `user_blocks` collection */
export type UserBlocksRow = {
  blocker_id: string;
  blocked_id: string;
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

export type RequiredProfileField =
  | 'display_name'
  | 'phone'
  | 'city_or_area'
  | 'age'
  | 'gender'
  | 'is_driver';

/** Trip with optional driver relation */
export type TripWithDriver = TripsRow & {
  driver: UserProfile | null;
  driver_completed_drives?: number;
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
  community_name?: string | null;
  community_type?: CommunityType | null;
  driver_id: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats_available: number;
  price_cents: number | null;
  driver_received_rating_avg: number;
  driver_received_rating_count: number;
  driver_completed_drives: number;
  origin_dist_m: number;
  dest_dist_m: number;
  time_diff_mins: number;
  score: number;
};

/** Community info */
export type CommunityInfo = {
  id: string;
  name: string;
  description: string | null;
  type: CommunityType;
  membership_mode: CommunityMembershipMode;
  listed: boolean;
  is_system: boolean;
  invite_code: string | null;
};

/** Booking status values */
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

/** Trip membership role stored in Firestore `trip_memberships` collection */
export type TripMembershipRole = 'driver' | 'passenger';

/** Trip membership status stored in Firestore `trip_memberships` collection */
export type TripMembershipStatus = 'driver' | 'confirmed' | 'cancelled';

/** Trip membership stored in Firestore `trip_memberships` collection */
export type TripMembershipsRow = {
  trip_id: string;
  user_id: string;
  role: TripMembershipRole;
  status: TripMembershipStatus;
  updated_at: string;
};
