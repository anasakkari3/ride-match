import Link from 'next/link';
import { cookies } from 'next/headers';
import { dictionaries, Lang, translate } from '@/lib/i18n/dictionaries';
import { getCurrentUser } from '@/lib/auth/session';
import { getMyCommunities, getFirstCommunity } from '@/lib/services/community';
import { getUserProfile } from '@/lib/services/user';
import { getMyTripsAsDriver, getMyBookings, getUpcomingCommunityTrips } from '@/lib/services/trip';
import PwaInstallPrompt from '../PwaInstallPrompt';
import InlineSearch from '../InlineSearch';
import SearchResults from './SearchResults';
import SearchSkeleton from './SearchSkeleton';
import DiscoveryFeed from './DiscoveryFeed';
import { inferUserContext } from '@/lib/utils/context';
import { Suspense } from 'react';
import { getTripStatusPresentation } from '@/lib/trips/presentation';

export default async function HomePage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const searchParams = await props.searchParams;
    const cookieStore = await cookies();
    const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
    const lang: Lang = langValue || 'en';
    const dict = dictionaries[lang] || dictionaries['en'];
    const t = (key: keyof typeof dictionaries['en']) => translate(dict, key);
    // Widened wrapper for child components that accept (key: string) => string
    const tWide = (key: string) => t(key as keyof typeof dictionaries['en']);

    const user = await getCurrentUser();
    const profile = user ? await getUserProfile(user.id) : null;
    const firstName = profile?.display_name?.split(' ')[0] ?? (lang === 'ar' ? 'أهلاً' : lang === 'he' ? 'שלום' : 'there');

    let community;
    let myTrips: Awaited<ReturnType<typeof getMyTripsAsDriver>> = [];
    let myBookings: Awaited<ReturnType<typeof getMyBookings>> = [];
    let upcomingTrips: Awaited<ReturnType<typeof getUpcomingCommunityTrips>> = [];

    // Search state
    const isSearchActive = !!searchParams.originName || !!searchParams.destinationName;
    const originQuery = typeof searchParams.originName === 'string' ? searchParams.originName : '';
    const destQuery = typeof searchParams.destinationName === 'string' ? searchParams.destinationName : '';

    try {
        const communities = await getMyCommunities();
        community = getFirstCommunity(communities);
    } catch {
        community = null;
    }

    if (user) {
        try {
            [myTrips, myBookings] = await Promise.all([
                getMyTripsAsDriver(),
                getMyBookings(),
            ]);
            if (community) {
                upcomingTrips = await getUpcomingCommunityTrips(community.id, 5);
                upcomingTrips = upcomingTrips.filter(t => t.driver_id !== user.id);
            }
        } catch {
            // non-critical
        }
    }

    // Determine Phantom Context for Discovery
    let inferredHub: string | null = null;
    if (community && user) {
        inferredHub = inferUserContext(profile, myTrips, myBookings, upcomingTrips);
    }

    // Derive dynamic Route Chips from upcoming trips
    const routePairsMap = new Map<string, { origin: string, dest: string, count: number }>();
    upcomingTrips.forEach(t => {
        const key = `${t.origin_name}:${t.destination_name}`;
        if (!routePairsMap.has(key)) {
            routePairsMap.set(key, { origin: t.origin_name, dest: t.destination_name, count: 0 });
        }
        routePairsMap.get(key)!.count++;
    });
    const topRoutePairs = Array.from(routePairsMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

    const hasActivity = myBookings.length > 0 || myTrips.length > 0;

    return (
        <div className="pb-8 space-y-6">
            <PwaInstallPrompt />

            {/* Hero */}
            <div className="relative bg-gradient-to-br from-sky-600 via-sky-600 to-cyan-700 pt-8 pb-16 px-4 -mt-16 w-full max-w-lg mx-auto overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300 opacity-10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10 pt-16 animate-fade-in-up">
                    <p className="text-sky-100 text-sm font-medium mb-1" dir="auto">
                        {community ? `🌍 ${community.name}` : t('welcome_to_ride_match')}
                    </p>
                    <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                        {isSearchActive ? t('finding_ride') : `${t('good_morning')}, ${firstName}.`}
                    </h1>
                    <p className="text-sky-100 text-sm mt-2 max-w-[280px] leading-relaxed">
                        {isSearchActive
                            ? t('searching_active')
                            : community
                                ? t('ready_for_ride')
                                : t('welcome_to_ride_match')}
                    </p>
                </div>
            </div>

            <div className="px-4 max-w-lg mx-auto space-y-6 -mt-10 relative z-20">

                {/* ── FIND A RIDE ────────────────────────────────── */}
                <section className="animate-fade-in-up stagger-1 space-y-3">
                    {/* Section intent label */}
                    {!isSearchActive && (
                        <div className="px-1">
                            <span className="inline-flex items-center rounded-full bg-white/95 dark:bg-slate-900 px-3 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-sm border border-slate-200 dark:border-slate-800">
                                Find a Ride
                            </span>
                        </div>
                    )}

                    <InlineSearch
                        communityId={community?.id}
                        initialOrigin={originQuery}
                        initialDestination={destQuery}
                    />

                    {/* Quick Route Chips */}
                    {!isSearchActive && topRoutePairs.length > 0 && (
                        <div
                            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide text-sm"
                            dir={lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr'}
                        >
                            {topRoutePairs.map(route => (
                                <Link
                                    key={`${route.origin}-${route.dest}`}
                                    href={`/app?community_id=${community?.id}&originName=${encodeURIComponent(route.origin)}&destinationName=${encodeURIComponent(route.dest)}`}
                                    className="shrink-0 flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-slate-700 dark:text-slate-300 font-medium hover:bg-sky-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    <span>{route.origin}</span>
                                    <span className="text-slate-400 opacity-60 px-0.5">→</span>
                                    <span>{route.dest}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── SEARCH RESULTS ─────────────────────────────── */}
                {isSearchActive && community && (
                    <Suspense fallback={<SearchSkeleton />}>
                        <SearchResults
                            communityId={community.id}
                            originQuery={originQuery}
                            destQuery={destQuery}
                            lang={lang}
                            t={tWide}
                        />
                    </Suspense>
                )}

                {/* ── DEFAULT VIEW (no active search) ────────────── */}
                {!isSearchActive && (
                    <>
                        {/* OFFER A RIDE — always visible above the fold for new users */}
                        <section className="animate-fade-in-up stagger-2">
                            {/* Section intent label */}
                            <div className="flex items-center gap-2 px-1 mb-3">
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                    Offer a Ride
                                </span>
                                <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                            </div>

                            <Link
                                href="/trips/new"
                                className="block rounded-3xl bg-slate-900 dark:bg-slate-800 p-5 shadow-lg card-hover relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 opacity-20 rounded-full blur-3xl group-hover:opacity-30 transition-opacity ltr:translate-x-1/3 ltr:-translate-y-1/3 rtl:-translate-x-1/3 rtl:-translate-y-1/3"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500 opacity-20 rounded-full blur-2xl ltr:-translate-x-1/3 ltr:translate-y-1/3 rtl:translate-x-1/3 rtl:translate-y-1/3"></div>

                                <div className="relative z-10 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-bold text-sky-300 dark:text-sky-400 uppercase tracking-widest mb-1">
                                            {t('offer_ride')}
                                        </p>
                                        <h3 className="text-lg font-bold text-white mb-0.5">
                                            {t('create_new_trip')}
                                        </h3>
                                        <p className="text-sm text-slate-400 dark:text-slate-300 max-w-[200px]">
                                            {t('offer_empty_seats')}
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform rtl:-scale-x-100 rtl:group-hover:-scale-x-110">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
                                    </div>
                                </div>
                            </Link>
                        </section>

                        {/* MY ACTIVITY — only shown if user has trips/bookings */}
                        {hasActivity && (
                            <section className="animate-fade-in-up stagger-3 space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        {t('your_activity')}
                                    </span>
                                    <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                    <Link href="/trips/my-rides" className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold hover:underline">
                                        {t('my_rides')} →
                                    </Link>
                                </div>

                                {myBookings.length > 0 && (
                                    <div className="space-y-2">
                                        {myBookings.slice(0, 2).map((trip) => (
                                            <Link key={trip.id} href={`/trips/${trip.id}`} className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm card-hover">
                                                {(() => {
                                                    const statusUi = getTripStatusPresentation(trip);
                                                    return (
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shrink-0 ${statusUi.accentClassName}`}>🎫</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 justify-between">
                                                            <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-0.5">{t('passenger')}</p>
                                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusUi.chipClassName}`}>
                                                                {statusUi.label}
                                                            </span>
                                                        </div>
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{trip.origin_name} → {trip.destination_name}</p>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                                {new Date(trip.departure_time).toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                                                {trip.seats_available} seat{trip.seats_available === 1 ? '' : 's'} open
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-slate-300 dark:text-slate-600 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                                                    </span>
                                                </div>
                                                    );
                                                })()}
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                {myTrips.length > 0 && (
                                    <div className="space-y-2">
                                        {myTrips.slice(0, 2).map((trip) => (
                                            <Link key={trip.id} href={`/trips/${trip.id}`} className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm card-hover">
                                                {(() => {
                                                    const statusUi = getTripStatusPresentation(trip);
                                                    return (
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shrink-0 ${statusUi.accentClassName}`}>🚗</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 justify-between">
                                                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">{t('driver')}</p>
                                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusUi.chipClassName}`}>
                                                                {statusUi.label}
                                                            </span>
                                                        </div>
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{trip.origin_name} → {trip.destination_name}</p>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                                {new Date(trip.departure_time).toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                                                {trip.seats_available} seat{trip.seats_available === 1 ? '' : 's'} open
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="text-slate-300 dark:text-slate-600 shrink-0">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                                                    </span>
                                                </div>
                                                    );
                                                })()}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* AVAILABLE TRIPS — Passive Discovery */}
                        {community && (
                            <section className="animate-fade-in-up stagger-4 space-y-3">
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        {t('available_rides')}
                                    </span>
                                    <span className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <Suspense fallback={<SearchSkeleton />}>
                                    <DiscoveryFeed
                                        communityId={community.id}
                                        inferredHub={inferredHub}
                                        lang={lang}
                                        t={tWide}
                                    />
                                </Suspense>
                            </section>
                        )}
                    </>
                )}

                {/* No community state */}
                {!community && (
                    <div className="text-center pt-2">
                        <div className="rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 p-6">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">👋</div>
                            <p className="text-sm text-amber-900 dark:text-amber-400 font-semibold">{t('no_community')}</p>
                            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 mb-4">{t('no_community_desc')}</p>
                            <Link
                                href="/community"
                                className="inline-block rounded-xl bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors btn-press"
                            >
                                {t('join_community')}
                            </Link>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
