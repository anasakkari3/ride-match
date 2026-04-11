/**
 * lib/trips/recurrence.ts
 *
 * Pure utility functions for recurring trip metadata.
 * No Firestore dependency — safe to import on client or server.
 *
 * Architecture note (MVP constraint):
 * Recurring trips are normal trip records with recurrence metadata attached.
 * There is no template system and no automatic instance creation.
 * departure_time on a recurring trip is the next computed occurrence at creation.
 * Drivers re-publish manually for each new period.
 */

import type { WeekdayIndex } from '@/lib/types';

export const VALID_WEEKDAYS: WeekdayIndex[] = [0, 1, 2, 3, 4, 5, 6];

/** Maximum number of weekdays a recurring trip can run. */
export const MAX_RECURRING_DAYS = 7;

/** Minimum weekdays required for a valid recurring trip. */
export const MIN_RECURRING_DAYS = 1;

// ─── Localized weekday names ────────────────────────────────────────────────

const WEEKDAY_NAMES = {
  en: { short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
  ar: { short: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'], long: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'] },
  he: { short: ['ראש', 'שני', 'שלי', 'רביע', 'חמי', 'שיש', 'שבת'], long: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] },
} as const;

type Lang = 'en' | 'ar' | 'he';

function normalizeLang(lang?: string): Lang {
  return lang === 'ar' || lang === 'he' ? lang : 'en';
}

// ─── Type guards ─────────────────────────────────────────────────────────────

/**
 * Returns true if the trip has a valid recurring mode with at least one day set.
 * Defensive: returns false for any incomplete or missing recurring metadata.
 */
export function isRecurringTrip(trip: {
  trip_mode?: string | null;
  recurring_days?: unknown;
  recurring_departure_time?: unknown;
}): boolean {
  if (trip.trip_mode !== 'recurring') return false;
  if (!Array.isArray(trip.recurring_days) || trip.recurring_days.length === 0) return false;
  if (typeof trip.recurring_departure_time !== 'string' || !isValidTimeString(trip.recurring_departure_time)) return false;
  return true;
}

// ─── Validation ───────────────────────────────────────────────────────────────

/** Validates HH:MM 24h format. */
export function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

/** Validates that weekday values are all valid WeekdayIndex values. */
export function isValidWeekdays(days: unknown): days is WeekdayIndex[] {
  if (!Array.isArray(days) || days.length === 0) return false;
  return days.every((d) => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6);
}

/**
 * Sanitizes a raw weekday array: filters to valid values, deduplicates, sorts ascending.
 * Never throws — returns empty array on bad input.
 */
export function sanitizeWeekdays(raw: unknown): WeekdayIndex[] {
  if (!Array.isArray(raw)) return [];
  const valid = raw
    .filter((d): d is WeekdayIndex => typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  return [...new Set(valid)];
}

// ─── Next occurrence computation ──────────────────────────────────────────────

/**
 * Computes the next ISO datetime occurrence for a recurring trip.
 *
 * Strategy:
 * 1. Start from "now + 5 minutes" (minimum scheduling lead).
 * 2. Find the next calendar day that is in recurringDays.
 * 3. Set the time to the given HH:MM.
 * 4. If today is a match but the time has already passed, advance to the next occurrence.
 *
 * Returns null if recurringDays is empty or timeString is invalid.
 * This is defensive — callers should validate inputs before calling.
 */
export function getNextOccurrence(
  recurringDays: WeekdayIndex[],
  timeString: string
): Date | null {
  if (!recurringDays.length || !isValidTimeString(timeString)) return null;

  const [hh, mm] = timeString.split(':').map(Number);
  const sortedDays = [...new Set(recurringDays)].sort((a, b) => a - b) as WeekdayIndex[];

  // Search up to 14 days ahead to guarantee finding an occurrence.
  const base = new Date();
  base.setSeconds(0, 0);

  for (let daysAhead = 0; daysAhead <= 14; daysAhead++) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + daysAhead);
    candidate.setHours(hh, mm, 0, 0);

    const weekday = candidate.getDay() as WeekdayIndex;
    if (!sortedDays.includes(weekday)) continue;

    // Must be at least 5 minutes in the future.
    if (candidate.getTime() > Date.now() + 5 * 60 * 1000) {
      return candidate;
    }
  }

  return null;
}

// ─── Human-readable summary ───────────────────────────────────────────────────

/**
 * Formats a human-readable recurring trip schedule summary.
 * Examples:
 *   en: "Mon · Wed · Fri · 07:30 AM"
 *   ar: "اثنين · أربعاء · جمعة · 07:30 ص"
 *   he: "שני · רביעי · שישי · 07:30"
 *
 * Defensive: returns empty string if inputs are invalid.
 */
export function formatRecurringSummary(
  recurringDays: WeekdayIndex[] | undefined | null,
  departureTime: string | undefined | null,
  lang?: string
): string {
  const activeLang = normalizeLang(lang);
  const days = sanitizeWeekdays(recurringDays ?? []);
  if (days.length === 0) return '';
  if (!departureTime || !isValidTimeString(departureTime)) return '';

  const dayNames = WEEKDAY_NAMES[activeLang].short;
  const dayLabels = days.map((d) => dayNames[d]).join(' · ');
  const timeLabel = formatDisplayTime(departureTime, activeLang);
  return `${dayLabels} · ${timeLabel}`;
}

/**
 * Formats just the weekday label portion (no time).
 * E.g. "Mon · Wed · Fri"
 */
export function formatRecurringDaysLabel(
  recurringDays: WeekdayIndex[] | undefined | null,
  lang?: string
): string {
  const activeLang = normalizeLang(lang);
  const days = sanitizeWeekdays(recurringDays ?? []);
  if (days.length === 0) return '';
  const dayNames = WEEKDAY_NAMES[activeLang].short;
  return days.map((d) => dayNames[d]).join(' · ');
}

/** Formats HH:MM 24h string as display time (12h for en with AM/PM, 24h for ar/he). */
function formatDisplayTime(timeString: string, lang: Lang): string {
  if (!isValidTimeString(timeString)) return timeString;
  const [hh, mm] = timeString.split(':').map(Number);
  if (lang === 'en') {
    const period = hh < 12 ? 'AM' : 'PM';
    const hour12 = hh % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${period}`;
  }
  if (lang === 'ar') {
    const period = hh < 12 ? 'ص' : 'م';
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${period}`;
  }
  // Hebrew: 24h is conventional
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Returns a compact recurring badge label suitable for trip cards.
 * E.g. "↻ Mon · Wed · Fri"
 * Returns null if inputs are invalid (defensive fallback).
 */
export function formatRecurringBadge(
  recurringDays: WeekdayIndex[] | undefined | null,
  lang?: string
): string | null {
  const label = formatRecurringDaysLabel(recurringDays, lang);
  if (!label) return null;
  return `↻ ${label}`;
}
