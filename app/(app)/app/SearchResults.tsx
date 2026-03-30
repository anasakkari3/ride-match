import Link from 'next/link';
import { searchTrips } from '@/lib/services/matching';
import { TripCard } from './TripCard';

type SearchResultsProps = {
  communityId: string;
  originQuery: string;
  destQuery: string;
  lang: string;
  t: (key: string) => string;
};

export default async function SearchResults({
  communityId,
  originQuery,
  destQuery,
  lang,
  t,
}: SearchResultsProps) {
  const result = await searchTrips({
    communityId,
    originName: originQuery,
    destinationName: destQuery,
  });

  const exactMatches = result.exactMatches;
  const recommendations = result.recommendations;
  const totalResults = exactMatches.length + recommendations.length;
  const encodedOrigin = encodeURIComponent(originQuery);
  const encodedDestination = encodeURIComponent(destQuery);
  const createHref = `/trips/new?originName=${encodedOrigin}&destinationName=${encodedDestination}`;

  if (totalResults === 0) {
    return (
      <div className="space-y-4 animate-fade-in-up mt-2">
        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
            R
          </div>
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">
            No trips found for this route
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed max-w-[260px] mx-auto mb-4">
            Nobody is driving this route yet. You can go back to browse other rides, or create this trip yourself.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:underline"
            >
              Browse all rides
            </Link>
            <Link
              href={createHref}
              className="inline-block rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white px-5 py-2.5 text-sm font-bold transition-colors btn-press shadow-sm"
            >
              Create this trip instead →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (exactMatches.length === 0 && recommendations.length > 0) {
    return (
      <div className="space-y-5 animate-fade-in-up mt-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No exact trip for your route
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Showing {recommendations.length} trip{recommendations.length !== 1 ? 's' : ''} with a similar origin or destination.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <Link href="/app" className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
              Browse all rides
            </Link>
            <Link href={createHref} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline">
              Create your exact route
            </Link>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Similar routes
            </span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {recommendations.length} trip{recommendations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {recommendations.map((trip) => (
              <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        </section>

        <Link
          href={createHref}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span>+</span>
          <span>Create a trip for your exact route instead</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up mt-2">
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Trips on this route
          </span>
          <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {exactMatches.length} trip{exactMatches.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="space-y-3">
          {exactMatches.map((trip) => (
            <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
          ))}
        </div>
      </section>

      {recommendations.length > 0 && (
        <section className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Similar routes
            </span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{recommendations.length}</span>
          </div>
          <div className="space-y-3">
            {recommendations.map((trip) => (
              <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Do not see the right time?
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          <Link href={createHref} className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
            Create this route instead
          </Link>
          <Link href="/app" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline">
            Back to browse
          </Link>
        </div>
      </div>
    </div>
  );
}
