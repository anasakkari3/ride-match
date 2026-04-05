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
      <div className="space-y-4 animate-fade-in-up mt-2">
        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-6 text-center shadow-sm">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-xl mx-auto mb-3">
            R
          </div>
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-1">
            {copy.noTripsFound}
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed max-w-[260px] mx-auto mb-4">
            {copy.noTripsDesc}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={browseHref}
              className="text-sm font-bold text-slate-700 dark:text-slate-200 hover:underline"
            >
              {copy.browseAll}
            </Link>
            <Link
              href={createHref}
              className="inline-block rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white px-5 py-2.5 text-sm font-bold transition-colors btn-press shadow-sm"
            >
              {copy.createInstead}
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
            {copy.noExactTrip}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {copy.showingSimilar(recommendations.length)}
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
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

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3">
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
