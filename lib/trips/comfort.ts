import type {
  DriverGenderFilter,
  TripPassengerGenderPreference,
  UsersRow,
} from '@/lib/types';

export const DRIVER_GENDER_FILTER_VALUES: DriverGenderFilter[] = ['any', 'man', 'woman'];
export const TRIP_PASSENGER_GENDER_PREFERENCE_VALUES: TripPassengerGenderPreference[] = [
  'any',
  'men_only',
  'women_only',
];

export function isDriverGenderFilter(value: string): value is DriverGenderFilter {
  return DRIVER_GENDER_FILTER_VALUES.includes(value as DriverGenderFilter);
}

export function normalizeDriverGenderFilter(
  value: string | null | undefined
): DriverGenderFilter {
  if (typeof value !== 'string') {
    return 'any';
  }

  return isDriverGenderFilter(value) ? value : 'any';
}

export function isTripPassengerGenderPreference(
  value: string
): value is TripPassengerGenderPreference {
  return TRIP_PASSENGER_GENDER_PREFERENCE_VALUES.includes(
    value as TripPassengerGenderPreference
  );
}

export function normalizeTripPassengerGenderPreference(
  value: string | null | undefined
): TripPassengerGenderPreference {
  if (typeof value !== 'string') {
    return 'any';
  }

  return isTripPassengerGenderPreference(value) ? value : 'any';
}

export function doesDriverGenderMatchFilter(
  driverGender: UsersRow['gender'] | null | undefined,
  filter: DriverGenderFilter
) {
  if (filter === 'any') {
    return true;
  }

  return driverGender === filter;
}

export function doesPassengerGenderMatchPreference(
  passengerGender: UsersRow['gender'] | null | undefined,
  preference: TripPassengerGenderPreference | null | undefined
) {
  const normalizedPreference = normalizeTripPassengerGenderPreference(preference);
  if (normalizedPreference === 'any') {
    return true;
  }

  if (normalizedPreference === 'men_only') {
    return passengerGender === 'man';
  }

  return passengerGender === 'woman';
}
