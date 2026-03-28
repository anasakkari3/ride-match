import Link from 'next/link';

// Flat display interface covering fields from both TripWithDriver and TripSearchResult
type TripCardTrip = {
    id: string;
    origin_name: string;
    destination_name: string;
    departure_time: string;
    seats_available: number;
    price_cents?: number | null;
    score?: number;
    // Proximity data from TripSearchResult (present when shown in search context)
    origin_dist_m?: number;
    driver?: {
        avatar_url?: string | null;
        display_name?: string | null;
        rating_avg?: number;
        rating_count?: number;
    } | null;
    // Flattened fields from TripSearchResult
    avatar_url?: string | null;
    display_name?: string | null;
    driver_rating_avg?: number;
    driver_rating_count?: number;
};

function formatDepartureDate(isoString: string, lang: string): { time: string; date: string } {
    const date = new Date(isoString);
    const now = new Date();

    const time = date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });

    // Use relative day labels when the trip is today or tomorrow
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayDiff = Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86_400_000);

    let dateLabel: string;
    if (dayDiff === 0) {
        dateLabel = 'Today';
    } else if (dayDiff === 1) {
        dateLabel = 'Tomorrow';
    } else {
        dateLabel = date.toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });
    }

    return { time, date: dateLabel };
}

function formatPrice(priceCents: number | null | undefined): string | null {
    if (priceCents == null) return null;           // price unknown — show nothing
    if (priceCents === 0) return 'Free';            // explicitly free ride
    return `$${(priceCents / 100).toFixed(2)}`;    // paid ride
}

export function TripCard(props: { trip: TripCardTrip; t?: (k: string) => string; lang?: string }) {
    const { trip, lang = 'en' } = props;
    const driverName = trip.driver?.display_name || trip.display_name || null;
    const avatarUrl = (trip.driver?.avatar_url || trip.avatar_url) ?? undefined;
    const ratingAvg = trip.driver?.rating_avg ?? trip.driver_rating_avg;
    const ratingCount = trip.driver?.rating_count || trip.driver_rating_count;

    const { time, date } = formatDepartureDate(trip.departure_time, lang);
    const priceDisplay = formatPrice(trip.price_cents);
    const score = trip.score ?? 0;
    const isHighMatch = score >= 80;

    // Only show Great Match badge — omit proximity hint since origin_dist_m
    // is based on an inferred hub, not the user's current GPS position.
    const proximityHint = null;

    // Urgency: only call out when seats are genuinely scarce (1 or 2 left)
    const showSeatUrgency = trip.seats_available <= 2;
    const seatsLabel = trip.seats_available === 1 ? '1 seat left' : `${trip.seats_available} seats left`;

    const isToday = date === 'Today';

    return (
        <Link
            href={`/trips/${trip.id}`}
            className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm card-hover relative overflow-hidden group animate-fade-in-up"
        >
            {/* Left accent bar — sky for normal, amber for today's trips (time‐sensitive) */}
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${isToday ? 'bg-amber-400 dark:bg-amber-500' : 'bg-sky-200 dark:bg-sky-800'}`} />

            <div className="pl-5 pr-4 pt-4 pb-4 space-y-3">

                {/* Row 1: Departure time (primary decision signal) */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                                {time}
                            </span>
                            <span className={`text-xs font-semibold ${isToday ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {date}
                            </span>
                        </div>
                        {/* Proximity hint explains why this is a high match */}
                        {proximityHint && (
                            <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5 font-medium">
                                {proximityHint}
                            </p>
                        )}
                    </div>

                    {/* Right: price + match badge — only show what's meaningful */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        {priceDisplay && (
                            <span className={`text-sm font-bold tabular-nums ${
                                priceDisplay === 'Free'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-900 dark:text-slate-100'
                            }`}>
                                {priceDisplay}
                            </span>
                        )}
                        {isHighMatch && (
                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                Great match
                            </span>
                        )}
                    </div>
                </div>

                {/* Row 2: Route — the core scan target */}
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug truncate">
                            {trip.origin_name}
                        </p>
                    </div>
                    <div className="flex items-stretch gap-2.5 my-0.5">
                        <div className="flex justify-center w-2 shrink-0">
                            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                        </div>
                        <div className="flex-1" />
                    </div>
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full border-2 border-emerald-500 shrink-0" />
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug truncate">
                            {trip.destination_name}
                        </p>
                    </div>
                </div>

                {/* Row 3: Driver + urgency pill */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                    {/* Driver identity */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt={driverName ?? 'Driver'}
                                className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                        )}
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[90px]">
                                {driverName ?? 'Community member'}
                            </span>
                            {ratingCount ? (
                                <span className="text-[10px] text-amber-500 font-bold shrink-0">
                                    ★ {(ratingAvg ?? 0).toFixed(1)}
                                </span>
                            ) : driverName ? (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">New</span>
                            ) : null}
                        </div>
                    </div>

                    {/* Scarcity pill — only shown when urgency is real */}
                    {showSeatUrgency && (
                        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                            trip.seats_available === 1
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
                                : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        }`}>
                            {seatsLabel}
                        </span>
                    )}

                    {/* When not scarce, show seat count more quietly */}
                    {!showSeatUrgency && (
                        <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {trip.seats_available} seats
                        </span>
                    )}
                </div>

            </div>
        </Link>
    );
}
