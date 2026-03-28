import Link from 'next/link';
import { searchTrips } from '@/lib/services/matching';
import { TripCard } from './TripCard';

type DiscoveryFeedProps = {
  communityId: string;
  inferredHub: string | null;
  lang: string;
  t: (key: string) => string;
};

export default async function DiscoveryFeed({
  communityId,
  inferredHub,
  lang,
  t,
}: DiscoveryFeedProps) {
  const result = await searchTrips({
    communityId,
    originName: inferredHub || '',
    destinationName: '',
  });

  const allMatches = [...result.exactMatches, ...result.recommendations];

  if (allMatches.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 text-center shadow-sm">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-xl mx-auto mb-3 shadow-sm">
          +
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
          No trips available yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto mb-4">
          Your community has no scheduled trips right now. Be the first to offer a ride or come back later to browse.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/trips/new"
            className="inline-block rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 text-white px-5 py-2.5 text-sm font-bold transition-colors btn-press shadow-sm"
          >
            {t('offer_ride') || 'Offer a Ride'}
          </Link>
          <Link href="/app" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline">
            Refresh later
          </Link>
        </div>
      </div>
    );
  }

  const hubMatched = inferredHub ? allMatches.filter((trip) => trip.score > 0).slice(0, 5) : [];
  const allUpcoming = inferredHub
    ? allMatches.filter((trip) => trip.score === 0).slice(0, 5)
    : allMatches.slice(0, 6);

  return (
    <div className="space-y-5 animate-fade-in-up mt-2">
      {hubMatched.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Rides from {inferredHub}
            </span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {hubMatched.length} trip{hubMatched.length !== 1 ? 's' : ''}
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
              Upcoming rides
            </span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{allUpcoming.length}</span>
          </div>
          <div className="space-y-3">
            {allUpcoming.map((trip) => (
              <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Need a different route?
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          <Link href="/trips/new" className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
            Offer a ride
          </Link>
          <Link href="/app" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline">
            Search again
          </Link>
        </div>
      </div>
    </div>
  );
}
