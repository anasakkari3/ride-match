import type { TripRulePresetKey } from '@/lib/types';

export const TRIP_RULE_PRESET_KEYS: TripRulePresetKey[] = [
  'no_delay',
  'wait_5_minutes',
  'no_smoking',
  'prefer_quiet',
  'fixed_meeting_point',
  'confirm_attendance',
];

export const MAX_VEHICLE_MAKE_MODEL_LENGTH = 60;
export const MAX_VEHICLE_COLOR_LENGTH = 30;
export const MAX_DRIVER_NOTE_LENGTH = 160;
export const MAX_TRIP_RULES_NOTE_LENGTH = 160;

export function isTripRulePresetKey(value: string): value is TripRulePresetKey {
  return TRIP_RULE_PRESET_KEYS.includes(value as TripRulePresetKey);
}

export function sanitizeTripRulePresetKeys(
  values: readonly string[] | null | undefined
): TripRulePresetKey[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const uniqueKeys = new Set<TripRulePresetKey>();
  for (const value of values) {
    if (typeof value === 'string' && isTripRulePresetKey(value)) {
      uniqueKeys.add(value);
    }
  }

  return TRIP_RULE_PRESET_KEYS.filter((key) => uniqueKeys.has(key));
}
