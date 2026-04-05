import type { TripsRow } from '@/lib/types';
import { getEffectiveTripStatus } from './lifecycle';

type TripLifecyclePermissionTarget = Pick<
  TripsRow,
  'driver_id' | 'status' | 'seats_available' | 'departure_time'
>;

type PermissionDecision = { allowed: boolean; reason?: string };

export function canStartTrip(
  userId: string | undefined | null,
  trip: TripLifecyclePermissionTarget
): PermissionDecision {
  const status = getEffectiveTripStatus(trip);
  if (!userId || trip.driver_id !== userId) return { allowed: false, reason: 'unauthorized' };
  if (status !== 'scheduled' && status !== 'full') return { allowed: false, reason: 'invalid_status' };

  const now = Date.now();
  const departureTime = new Date(trip.departure_time).getTime();
  const earliestStart = departureTime - (30 * 60 * 1000);

  if (now < earliestStart) {
    return { allowed: false, reason: 'too_early' };
  }

  return { allowed: true };
}

export function canCompleteTrip(
  userId: string | undefined | null,
  trip: TripLifecyclePermissionTarget
): PermissionDecision {
  const status = getEffectiveTripStatus(trip);
  if (!userId || trip.driver_id !== userId) return { allowed: false, reason: 'unauthorized' };
  if (status !== 'in_progress') return { allowed: false, reason: 'invalid_status' };
  return { allowed: true };
}
