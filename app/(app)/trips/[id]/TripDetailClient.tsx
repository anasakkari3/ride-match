'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import type { BookingWithPassenger, TripWithDriver } from '@/lib/types';
import type { Lang } from '@/lib/i18n/dictionaries';
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
  formatLocalizedTime,
  formatPriceLabel,
  formatRouteLabel,
  formatSeatAvailability,
  formatSeatCount,
  getRelativeDayLabel,
} from '@/lib/i18n/locale';
import { bookSeat, cancelBookingAction, updateTripStatusAction } from './actions';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';
import { canStartTrip, canCompleteTrip } from '@/lib/trips/lifecycle-permissions';
import { DriverTrustSummary } from '@/app/(app)/DriverTrustSummary';
import CommunityBadge from '@/components/CommunityBadge';
import { canDisplayDriverCancelAction } from '@/lib/trips/coordination';
import TripCoordinationPanel from './TripCoordinationPanel';
import ReportUserModal from './ReportUserModal';
import { DETAIL_COPY, localizeTripActionError } from './tripDetailCopy';

type Props = {
  trip: TripWithDriver;
  bookings: BookingWithPassenger[];
  currentUserId: string | null;
  communicationAccess: {
    canView: boolean;
    canSendMessages: boolean;
    canSendCoordination: boolean;
    isRestricted: boolean;
  };
  wasJustCreated?: boolean;
};

function formatDeparture(isoString: string, lang: Lang, t: (key: string) => string) {
  const departure = new Date(isoString);
  const now = new Date();
  const diffMs = departure.getTime() - now.getTime();
  const isPast = departure < now;

  return {
    date: isPast
      ? formatLocalizedDate(lang, departure, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })
      : getRelativeDayLabel(lang, departure, t),
    time: formatLocalizedTime(lang, departure),
    isPast,
    isSoon: !isPast && diffMs < 60 * 60 * 1000,
  };
}

function formatPerSeatPrice(
  priceCents: number | null | undefined,
  t: (key: string) => string,
  perSeatSuffix: string
) {
  const label = formatPriceLabel(priceCents, t);
  if (!label) return null;
  if (priceCents === 0) return label;
  return `${label} ${perSeatSuffix}`;
}

function upsertBooking(
  existingBookings: BookingWithPassenger[],
  canonicalBooking: BookingWithPassenger
) {
  const existingIndex = existingBookings.findIndex((booking) => booking.id === canonicalBooking.id);

  if (existingIndex === -1) {
    return [...existingBookings, canonicalBooking];
  }

  return existingBookings.map((booking) =>
    booking.id === canonicalBooking.id
      ? {
          ...booking,
          ...canonicalBooking,
        }
      : booking
  );
}

function passengerFromBookingSnapshot(booking: BookingWithPassenger) {
  const displayName =
    typeof booking.passenger_display_name === 'string'
      ? booking.passenger_display_name
      : null;
  const avatarUrl =
    typeof booking.passenger_avatar_url === 'string'
      ? booking.passenger_avatar_url
      : null;

  if (!displayName && !avatarUrl) {
    return null;
  }

  return {
    id: booking.passenger_id,
    display_name: displayName,
    avatar_url: avatarUrl,
    rating_avg: 0,
    rating_count: 0,
  };
}

export default function TripDetailClient({
  trip: initialTrip,
  bookings: initialBookings,
  currentUserId,
  communicationAccess,
  wasJustCreated = false,
}: Props) {
  const { t, lang } = useTranslation();
  const copy = DETAIL_COPY[lang] ?? DETAIL_COPY.en;
  const [trip, setTrip] = useState(initialTrip);
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(wasJustCreated ? copy.tripLiveNotice : null);
  const [showBookConfirm, setShowBookConfirm] = useState(false);
  const [showCancelTripConfirm, setShowCancelTripConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [shouldWatchBookings, setShouldWatchBookings] = useState(
    currentUserId === initialTrip.driver_id ||
      initialBookings.some(
        (booking) => booking.passenger_id === currentUserId && booking.status === 'confirmed'
      )
  );

  useEffect(() => {
    const db = getFirebaseFirestore();
    const tripRef = doc(db, 'trips', initialTrip.id);
    const unsubscribe = onSnapshot(
      tripRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setTrip((prev) => ({ ...prev, ...data, id: snapshot.id }));
        }
      },
      (snapshotError) => {
        console.warn('Trip subscription error:', snapshotError.message);
      }
    );

    return () => unsubscribe();
  }, [initialTrip.id]);

  useEffect(() => {
    if (!shouldWatchBookings) return;

    const db = getFirebaseFirestore();
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('trip_id', '==', initialTrip.id)
    );

    const passengerMap = new Map(
      initialBookings.map((booking) => [booking.id, booking.passenger ?? null])
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const nextBookings = snapshot.docs
          .map((bookingDoc) => {
            const data = bookingDoc.data() as BookingWithPassenger;
            const snapshotPassenger = passengerFromBookingSnapshot({
              ...data,
              id: bookingDoc.id,
            } as BookingWithPassenger);

            return {
              ...data,
              id: bookingDoc.id,
              passenger: passengerMap.get(bookingDoc.id) ?? snapshotPassenger,
            } as BookingWithPassenger;
          })
          .filter(
            (booking) => booking.status === 'confirmed' || booking.status === 'cancelled'
          );

        setBookings((prev) => {
          const previousPassengerMap = new Map(
            prev.map((booking) => [booking.id, booking.passenger ?? null])
          );

          return nextBookings.map((booking) => ({
            ...booking,
            passenger:
              booking.passenger ??
              previousPassengerMap.get(booking.id) ??
              passengerFromBookingSnapshot(booking),
          }));
        });
      },
      (snapshotError) => {
        if (snapshotError.code === 'permission-denied') {
          setBookings([]);
          setShouldWatchBookings(false);
          return;
        }
        console.warn('Booking subscription error:', snapshotError.message);
      }
    );

    return () => unsubscribe();
  }, [initialBookings, initialTrip.id, shouldWatchBookings]);

  const effectiveStatus = getEffectiveTripStatus(trip);
  const isDriver = currentUserId === trip.driver_id;
  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');
  const myBooking = bookings.find(
    (booking) => booking.passenger_id === currentUserId && booking.status === 'confirmed'
  );
  const myCancelledBooking = bookings.find(
    (booking) => booking.passenger_id === currentUserId && booking.status === 'cancelled'
  );
  const hasBooked = Boolean(myBooking);
  const hasCancelled = Boolean(myCancelledBooking) && !hasBooked;
  const isScheduled = effectiveStatus === 'scheduled';
  const isFull = effectiveStatus === 'full';
  const isInProgress = effectiveStatus === 'in_progress';
  const isCompleted = effectiveStatus === 'completed';
  const isCancelled = effectiveStatus === 'cancelled';
  const isActiveTrip = isScheduled || isFull || isInProgress;
  const { date, time, isPast, isSoon } = formatDeparture(trip.departure_time, lang, t);
  const canBook = !isDriver && isScheduled && !hasBooked && !isPast;
  const canViewTripUpdates = !hasCancelled && (communicationAccess.canView || isDriver || hasBooked);
  const isCommunicationRestricted = communicationAccess.isRestricted && canViewTripUpdates;
  const canSendTripMessages =
    canViewTripUpdates &&
    isActiveTrip &&
    !isCommunicationRestricted &&
    (isDriver || hasBooked);
  const priceLabel = formatPerSeatPrice(trip.price_cents, t, copy.perSeatSuffix);
  const priceValueLabel = formatPriceLabel(trip.price_cents, t);
  const canCancelTrip = canDisplayDriverCancelAction({
    trip: {
      status: trip.status,
      seats_available: trip.seats_available,
      departure_time: trip.departure_time,
    },
    isDriver,
  });

  const statusConfig = {
    scheduled: { label: isPast ? copy.departed : t('scheduled'), color: 'bg-sky-500' },
    full: { label: t('full'), color: 'bg-amber-500' },
    in_progress: { label: t('in_progress'), color: 'bg-indigo-500' },
    completed: { label: t('completed'), color: 'bg-emerald-500' },
    cancelled: { label: t('cancelled'), color: 'bg-red-500' },
    draft: { label: t('draft'), color: 'bg-slate-500' },
  }[effectiveStatus];

  const handleBook = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await bookSeat(trip.id, 1);
      setTrip((prev) => ({
        ...prev,
        seats_available: result.seats_available,
        status: result.status,
      }));
      setBookings((prev) => upsertBooking(prev, result.booking));
      setShouldWatchBookings(true);

      setShowBookConfirm(false);
      setNotice(copy.bookingReservedNotice);
    } catch (bookingError) {
      setError(
        localizeTripActionError(
          bookingError instanceof Error ? bookingError.message : copy.errors.genericBooking,
          lang
        )
      );
    }

    setLoading(false);
  };

  const handleCancelBooking = async () => {
    if (!myBooking) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const result = await cancelBookingAction(myBooking.id);

      setTrip((prev) => ({
        ...prev,
        seats_available: Math.min(prev.seats_total, prev.seats_available + result.seats),
        status: result.status,
      }));
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === result.bookingId
            ? {
                ...booking,
                status: 'cancelled',
                cancelled_at: result.cancelledAt,
                cancelled_by: result.cancelledBy,
              }
            : booking
        )
      );
      setNotice(copy.bookingCancelledNotice);
    } catch (cancelError) {
      setError(
        localizeTripActionError(
          cancelError instanceof Error ? cancelError.message : copy.errors.genericCancel,
          lang
        )
      );
    }

    setLoading(false);
  };

  const handleTripStatus = async (status: 'in_progress' | 'completed' | 'cancelled') => {
    setStatusLoading(true);
    setError(null);
    setNotice(null);

    try {
      const updatedTrip = await updateTripStatusAction(trip.id, status);
      setTrip((prev) => ({
        ...prev,
        ...updatedTrip,
      }));
      setShowCancelTripConfirm(false);
      setNotice(
        status === 'in_progress'
          ? copy.startTripNotice
          : status === 'completed'
            ? copy.completedTripNotice
            : copy.cancelledTripNotice
      );
    } catch (statusError) {
      setError(
        localizeTripActionError(
          statusError instanceof Error ? statusError.message : copy.errors.genericUpdate,
          lang
        )
      );
    }

    setStatusLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className={`px-5 pt-5 pb-4 ${
          isCancelled
            ? 'bg-red-50 dark:bg-red-900/10'
            : isCompleted
              ? 'bg-emerald-50 dark:bg-emerald-900/10'
              : 'bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-900'
        }`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <CommunityBadge name={trip.community_name} type={trip.community_type} />
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-black tabular-nums ${isSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}`}
                  dir="ltr"
                >
                  {time}
                </span>
                <span className={`text-sm font-semibold ${
                  isSoon
                    ? 'text-amber-500'
                    : isPast
                      ? 'text-slate-400'
                      : 'text-sky-600 dark:text-sky-400'
                }`}>
                  {date}
                </span>
              </div>
              {isSoon && (
                <p className="mt-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  {copy.departingSoon}
                </p>
              )}
              {trip.community_type === 'public' && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-2">
                  {copy.publicTrustNote}
                </p>
              )}
            </div>
            <span className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <div className="w-px h-5 bg-slate-300 dark:bg-slate-600" />
              <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-500" />
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  {copy.from}
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug" dir="auto">
                  {trip.origin_name}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                  {copy.to}
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug" dir="auto">
                  {trip.destination_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {trip.driver?.avatar_url ? (
              <Image
                src={trip.driver.avatar_url}
                alt={copy.driver}
                width={44}
                height={44}
                className="w-11 h-11 rounded-full border-2 border-slate-100 dark:border-slate-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-900/30 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-sm font-bold text-sky-600 dark:text-sky-400 shrink-0">
                {(trip.driver?.display_name?.[0] ?? copy.driver[0] ?? 'D').toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {copy.driver}
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate" dir="auto">
                {trip.driver?.display_name ?? copy.communityMember}
              </p>
            </div>
          </div>
          <DriverTrustSummary
            ratingAvg={trip.driver?.rating_avg}
            ratingCount={trip.driver?.rating_count}
            completedDrives={trip.driver_completed_drives ?? 0}
            variant="full"
          />
        </div>

        {!isDriver && (
          <div className="px-5 pb-4 -mt-2">
            <button
              onClick={() => setShowReportModal(true)}
              data-testid="report-driver-button"
              className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 transition-colors"
            >
              {copy.reportDriver}
            </button>
          </div>
        )}

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{t('seats_available')}</p>
            <p className={`text-xl font-black ${
              isFull
                ? 'text-red-500 dark:text-red-400'
                : trip.seats_available <= 2
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-sky-600 dark:text-sky-400'
            }`}>
              {isFull ? t('full') : formatSeatAvailability(trip.seats_available, t)}
            </p>
          </div>
          {trip.price_cents != null && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                {copy.pricePerSeat}
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400" dir="ltr">
                {priceValueLabel}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
          {copy.whatSignalsMean}
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {copy.signalsDescription}
        </p>
      </div>

      {notice && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{notice}</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-4">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {isCommunicationRestricted && canViewTripUpdates && isActiveTrip && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {copy.communicationLimitedTitle}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            {copy.communicationLimitedDescription}
          </p>
        </div>
      )}

      {canBook && (
        !showBookConfirm ? (
          <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">
                  {copy.availableNow}
                </p>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('book_seat')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  {copy.reserveSeatDescription(priceLabel)}
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/40 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
                {formatSeatAvailability(trip.seats_available, t)}
              </div>
            </div>
            {trip.community_type === 'public' && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-3">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {copy.publicBookingTitle}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  {copy.publicBookingDescription}
                </p>
                <Link
                  href="/profile"
                  className="inline-flex mt-2 text-xs font-medium text-amber-800 dark:text-amber-200 underline underline-offset-2"
                >
                  {copy.updateProfile}
                </Link>
              </div>
            )}
            <button
              onClick={() => setShowBookConfirm(true)}
              data-testid="start-booking-button"
              className="w-full rounded-2xl bg-sky-600 dark:bg-sky-500 px-4 py-4 text-base font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press shadow-md"
            >
              {t('book_seat')}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 p-5 space-y-4">
            <div>
              <p className="text-sm font-bold text-sky-900 dark:text-sky-100 mb-1">{t('confirm_booking_title')}</p>
              <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                <span dir="auto">{formatRouteLabel(trip.origin_name, trip.destination_name)}</span>
                {priceLabel ? ` | ${priceLabel}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBook}
                disabled={loading}
                data-testid="confirm-booking-button"
                className="flex-1 rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors"
              >
                {loading ? t('booking') : copy.confirmBooking}
              </button>
              <button
                onClick={() => setShowBookConfirm(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        )
      )}

      <TripCoordinationPanel
        tripId={trip.id}
        isDriver={isDriver}
        hasBooked={hasBooked}
        tripStatus={effectiveStatus}
        tripSeatsAvailable={trip.seats_available}
        tripDepartureTime={trip.departure_time}
        isMessageRestricted={isCommunicationRestricted}
        onCancelBooking={handleCancelBooking}
        cancelLoading={loading}
      />

      {canViewTripUpdates && (
        <Link
        href={`/trips/${trip.id}/chat`}
        data-testid="open-trip-chat-link"
        className="block rounded-2xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
      >
          {canSendTripMessages ? copy.openTripCommunication : copy.openTripUpdates}
        </Link>
      )}

      {isCancelled && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 text-center space-y-2">
          <p className="text-sm font-bold text-red-700 dark:text-red-400">{copy.tripCancelledTitle}</p>
          <p className="text-xs text-red-600 dark:text-red-300" dir="auto">
            {copy.tripCancelledDescription(
              trip.driver?.display_name || copy.reportDriverFallback,
              trip.cancelled_at ? formatLocalizedDateTime(lang, trip.cancelled_at) : null
            )}
          </p>
        </div>
      )}

      {hasCancelled && !isCancelled && (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{copy.seatCancelledTitle}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {copy.seatCancelledDescription(
              myCancelledBooking?.cancelled_at
                ? formatLocalizedDateTime(lang, myCancelledBooking.cancelled_at)
                : null
            )}
          </p>
        </div>
      )}

      {isCompleted && !isDriver && hasBooked && (
        <Link
          href={`/trips/${trip.id}/rate`}
          className="block w-full rounded-2xl bg-amber-500 dark:bg-amber-600 px-4 py-4 text-center text-base font-bold text-white hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors btn-press shadow-md"
        >
          {t('rate_trip')} {'>'}
        </Link>
      )}

      {isDriver && isActiveTrip && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{t('driver_controls')}</p>

          {(isScheduled || isFull) && (
            <button
              onClick={() => handleTripStatus('in_progress')}
              disabled={statusLoading || !canStartTrip(currentUserId, trip).allowed}
              className="w-full rounded-2xl bg-indigo-600 dark:bg-indigo-500 px-4 py-4 text-base font-bold text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? t('loading') : copy.startTrip}
            </button>
          )}

          {isInProgress && (
            <button
              onClick={() => handleTripStatus('completed')}
              disabled={statusLoading || !canCompleteTrip(currentUserId, trip).allowed}
              className="w-full rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-4 py-4 text-base font-bold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? t('loading') : t('complete_trip')}
            </button>
          )}

          {canCancelTrip && (
            !showCancelTripConfirm ? (
              <button
                onClick={() => setShowCancelTripConfirm(true)}
                disabled={statusLoading}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 disabled:opacity-50 transition-colors"
              >
                {t('cancel_trip')}
              </button>
            ) : (
              <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
                <p className="text-sm font-bold text-red-800 dark:text-red-300">
                  {copy.cancelTripPromptTitle}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400">
                  {copy.cancelTripPromptDescription}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTripStatus('cancelled')}
                    disabled={statusLoading}
                    className="flex-1 rounded-xl bg-red-600 dark:bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {statusLoading ? t('loading') : copy.confirmCancelTrip}
                  </button>
                  <button
                    onClick={() => setShowCancelTripConfirm(false)}
                    className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {copy.keepTrip}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {(isDriver || hasBooked) && bookings.length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            {t('passengers')} | {confirmedBookings.length}
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {bookings.map((booking) => {
              const isPassengerCancelled = booking.status === 'cancelled';
              return (
                <div key={booking.id} className={`flex items-center justify-between py-3 first:pt-0 last:pb-0 ${isPassengerCancelled ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPassengerCancelled
                        ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                        : 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
                    }`}>
                      {copy.passengerInitial}
                    </div>
                    <div>
                      <span
                        className={`text-sm font-medium ${isPassengerCancelled ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}
                        dir="auto"
                      >
                        {booking.passenger?.display_name ?? copy.communityMember}
                      </span>
                      {isPassengerCancelled && (
                        <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                          {t('cancelled')}
                        </span>
                      )}
                      {isPassengerCancelled && booking.cancelled_at && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          {formatLocalizedDateTime(lang, booking.cancelled_at)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {formatSeatCount(booking.seats, t)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showReportModal && (
        <ReportUserModal
          isOpen={true}
          onClose={() => setShowReportModal(false)}
          tripId={trip.id}
          reportedUserId={trip.driver_id}
          reportedUserName={trip.driver?.display_name || copy.reportDriverFallback}
        />
      )}
    </div>
  );
}
