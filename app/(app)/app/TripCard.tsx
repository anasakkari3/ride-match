import Link from 'next/link';
import Image from 'next/image';
import { DriverTrustSummary } from '../DriverTrustSummary';
import CommunityBadge from '@/components/CommunityBadge';
import type { CommunityType } from '@/lib/types';
import type { Lang } from '@/lib/i18n/dictionaries';
import {
  formatLocalizedTime,
  formatPriceLabel,
  formatSeatAvailability,
  formatSeatCount,
  getRelativeDayLabel,
} from '@/lib/i18n/locale';

type TripCardTrip = {
  id: string;
  community_name?: string | null;
  community_type?: CommunityType | null;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  seats_available: number;
  price_cents?: number | null;
  driver?: {
    avatar_url?: string | null;
    display_name?: string | null;
    rating_avg?: number;
    rating_count?: number;
  } | null;
  avatar_url?: string | null;
  display_name?: string | null;
  driver_received_rating_avg?: number;
  driver_received_rating_count?: number;
  driver_completed_drives?: number;
};

const FALLBACK = {
  today: 'Today',
  tomorrow: 'Tomorrow',
  free: 'Free',
  seat: 'seat',
  seats: 'seats',
  seat_left: 'seat left',
  seats_left: 'seats left',
  community_member: 'Community member',
  publicCommunityNote: 'Public community',
  driver: 'Driver',
} as const;

const PUBLIC_COPY: Record<Lang, string> = {
  en: 'Public community',
  ar: 'مجتمع عام',
  he: 'קהילה ציבורית',
};

function normalizeLang(lang?: string): Lang {
  return lang === 'ar' || lang === 'he' ? lang : 'en';
}

export function TripCard(props: { trip: TripCardTrip; t?: (k: string) => string; lang?: string }) {
  const { trip, t, lang = 'en' } = props;
  const activeLang = normalizeLang(lang);
  const translate = (key: string) => t?.(key) ?? FALLBACK[key as keyof typeof FALLBACK] ?? key;
  const driverName = trip.driver?.display_name || trip.display_name || null;
  const avatarUrl = (trip.driver?.avatar_url || trip.avatar_url) ?? undefined;
  const receivedRatingAvg = trip.driver?.rating_avg ?? trip.driver_received_rating_avg;
  const receivedRatingCount = trip.driver?.rating_count || trip.driver_received_rating_count;
  const time = formatLocalizedTime(activeLang, trip.departure_time);
  const date = getRelativeDayLabel(activeLang, trip.departure_time, translate);
  const priceDisplay = formatPriceLabel(trip.price_cents, translate);
  const showSeatUrgency = trip.seats_available <= 2;
  const seatsLabel = formatSeatAvailability(trip.seats_available, translate);
  const seatCountLabel = formatSeatCount(trip.seats_available, translate);
  const isToday = date === translate('today');

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm card-hover relative overflow-hidden group animate-fade-in-up"
    >
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full ${isToday ? 'bg-amber-400 dark:bg-amber-500' : 'bg-sky-200 dark:bg-sky-800'}`} />

      <div className="pl-5 pr-4 pt-4 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CommunityBadge
              name={trip.community_name}
              type={trip.community_type}
              compact
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                {time}
              </span>
              <span className={`text-xs font-semibold ${isToday ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}>
                {date}
              </span>
            </div>
            {trip.community_type === 'public' && (
              <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                {PUBLIC_COPY[activeLang]}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {priceDisplay && (
              <span className={`text-sm font-bold tabular-nums ${
                priceDisplay === translate('free')
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}>
                {priceDisplay}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug truncate" dir="auto">
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
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug truncate" dir="auto">
              {trip.destination_name}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={driverName ?? translate('driver')}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">
                {(driverName?.[0] ?? translate('driver')[0]).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[90px] leading-tight">
                {driverName ?? translate('community_member')}
              </span>
              <DriverTrustSummary
                ratingAvg={receivedRatingAvg}
                ratingCount={receivedRatingCount}
                completedDrives={trip.driver_completed_drives ?? 0}
                variant="compact"
              />
            </div>
          </div>

          {showSeatUrgency ? (
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
              trip.seats_available === 1
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20'
                : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
            }`}>
              {seatsLabel}
            </span>
          ) : (
            <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              {seatCountLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
