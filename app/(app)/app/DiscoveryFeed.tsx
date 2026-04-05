import Link from 'next/link';
import { normalizeLocationName } from '@/lib/utils/locations';
import EmptyStateCard from '@/components/EmptyStateCard';
import type { TripWithDriver } from '@/lib/types';
import { TripCard } from './TripCard';

type DiscoveryFeedProps = {
  trips: TripWithDriver[];
  inferredHub: string | null;
  lang: string;
  t: (key: string) => string;
  createHref: string;
  browseHref: string;
};

const COPY = {
  en: {
    noTripsTitle: 'No trips available yet',
    noTripsDesc: 'There are no scheduled trips in your current feed. Offer a ride or check back later.',
    refreshLater: 'Refresh later',
    ridesFrom: (hub: string) => `Rides from ${hub}`,
    upcomingRides: 'Upcoming rides',
    needDifferentRoute: 'Need a different route?',
    searchAgain: 'Search again',
    tripCount: (count: number) => `${count} ${count === 1 ? 'trip' : 'trips'}`,
  },
  ar: {
    noTripsTitle: 'لا توجد رحلات متاحة بعد',
    noTripsDesc: 'لا توجد رحلات مجدولة في هذه الخلاصة الآن. اعرض رحلة أو عد لاحقًا.',
    refreshLater: 'جرّب لاحقًا',
    ridesFrom: (hub: string) => `رحلات من ${hub}`,
    upcomingRides: 'الرحلات القادمة',
    needDifferentRoute: 'تحتاج مسارًا مختلفًا؟',
    searchAgain: 'ابحث من جديد',
    tripCount: (count: number) => `${count} ${count === 1 ? 'رحلة' : 'رحلات'}`,
  },
  he: {
    noTripsTitle: 'עדיין אין נסיעות זמינות',
    noTripsDesc: 'כרגע אין נסיעות מתוזמנות בפיד הזה. אפשר להציע נסיעה או לחזור מאוחר יותר.',
    refreshLater: 'נסו שוב מאוחר יותר',
    ridesFrom: (hub: string) => `נסיעות מ־${hub}`,
    upcomingRides: 'נסיעות קרובות',
    needDifferentRoute: 'צריכים מסלול אחר?',
    searchAgain: 'חפשו שוב',
    tripCount: (count: number) => `${count} ${count === 1 ? 'נסיעה' : 'נסיעות'}`,
  },
} as const;

export default function DiscoveryFeed({
  trips,
  inferredHub,
  lang,
  t,
  createHref,
  browseHref,
}: DiscoveryFeedProps) {
  const activeLang = lang === 'ar' || lang === 'he' ? lang : 'en';
  const copy = COPY[activeLang];

  if (trips.length === 0) {
    return (
      <EmptyStateCard
        eyebrow={copy.upcomingRides}
        title={copy.noTripsTitle}
        description={copy.noTripsDesc}
        className="animate-fade-in-up"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 16H9m10 0h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 9.6 16 9 16 9s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 11v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="16" r="2" />
            <circle cx="17" cy="16" r="2" />
          </svg>
        }
        actions={
          <>
            <Link
              href={createHref}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              {t('offer_ride')}
            </Link>
            <Link
              href={browseHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {copy.refreshLater}
            </Link>
          </>
        }
      />
    );
  }

  const normalizedHub = inferredHub ? normalizeLocationName(inferredHub) : '';
  const hubMatched = normalizedHub
    ? trips.filter((trip) => normalizeLocationName(trip.origin_name).includes(normalizedHub)).slice(0, 5)
    : [];
  const hubMatchedIds = new Set(hubMatched.map((trip) => trip.id));
  const allUpcoming = trips.filter((trip) => !hubMatchedIds.has(trip.id)).slice(0, hubMatched.length > 0 ? 5 : 6);

  return (
    <div className="space-y-5 animate-fade-in-up mt-2">
      {hubMatched.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {copy.ridesFrom(inferredHub ?? '')}
            </span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {copy.tripCount(hubMatched.length)}
            </span>
          </div>
          <div className="space-y-3">
            {hubMatched.map((trip) => (
              <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}

      {allUpcoming.length > 0 && (
        <section
          className={`space-y-3 ${hubMatched.length > 0 ? 'pt-2 border-t border-slate-100 dark:border-slate-800' : ''}`}
        >
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {copy.upcomingRides}
            </span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{copy.tripCount(allUpcoming.length)}</span>
          </div>
          <div className="space-y-3">
            {allUpcoming.map((trip) => (
              <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {copy.needDifferentRoute}
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          <Link href={createHref} className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
            {t('offer_ride')}
          </Link>
          <Link href={browseHref} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline">
            {copy.searchAgain}
          </Link>
        </div>
      </div>
    </div>
  );
}
