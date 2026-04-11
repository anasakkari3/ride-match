'use server';

import type {
  TripMode,
  TripPassengerGenderPreference,
  TripRulePresetKey,
  WeekdayIndex,
} from '@/lib/types';
import { createTrip as createTripService } from '@/lib/services/trip';

export async function createTrip(input: {
  communityId: string;
  originLat: number;
  originLng: number;
  originName: string;
  destinationLat: number;
  destinationLng: number;
  destinationName: string;
  vehicleMakeModel: string;
  vehicleColor?: string | null;
  driverNote?: string | null;
  tripRulePresetKeys?: TripRulePresetKey[];
  tripRulesNote?: string | null;
  passengerGenderPreference?: TripPassengerGenderPreference | null;
  departureTime?: string;
  seatsTotal: number;
  priceCents?: number | null;
  // Recurring fields
  tripMode?: TripMode;
  recurringDays?: WeekdayIndex[];
  recurringDepartureTime?: string;
}) {
  return createTripService(input);
}
