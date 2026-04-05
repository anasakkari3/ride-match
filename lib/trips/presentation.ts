import type { TripStatus, TripsRow } from '@/lib/types';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';

type TripPresentationTarget = Pick<TripsRow, 'status' | 'seats_available'>;
type TranslateFn = (key: 'scheduled' | 'full' | 'in_progress' | 'completed' | 'cancelled' | 'draft') => string;

type TripStatusPresentation = {
  label: string;
  chipClassName: string;
  accentClassName: string;
};

export function getTripStatusPresentation(trip: TripPresentationTarget): TripStatusPresentation {
  const t = ((key: 'scheduled' | 'full' | 'in_progress' | 'completed' | 'cancelled' | 'draft') =>
    ({
      scheduled: 'Scheduled',
      full: 'Full',
      in_progress: 'In progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      draft: 'Draft',
    })[key]) as TranslateFn;

  return getTripStatusPresentationWithTranslation(trip, t);
}

export function getTripStatusPresentationWithTranslation(
  trip: TripPresentationTarget,
  t: TranslateFn
): TripStatusPresentation {
  const status = getEffectiveTripStatus(trip) as TripStatus;

  switch (status) {
    case 'full':
      return {
        label: t('full'),
        chipClassName:
          'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
        accentClassName: 'bg-amber-500/10 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300',
      };
    case 'in_progress':
      return {
        label: t('in_progress'),
        chipClassName:
          'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
        accentClassName: 'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300',
      };
    case 'completed':
      return {
        label: t('completed'),
        chipClassName:
          'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
        accentClassName: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300',
      };
    case 'cancelled':
      return {
        label: t('cancelled'),
        chipClassName:
          'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
        accentClassName: 'bg-rose-500/10 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300',
      };
    case 'draft':
      return {
        label: t('draft'),
        chipClassName:
          'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
        accentClassName: 'bg-slate-500/10 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      };
    case 'scheduled':
    default:
      return {
        label: t('scheduled'),
        chipClassName:
          'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800',
        accentClassName: 'bg-sky-500/10 text-sky-600 dark:bg-sky-900/20 dark:text-sky-300',
      };
  }
}
