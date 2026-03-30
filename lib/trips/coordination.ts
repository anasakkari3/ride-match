import type { TripsRow } from '@/lib/types';
import { getEffectiveTripStatus } from './lifecycle';

export type CoordinationActionKey = 'PASSENGER_HERE' | 'PASSENGER_LATE' | 'DRIVER_CONFIRMED';

type CoordinationTripTarget = Pick<TripsRow, 'status' | 'seats_available' | 'departure_time'>;

export function hasTripDeparted(trip: Pick<TripsRow, 'departure_time'>): boolean {
  return new Date(trip.departure_time).getTime() <= Date.now();
}

export function isPreDepartureTrip(trip: CoordinationTripTarget): boolean {
  const status = getEffectiveTripStatus(trip);
  return (status === 'scheduled' || status === 'full') && !hasTripDeparted(trip);
}

export function getAvailableCoordinationActions(input: {
  trip: CoordinationTripTarget;
  isDriver: boolean;
  hasConfirmedBooking: boolean;
}): CoordinationActionKey[] {
  if (!isPreDepartureTrip(input.trip)) return [];

  if (input.isDriver) {
    return ['DRIVER_CONFIRMED'];
  }

  if (input.hasConfirmedBooking) {
    return ['PASSENGER_HERE', 'PASSENGER_LATE'];
  }

  return [];
}

export function canSendCoordinationAction(input: {
  trip: CoordinationTripTarget;
  isDriver: boolean;
  hasConfirmedBooking: boolean;
  action: CoordinationActionKey;
}): boolean {
  return getAvailableCoordinationActions(input).includes(input.action);
}

export function canDisplayPassengerCancelAction(input: {
  trip: CoordinationTripTarget;
  hasConfirmedBooking: boolean;
}): boolean {
  return input.hasConfirmedBooking && isPreDepartureTrip(input.trip);
}

export function canDisplayDriverCancelAction(input: {
  trip: CoordinationTripTarget;
  isDriver: boolean;
}): boolean {
  return input.isDriver && isPreDepartureTrip(input.trip);
}
