import Link from 'next/link';
import { searchTrips } from '@/lib/services/matching';
import EmptyStateCard from '@/components/EmptyStateCard';
import { TripCard } from './TripCard';

type SearchResultsProps = {
  communityId: string;
  originQuery: string;
  destQuery: string;
  lang: string;
  t: (key: string) => string;
};

const COPY = {
  en: {
    noTripsFound: 'No trips found for this route',
    noTripsDesc: 'Nobody is driving this route yet. You can go back to browse other rides, or create this trip yourself.',
    browseAll: 'Browse all rides',
    createExactRoute: 'Create your exact route',
    createInstead: 'Create this trip instead',
    noExactTrip: 'No exact trip for your route',
    showingSimilar: (count: number) => `Showing ${count} ${count === 1 ? 'trip' : 'trips'} with a similar origin or destination.`,
    similarRoutes: 'Similar routes',
    routeTrips: 'Trips on this route',
    routeCount: (count: number) => `${count} ${count === 1 ? 'trip' : 'trips'}`,
    exactRouteInstead: 'Create a trip for your exact route instead',
    wrongTime: 'Do not see the right time?',
    backToBrowse: 'Back to browse',
  },
  ar: {
    noTripsFound: 'لم نعثر على رحلات لهذا المسار',
    noTripsDesc: 'لا أحد يقود هذا المسار الآن. يمكنك العودة لتصفح رحلات أخرى أو إنشاء هذه الرحلة بنفسك.',
    browseAll: 'تصفح كل الرحلات',
    createExactRoute: 'أنشئ مسارك الدقيق',
    createInstead: 'أنشئ هذه الرحلة بدلًا من ذلك',
    noExactTrip: 'لا توجد رحلة مطابقة تمامًا لمسارك',
    showingSimilar: (count: number) => `نعرض ${count} ${count === 1 ? 'رحلة' : 'رحلات'} لها نقطة انطلاق أو وجهة مشابهة.`,
    similarRoutes: 'مسارات مشابهة',
    routeTrips: 'رحلات على هذا المسار',
    routeCount: (count: number) => `${count} ${count === 1 ? 'رحلة' : 'رحلات'}`,
    exactRouteInstead: 'أنشئ رحلة لمسارك الدقيق بدلًا من ذلك',
    wrongTime: 'لم تجد التوقيت المناسب؟',
    backToBrowse: 'العودة إلى التصفح',
  },
  he: {
    noTripsFound: 'לא נמצאו נסיעות למסלול הזה',
    noTripsDesc: 'עדיין אף אחד לא נוסע במסלול הזה. אפשר לחזור לעיין בנסיעות אחרות או ליצור את הנסיעה בעצמכם.',
    browseAll: 'עיינו בכל הנסיעות',
    createExactRoute: 'צרו את המסלול המדויק',
    createInstead: 'צרו את הנסיעה הזו במקום',
    noExactTrip: 'אין נסיעה מדויקת למסלול שלכם',
    showingSimilar: (count: number) => `מציגים ${count} ${count === 1 ? 'נסיעה' : 'נסיעות'} עם מוצא או יעד דומים.`,
    similarRoutes: 'מסלולים דומים',
    routeTrips: 'נסיעות במסלול הזה',
    routeCount: (count: number) => `${count} ${count === 1 ? 'נסיעה' : 'נסיעות'}`,
    exactRouteInstead: 'צרו נסיעה למסלול המדויק שלכם במקום',
    wrongTime: 'לא רואים את השעה הנכונה?',
    backToBrowse: 'חזרה לעיון',
  },
} as const;

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
  const copy = COPY[lang === 'ar' || lang === 'he' ? lang : 'en'];

  const exactMatches = result.exactMatches;
  const recommendations = result.recommendations;
  const totalResults = exactMatches.length + recommendations.length;
  const encodedOrigin = encodeURIComponent(originQuery);
  const encodedDestination = encodeURIComponent(destQuery);
  const createHref = `/trips/new?community_id=${encodeURIComponent(communityId)}&originName=${encodedOrigin}&destinationName=${encodedDestination}`;
  const browseHref = `/app?community_id=${encodeURIComponent(communityId)}`;

  if (totalResults === 0) {
    return (
      <EmptyStateCard
        eyebrow={copy.routeTrips}
        title={copy.noTripsFound}
        description={copy.noTripsDesc}
        tone="amber"
        className="mt-2 animate-fade-in-up"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
            <path d="M8.5 8.5 15 15" />
            <path d="M9 17.5h4" />
          </svg>
        }
        actions={
          <>
            <Link
              href={browseHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {copy.browseAll}
            </Link>
            <Link
              href={createHref}
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
            >
              {copy.createInstead}
            </Link>
          </>
        }
      />
    );
  }

  if (exactMatches.length === 0 && recommendations.length > 0) {
    return (
      <div className="space-y-5 animate-fade-in-up mt-2">
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {copy.noExactTrip}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {copy.showingSimilar(recommendations.length)}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={browseHref} className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
              {copy.browseAll}
            </Link>
            <Link href={createHref} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline">
              {copy.createExactRoute}
            </Link>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {copy.similarRoutes}
            </span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {copy.routeCount(recommendations.length)}
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
          <span>{copy.exactRouteInstead}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up mt-2">
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {copy.routeTrips}
          </span>
          <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {copy.routeCount(exactMatches.length)}
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
              {copy.similarRoutes}
            </span>
            <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[11px] text-slate-400 dark:text-slate-500">{copy.routeCount(recommendations.length)}</span>
          </div>
          <div className="space-y-3">
            {recommendations.map((trip) => (
              <TripCard key={trip.id} trip={trip} t={t} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {copy.wrongTime}
        </p>
        <div className="flex flex-wrap gap-3 mt-2">
          <Link href={createHref} className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
            {copy.createInstead}
          </Link>
          <Link href={browseHref} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline">
            {copy.backToBrowse}
          </Link>
        </div>
      </div>
    </div>
  );
}
