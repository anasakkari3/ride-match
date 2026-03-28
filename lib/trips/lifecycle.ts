import type { TripStatus, TripsRow } from '@/lib/types';

type TripLifecycleTarget = Pick<TripsRow, 'status' | 'seats_available'>;

export const TRIP_STATUSES: readonly TripStatus[] = [
  'draft',
  'scheduled',
  'full',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export const BOOKABLE_TRIP_STATUSES = ['scheduled', 'full'] as const;
export const ACTIVE_TRIP_STATUSES = ['scheduled', 'full', 'in_progress'] as const;

export const TRIP_TRANSITIONS: Record<TripStatus, readonly TripStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['full', 'in_progress', 'cancelled'],
  full: ['scheduled', 'in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed: [],
  cancelled: [],
};

export function getEffectiveTripStatus(trip: TripLifecycleTarget): TripStatus {
  if (trip.status === 'scheduled' || trip.status === 'full') {
    return trip.seats_available <= 0 ? 'full' : 'scheduled';
  }

  return trip.status;
}

export function canTransitionTripState(from: TripStatus, to: TripStatus): boolean {
  return TRIP_TRANSITIONS[from].includes(to);
}

export function getBookableTripStatus(trip: TripLifecycleTarget): TripStatus {
  return getEffectiveTripStatus(trip);
}

export function syncTripStatusWithSeats(
  currentStatus: TripStatus,
  seatsAvailable: number
): TripStatus {
  if (currentStatus === 'cancelled' || currentStatus === 'completed' || currentStatus === 'in_progress') {
    return currentStatus;
  }

  if (currentStatus === 'draft') {
    return 'draft';
  }

  return seatsAvailable <= 0 ? 'full' : 'scheduled';
}

export function isActiveTripStatus(status: TripStatus): boolean {
  return status === 'scheduled' || status === 'full' || status === 'in_progress';
}
