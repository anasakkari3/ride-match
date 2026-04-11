import Link from 'next/link';
import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth/session';
import { getMyCommunities } from '@/lib/services/community';
import { getUserProfile } from '@/lib/services/user';
import {
  getMyTripsAsDriver,
  getMyBookings,
  getUpcomingTripsForCommunities,
} from '@/lib/services/trip';
import CommunityBadge from '@/components/CommunityBadge';
import EmptyStateCard from '@/components/EmptyStateCard';
import PwaInstallPrompt from '../PwaInstallPrompt';
import InlineSearch from '../InlineSearch';
import SearchResults from './SearchResults';
import SearchSkeleton from './SearchSkeleton';
import DiscoveryFeed from './DiscoveryFeed';
import CommunitySwitcher from './CommunitySwitcher';
import { inferUserContext } from '@/lib/utils/context';
import { getTripStatusPresentationWithTranslation } from '@/lib/trips/presentation';
import { formatLocalizedDate } from '@/lib/i18n/locale';
import { getServerI18n } from '@/lib/i18n/server';
import { normalizeDriverGenderFilter } from '@/lib/trips/comfort';

function buildAppHref(input?: {
  communityId?: string | null;
  originName?: string;
  destinationName?: string;
  driverGender?: string | null;
}) {
  const params = new URLSearchParams();
  if (input?.communityId) params.set('community_id', input.communityId);
  if (input?.originName) params.set('originName', input.originName);
  if (input?.destinationName) params.set('destinationName', input.destinationName);
  if (input?.driverGender && input.driverGender !== 'any') params.set('driverGender', input.driverGender);
  const query = params.toString();
  return query ? `/app?${query}` : '/app';
}

function buildNewTripHref(input?: {
  communityId?: string | null;
  originName?: string;
  destinationName?: string;
}) {
  const params = new URLSearchParams();
  if (input?.communityId) params.set('community_id', input.communityId);
  if (input?.originName) params.set('originName', input.originName);
  if (input?.destinationName) params.set('destinationName', input.destinationName);
  const query = params.toString();
  return query ? `/trips/new?${query}` : '/trips/new';
}

const COPY = {
  en: {
    allJoinedCommunities: (count: number) => `All joined communities (${count})`,
    searchScoped: (name: string) => `Searching inside ${name}.`,
    searchChooseCommunity: 'Pick one community first. Search stays inside a single community.',
    multiCommunityFeed: 'Your feed shows rides from every community you joined.',
    selectedCommunityReady: 'Ready for your next trip? Find a seat or share your journey.',
    scopeTitle: 'Community scope',
    scopeSelected: 'Search and new trip actions stay inside the selected community.',
    scopeMixed: 'Your feed is mixed right now. Pick one community to search or offer a ride there.',
    scopeSingle: 'You only have one community, so actions stay scoped automatically.',
    allJoined: 'All joined',
    findRide: 'Find a ride',
    chooseCommunityToSearch: 'Choose a community to search',
    chooseCommunityToSearchDesc: 'Search results stay inside one community. Pick the community above, then run the route search there.',
    offerRideSection: 'Offer a ride',
    postInCommunity: (name: string) => `This trip will be posted in ${name}.`,
    chooseCommunityFirst: 'Choose a community first so the trip stays scoped correctly.',
    offerRidePrompt: 'Offer your empty seats and help your community.',
    activityLink: 'View all trips',
    bookedRole: 'Passenger',
    drivingRole: 'Driver',
    routePreview: 'Route',
    departurePreview: 'Departure time',
    seatsPricePreview: 'Seats and price',
    completedDrivesJoined: 'completed rides joined',
  },
  ar: {
    allJoinedCommunities: (count: number) => `كل المجتمعات المنضم إليها (${count})`,
    searchScoped: (name: string) => `يجري البحث داخل ${name}.`,
    searchChooseCommunity: 'اختر مجتمعًا أولًا. البحث يبقى داخل مجتمع واحد فقط.',
    multiCommunityFeed: 'الخلاصة تعرض رحلات من كل المجتمعات التي انضممت إليها.',
    selectedCommunityReady: 'مستعد لرحلتك القادمة؟ ابحث عن مقعد أو شارك رحلتك.',
    scopeTitle: 'نطاق المجتمع',
    scopeSelected: 'البحث وإنشاء الرحلات الجديدة يبقيان داخل المجتمع المحدد.',
    scopeMixed: 'الخلاصة الآن مختلطة. اختر مجتمعًا واحدًا للبحث أو لعرض رحلة بداخله.',
    scopeSingle: 'لديك مجتمع واحد فقط، لذلك يبقى كل شيء ضمن النطاق الصحيح تلقائيًا.',
    allJoined: 'الكل',
    findRide: 'ابحث عن رحلة',
    chooseCommunityToSearch: 'اختر مجتمعًا للبحث',
    chooseCommunityToSearchDesc: 'نتائج البحث تبقى داخل مجتمع واحد. اختر المجتمع من الأعلى ثم نفّذ البحث هناك.',
    offerRideSection: 'اعرض رحلة',
    postInCommunity: (name: string) => `سيتم نشر هذه الرحلة داخل ${name}.`,
    chooseCommunityFirst: 'اختر مجتمعًا أولًا حتى تبقى الرحلة ضمن النطاق الصحيح.',
    offerRidePrompt: 'اعرض المقاعد الفارغة لديك وساعد مجتمعك.',
    activityLink: 'عرض كل الرحلات',
    bookedRole: 'راكب',
    drivingRole: 'سائق',
    routePreview: 'المسار',
    departurePreview: 'وقت الانطلاق',
    seatsPricePreview: 'المقاعد والسعر',
    completedDrivesJoined: 'رحلات مكتملة انضممت إليها',
  },
  he: {
    allJoinedCommunities: (count: number) => `כל הקהילות שהצטרפתם אליהן (${count})`,
    searchScoped: (name: string) => `מחפשים בתוך ${name}.`,
    searchChooseCommunity: 'בחרו קודם קהילה. החיפוש נשאר בתוך קהילה אחת בלבד.',
    multiCommunityFeed: 'הפיד מציג נסיעות מכל הקהילות שאליהן הצטרפתם.',
    selectedCommunityReady: 'מוכנים לנסיעה הבאה? מצאו מקום או שתפו את הנסיעה שלכם.',
    scopeTitle: 'טווח קהילה',
    scopeSelected: 'החיפוש ויצירת נסיעה חדשה נשארים בתוך הקהילה שנבחרה.',
    scopeMixed: 'כרגע הפיד מעורב. בחרו קהילה אחת כדי לחפש או להציע נסיעה בתוכה.',
    scopeSingle: 'יש לכם רק קהילה אחת, לכן הפעולות נשארות בתחום הנכון באופן אוטומטי.',
    allJoined: 'הכול',
    findRide: 'מצאו נסיעה',
    chooseCommunityToSearch: 'בחרו קהילה לחיפוש',
    chooseCommunityToSearchDesc: 'תוצאות החיפוש נשארות בתוך קהילה אחת. בחרו את הקהילה למעלה ואז חפשו בתוכה.',
    offerRideSection: 'הציעו נסיעה',
    postInCommunity: (name: string) => `הנסיעה הזו תפורסם בתוך ${name}.`,
    chooseCommunityFirst: 'בחרו קודם קהילה כדי שהנסיעה תישאר בתחום הנכון.',
    offerRidePrompt: 'הציעו את המושבים הפנויים שלכם ועזרו לקהילה.',
    activityLink: 'לכל הנסיעות',
    bookedRole: 'נוסע',
    drivingRole: 'נהג',
    routePreview: 'מסלול',
    departurePreview: 'שעת יציאה',
    seatsPricePreview: 'מושבים ומחיר',
    completedDrivesJoined: 'נסיעות שהצטרפתם אליהן והושלמו',
  },
} as const;

export default async function HomePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const { lang, t, tWide } = await getServerI18n();
  const copy = COPY[lang];

  const user = await getCurrentUser();
  const profile = user ? await getUserProfile(user.id) : null;
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] || null;

  const memberships = await getMyCommunities();
  const joinedCommunities = memberships.map((membership) => ({
    ...membership.community,
    role: membership.role === 'admin' ? 'admin' : 'member',
  }));

  const requestedCommunityId =
    typeof searchParams.community_id === 'string' ? searchParams.community_id : null;
  const selectedCommunity =
    joinedCommunities.find((community) => community.id === requestedCommunityId) ??
    (joinedCommunities.length === 1 ? joinedCommunities[0] : null);

  const hasMultipleCommunities = joinedCommunities.length > 1;
  const feedCommunityIds = selectedCommunity
    ? [selectedCommunity.id]
    : joinedCommunities.map((community) => community.id);

  const isSearchActive = !!searchParams.originName || !!searchParams.destinationName;
  const originQuery = typeof searchParams.originName === 'string' ? searchParams.originName : '';
  const destQuery = typeof searchParams.destinationName === 'string' ? searchParams.destinationName : '';
  const driverGenderQuery = normalizeDriverGenderFilter(
    typeof searchParams.driverGender === 'string' ? searchParams.driverGender : null
  );

  let myTrips: Awaited<ReturnType<typeof getMyTripsAsDriver>> = [];
  let myBookings: Awaited<ReturnType<typeof getMyBookings>> = [];
  let feedTrips: Awaited<ReturnType<typeof getUpcomingTripsForCommunities>> = [];

  if (user) {
    try {
      [myTrips, myBookings] = await Promise.all([getMyTripsAsDriver(), getMyBookings()]);
      if (feedCommunityIds.length > 0) {
        feedTrips = await getUpcomingTripsForCommunities(feedCommunityIds, 8);
        feedTrips = feedTrips.filter((trip) => trip.driver_id !== user.id);
      }
    } catch {
      // non-critical
    }
  }

  const inferredHub =
    feedTrips.length > 0 && user ? inferUserContext(profile, myTrips, myBookings, feedTrips) : null;

  const routePairsMap = new Map<string, { origin: string; dest: string; count: number }>();
  feedTrips.forEach((trip) => {
    const key = `${trip.origin_name}:${trip.destination_name}`;
    if (!routePairsMap.has(key)) {
      routePairsMap.set(key, { origin: trip.origin_name, dest: trip.destination_name, count: 0 });
    }
    routePairsMap.get(key)!.count++;
  });
  const topRoutePairs = Array.from(routePairsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const hasActivity = myBookings.length > 0 || myTrips.length > 0;
  const clearSearchHref = buildAppHref({ communityId: selectedCommunity?.id ?? null });
  const createTripHref = buildNewTripHref({ communityId: selectedCommunity?.id ?? null });
  const heroScopeLabel = selectedCommunity
    ? selectedCommunity.name
    : hasMultipleCommunities
      ? copy.allJoinedCommunities(joinedCommunities.length)
      : joinedCommunities[0]?.name ?? t('welcome_to_ride_match');
  const communitySwitcherItems = joinedCommunities.map((community) => ({
    ...community,
    href: buildAppHref({
      communityId: community.id,
      originName: isSearchActive ? originQuery : undefined,
      destinationName: isSearchActive ? destQuery : undefined,
      driverGender: isSearchActive ? driverGenderQuery : undefined,
    }),
  }));
  const communitySwitcherDescription = selectedCommunity
    ? copy.scopeSelected
    : hasMultipleCommunities
      ? copy.scopeMixed
      : copy.scopeSingle;
  const heroTitle = isSearchActive
    ? t('finding_ride')
    : firstName
      ? `${t('good_morning')}, ${firstName}.`
      : t('welcome_to_ride_match');

  return (
    <div className="pb-8 space-y-6">
      <PwaInstallPrompt />

      <div className="relative bg-gradient-to-br from-sky-600 via-sky-600 to-cyan-700 dark:from-sky-800 dark:via-slate-900 dark:to-slate-950 pt-8 pb-16 px-4 -mt-16 w-full max-w-lg mx-auto overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white opacity-[0.06] rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-cyan-300 opacity-[0.08] rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 pt-16 animate-fade-in-up">
          <p className="text-sky-200/80 text-xs font-semibold uppercase tracking-widest mb-2" dir="auto">
            {heroScopeLabel}
          </p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            {heroTitle}
          </h1>
          <p className="text-sky-100/80 text-sm mt-2 max-w-[320px] leading-relaxed">
            {isSearchActive
              ? selectedCommunity
                ? copy.searchScoped(selectedCommunity.name)
                : copy.searchChooseCommunity
              : selectedCommunity
                ? copy.selectedCommunityReady
                : hasMultipleCommunities
                  ? copy.multiCommunityFeed
                  : t('welcome_to_ride_match')}
          </p>
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-6 -mt-10 relative z-20">
        {joinedCommunities.length > 0 && (
          <section className="animate-fade-in-up stagger-1">
            <CommunitySwitcher
              communities={communitySwitcherItems}
              selectedCommunityId={selectedCommunity?.id ?? null}
              showAllOption={hasMultipleCommunities}
              allHref={buildAppHref()}
              title={copy.scopeTitle}
              description={communitySwitcherDescription}
              allLabel={copy.allJoined}
            />
          </section>
        )}

        <section className="animate-fade-in-up stagger-2 space-y-3">
          {!isSearchActive && (
            <div className="px-1">
              <span className="inline-flex items-center rounded-full bg-white/95 dark:bg-slate-900 px-3 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-sm border border-slate-200 dark:border-slate-800">
                {copy.findRide}
              </span>
            </div>
          )}

          <InlineSearch
            communityId={selectedCommunity?.id}
            initialOrigin={originQuery}
            initialDestination={destQuery}
            initialDriverGenderFilter={driverGenderQuery}
            clearHref={clearSearchHref}
            communitySelectionRequired={hasMultipleCommunities}
          />

          {!isSearchActive && topRoutePairs.length > 0 && selectedCommunity && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide text-sm">
              {topRoutePairs.map((route) => (
                <Link
                  key={`${route.origin}-${route.dest}`}
                  href={buildAppHref({
                    communityId: selectedCommunity.id,
                    originName: route.origin,
                    destinationName: route.dest,
                    driverGender: driverGenderQuery,
                  })}
                  className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 font-medium hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <span dir="auto">{route.origin}</span>
                  <span className="text-slate-400 opacity-60 px-0.5">→</span>
                  <span dir="auto">{route.dest}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {isSearchActive && selectedCommunity && (
          <Suspense fallback={<SearchSkeleton />}>
            <SearchResults
              communityId={selectedCommunity.id}
              originQuery={originQuery}
              destQuery={destQuery}
              driverGenderFilter={driverGenderQuery}
              lang={lang}
              t={tWide}
            />
          </Suspense>
        )}

        {isSearchActive && !selectedCommunity && hasMultipleCommunities && (
          <EmptyStateCard
            tone="amber"
            eyebrow={copy.scopeTitle}
            title={copy.chooseCommunityToSearch}
            description={copy.chooseCommunityToSearchDesc}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
          />
        )}

        {!isSearchActive && (
          <>
            <section className="animate-fade-in-up stagger-3">
              <div className="flex items-center gap-2 px-1 mb-3">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {copy.offerRideSection}
                </span>
                <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>

              <Link
                href={createTripHref}
                className="block rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 p-5 shadow-lg card-hover relative overflow-hidden group ring-1 ring-white/5"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity ltr:translate-x-1/3 ltr:-translate-y-1/3 rtl:-translate-x-1/3 rtl:-translate-y-1/3" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500 opacity-20 rounded-full blur-2xl ltr:-translate-x-1/3 ltr:translate-y-1/3 rtl:translate-x-1/3 rtl:translate-y-1/3" />

                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-sky-300 dark:text-sky-400 uppercase tracking-widest mb-1">
                      {t('offer_ride')}
                    </p>
                    <h3 className="text-lg font-bold text-white mb-0.5">
                      {t('create_new_trip')}
                    </h3>
                    <p className="text-sm text-slate-400 dark:text-slate-300 max-w-[220px]">
                      {selectedCommunity
                        ? copy.postInCommunity(selectedCommunity.name)
                        : hasMultipleCommunities
                          ? copy.chooseCommunityFirst
                          : copy.offerRidePrompt}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform rtl:-scale-x-100 rtl:group-hover:-scale-x-110">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                  </div>
                </div>
              </Link>
            </section>

            {hasActivity && (
              <section className="animate-fade-in-up stagger-4 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {t('your_activity')}
                  </span>
                  <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <Link href="/trips/my-rides" className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline">
                    {copy.activityLink}
                  </Link>
                </div>

                {myBookings.length > 0 && (
                  <div className="space-y-2">
                    {myBookings.slice(0, 2).map((trip) => {
                      const statusUi = getTripStatusPresentationWithTranslation(trip, (key) => t(key));
                      return (
                        <Link key={trip.id} href={`/trips/${trip.id}`} className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm card-hover">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shrink-0 ${statusUi.accentClassName}`}>T</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 justify-between">
                                <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-0.5">{copy.bookedRole}</p>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusUi.chipClassName}`}>
                                  {statusUi.label}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate" dir="auto">{trip.origin_name} → {trip.destination_name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <CommunityBadge name={trip.community_name} type={trip.community_type} compact />
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  {formatLocalizedDate(lang, trip.departure_time, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {myTrips.length > 0 && (
                  <div className="space-y-2">
                    {myTrips.slice(0, 2).map((trip) => {
                      const statusUi = getTripStatusPresentationWithTranslation(trip, (key) => t(key));
                      return (
                        <Link key={trip.id} href={`/trips/${trip.id}`} className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm card-hover">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shrink-0 ${statusUi.accentClassName}`}>C</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 justify-between">
                                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">{copy.drivingRole}</p>
                                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusUi.chipClassName}`}>
                                  {statusUi.label}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate" dir="auto">{trip.origin_name} → {trip.destination_name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <CommunityBadge name={trip.community_name} type={trip.community_type} compact />
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  {formatLocalizedDate(lang, trip.departure_time, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {feedCommunityIds.length > 0 && (
              <section className="animate-fade-in-up stagger-5 space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {t('available_rides')}
                  </span>
                  <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>
                <DiscoveryFeed
                  trips={feedTrips}
                  inferredHub={inferredHub}
                  lang={lang}
                  t={tWide}
                  createHref={createTripHref}
                  browseHref={clearSearchHref}
                />
              </section>
            )}
          </>
        )}

        {joinedCommunities.length === 0 && (
          <EmptyStateCard
            tone="amber"
            eyebrow={copy.scopeTitle}
            title={t('no_community')}
            description={t('no_community_desc')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M19 8v6" />
                <path d="M22 11h-6" />
              </svg>
            }
            actions={
              <Link
                href="/community"
                className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500"
              >
                {t('join_community')}
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
