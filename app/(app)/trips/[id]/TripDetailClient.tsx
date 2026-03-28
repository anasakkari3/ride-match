'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import type { BookingWithPassenger, TripWithDriver } from '@/lib/types';
import { bookSeat, cancelBookingAction, updateTripStatusAction } from './actions';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';

type Props = {
  trip: TripWithDriver;
  bookings: BookingWithPassenger[];
  currentUserId: string | null;
  wasJustCreated?: boolean;
};

function formatDeparture(isoString: string, lang: string): {
  date: string;
  time: string;
  isPast: boolean;
  isSoon: boolean;
} {
  const departure = new Date(isoString);
  const now = new Date();
  const diffMs = departure.getTime() - now.getTime();
  const isPast = departure < now;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDeparture = new Date(
    departure.getFullYear(),
    departure.getMonth(),
    departure.getDate()
  );
  const dayDiff = Math.round((startOfDeparture.getTime() - startOfToday.getTime()) / 86_400_000);

  let date = departure.toLocaleDateString(lang, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (dayDiff === 0) date = 'Today';
  if (dayDiff === 1) date = 'Tomorrow';

  return {
    date,
    time: departure.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }),
    isPast,
    isSoon: !isPast && diffMs < 60 * 60 * 1000,
  };
}

export default function TripDetailClient({
  trip: initialTrip,
  bookings: initialBookings,
  currentUserId,
  wasJustCreated = false,
}: Props) {
  const { t, lang } = useTranslation();
  const [trip, setTrip] = useState(initialTrip);
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    wasJustCreated ? 'Your ride is live. Passengers in your community can now see and book it.' : null
  );
  const [showBookConfirm, setShowBookConfirm] = useState(false);
  const [showCancelTripConfirm, setShowCancelTripConfirm] = useState(false);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const tripRef = doc(db, 'trips', trip.id);
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
  }, [trip.id]);

  const isDriver = currentUserId === trip.driver_id;
  const myBooking = bookings.find((booking) => booking.passenger_id === currentUserId);
  const hasBooked = Boolean(myBooking);
  const { date, time, isPast, isSoon } = formatDeparture(trip.departure_time, lang);

  const effectiveStatus = getEffectiveTripStatus(trip);
  const isScheduled = effectiveStatus === 'scheduled';
  const isFull = effectiveStatus === 'full';
  const isInProgress = effectiveStatus === 'in_progress';
  const isCompleted = effectiveStatus === 'completed';
  const isCancelled = effectiveStatus === 'cancelled';
  const canBook = !isDriver && isScheduled && !hasBooked && !isPast;
  const canOpenChat = hasBooked && (isScheduled || isFull || isInProgress);

  const statusConfig = {
    scheduled: {
      label: isPast ? 'Departed' : 'Scheduled',
      color: isPast ? 'bg-slate-500' : 'bg-sky-500',
      text: 'text-white',
    },
    full: { label: 'Full', color: 'bg-amber-500', text: 'text-white' },
    in_progress: { label: 'In Progress', color: 'bg-indigo-500', text: 'text-white' },
    completed: { label: 'Completed', color: 'bg-emerald-500', text: 'text-white' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500', text: 'text-white' },
    draft: { label: 'Draft', color: 'bg-slate-400', text: 'text-white' },
  }[effectiveStatus];

  const hasRating = (trip.driver?.rating_count ?? 0) > 0;
  const ratingLabel = hasRating
    ? `★ ${Number(trip.driver?.rating_avg).toFixed(1)} · ${trip.driver?.rating_count} ${
        trip.driver?.rating_count === 1 ? 'rating' : 'ratings'
      }`
    : 'No ratings yet';
  const priceLabel =
    trip.price_cents == null
      ? null
      : trip.price_cents === 0
        ? 'Free'
        : `$${(trip.price_cents / 100).toFixed(2)} per seat`;

  let nextStepTitle = 'Review this ride';
  let nextStepBody =
    'Check the route, departure time, and seat availability below before deciding what to do next.';
  let secondaryLink: { href: string; label: string } | null = { href: '/app', label: 'Back to rides' };

  if (wasJustCreated && isDriver && isScheduled) {
    nextStepTitle = 'Your ride is live';
    nextStepBody =
      'Passengers in your community can now see this trip and reserve a seat. Review the details below or head to your rides to manage it later.';
    secondaryLink = { href: '/trips/my-rides', label: 'View my rides' };
  } else if (isDriver && (isScheduled || isFull)) {
    nextStepTitle = 'You are managing this ride';
    nextStepBody =
      isFull
        ? 'All seats are taken. Start the trip when everyone is ready, or cancel it if plans changed.'
        : 'Seats update automatically as passengers join. Start the trip when you are ready to depart, or cancel it if plans change.';
    secondaryLink =
      bookings.length > 0
        ? { href: `/trips/${trip.id}/chat`, label: 'Open trip chat' }
        : { href: '/trips/my-rides', label: 'View my rides' };
  } else if (isDriver && isInProgress) {
    nextStepTitle = 'This ride is in progress';
    nextStepBody = 'The trip has started. When the ride is finished, mark it as completed so passengers can rate it.';
    secondaryLink =
      bookings.length > 0
        ? { href: `/trips/${trip.id}/chat`, label: 'Open trip chat' }
        : { href: '/trips/my-rides', label: 'View my rides' };
  } else if (canOpenChat) {
    nextStepTitle = 'You have a confirmed seat';
    nextStepBody =
      isInProgress
        ? 'The ride is underway. Open the trip chat if you need to coordinate with the driver or other passengers.'
        : 'Open the trip chat for coordination, or cancel your booking here if your plans changed.';
    secondaryLink = { href: `/trips/${trip.id}/chat`, label: 'Open trip chat' };
  } else if (canBook) {
    nextStepTitle = 'A seat is available';
    nextStepBody = `Book now to reserve 1 seat${
      priceLabel ? ` at ${priceLabel.replace(' per seat', '')}` : ''
    }. Once booked, this page will show your confirmed seat and the trip chat.`;
  } else if (!isDriver && isFull && !hasBooked) {
    nextStepTitle = 'This ride is full';
    nextStepBody = 'All seats are taken right now. Head back to the ride list to find another option.';
  } else if (!isDriver && !hasBooked && isPast && isScheduled) {
    nextStepTitle = 'This ride already departed';
    nextStepBody = 'This trip is no longer bookable. Go back to browse rides that are still upcoming.';
  } else if (isCancelled) {
    nextStepTitle = 'This ride was cancelled';
    nextStepBody = isDriver
      ? 'Passengers can no longer join this trip. Return to your rides when you are ready to publish another one.'
      : 'This trip is no longer available. Head back to the ride list to find another option.';
  } else if (isCompleted && hasBooked) {
    nextStepTitle = 'This ride is complete';
    nextStepBody = 'You can leave a rating now, or go back to browse your next ride.';
    secondaryLink = { href: `/trips/${trip.id}/rate`, label: 'Rate this trip' };
  } else if (isCompleted) {
    nextStepTitle = 'This ride is complete';
    nextStepBody = 'This trip has already finished. Head back to the ride list to browse other rides.';
  }

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

      if (currentUserId) {
        setBookings((prev) => [
          ...prev,
          {
            id: `local-${trip.id}-${currentUserId}`,
            trip_id: trip.id,
            passenger_id: currentUserId,
            seats: 1,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            passenger: null,
          },
        ]);
      }

      setShowBookConfirm(false);
      setNotice('Seat reserved. You can open the trip chat now.');
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : 'Booking failed');
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
        seats_available: Math.min(prev.seats_total, prev.seats_available + (myBooking.seats ?? 1)),
        status: result.status,
      }));
      setBookings((prev) => prev.filter((booking) => booking.id !== myBooking.id));
      setNotice('Booking cancelled. You can look for another ride now.');
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Cancel failed');
    }

    setLoading(false);
  };

  const handleTripStatus = async (status: 'in_progress' | 'completed' | 'cancelled') => {
    setStatusLoading(true);
    setError(null);
    setNotice(null);

    try {
      await updateTripStatusAction(trip.id, status);
      setTrip((prev) => ({ ...prev, status }));
      setShowCancelTripConfirm(false);
      setNotice(
        status === 'in_progress'
          ? 'Trip started. Passengers can still use the chat while the ride is in progress.'
          : status === 'completed'
            ? 'Trip marked as completed.'
            : 'Trip cancelled. Passengers can no longer join.'
      );
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Failed to update trip');
    }

    setStatusLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div
          className={`px-5 pt-5 pb-4 ${
            isCancelled
              ? 'bg-red-50 dark:bg-red-900/10'
              : isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-900/10'
                : 'bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/20 dark:to-slate-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-black tabular-nums ${
                    isSoon ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {time}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    isSoon
                      ? 'text-amber-500'
                      : isPast
                        ? 'text-slate-400'
                        : 'text-sky-600 dark:text-sky-400'
                  }`}
                >
                  {date}
                </span>
              </div>
              {isSoon && (
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  Departing soon
                </p>
              )}
              {isPast && isScheduled && (
                <p className="text-xs text-slate-400 mt-0.5">This trip has already departed</p>
              )}
            </div>
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${statusConfig.color} ${statusConfig.text}`}
            >
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">From</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {trip.origin_name}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">To</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                  {trip.destination_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {trip.driver?.avatar_url ? (
              <img
                src={trip.driver.avatar_url}
                alt="Driver"
                className="w-11 h-11 rounded-full border-2 border-slate-100 dark:border-slate-700 object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-900/30 border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center text-sm font-bold shrink-0">
                D
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Driver</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {trip.driver?.display_name ?? 'Community member'}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{ratingLabel}</p>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              {t('seats_available')}
            </p>
            <p
              className={`text-xl font-black ${
                isFull
                  ? 'text-red-500 dark:text-red-400'
                  : trip.seats_available <= 2
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-sky-600 dark:text-sky-400'
              }`}
            >
              {isFull ? 'Full' : `${trip.seats_available} open`}
            </p>
          </div>
          {trip.price_cents != null && (
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                Price per seat
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {trip.price_cents === 0 ? 'Free' : `$${(trip.price_cents / 100).toFixed(2)}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Next step</p>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{nextStepTitle}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{nextStepBody}</p>
        {secondaryLink && (
          <Link
            href={secondaryLink.href}
            className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline"
          >
            {secondaryLink.label}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      {notice && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{notice}</p>
        </div>
      )}

      {isDriver && (isScheduled || isFull || isInProgress) && (
        <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 flex items-center gap-2">
          <span className="text-base">D</span>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            {isInProgress ? 'You are currently driving this trip' : 'You are the driver for this trip'}
          </p>
        </div>
      )}

      {hasBooked && !isDriver && (isScheduled || isFull || isInProgress) && (
        <div className="rounded-2xl bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">S</span>
            <p className="text-sm font-semibold text-sky-800 dark:text-sky-300">
              {isInProgress ? 'Your ride is in progress' : 'You have a seat on this ride'}
            </p>
          </div>
          <Link
            href={`/trips/${trip.id}/chat`}
            className="shrink-0 text-xs font-bold text-sky-700 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/40 px-3 py-1.5 rounded-full hover:bg-sky-200 dark:hover:bg-sky-800 transition-colors"
          >
            Open chat →
          </Link>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 p-4">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/app" className="font-bold text-sky-600 dark:text-sky-400 hover:underline">
              Back to rides
            </Link>
            {!isDriver && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowBookConfirm(false);
                }}
                className="font-bold text-slate-600 dark:text-slate-300 hover:underline"
              >
                Try again here
              </button>
            )}
          </div>
        </div>
      )}

      {canBook && (
        <>
          {!showBookConfirm ? (
            <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">Available now</p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{t('book_seat')}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Reserve 1 seat now
                    {priceLabel ? ` for ${priceLabel.replace(' per seat', '')}` : ''}. After booking, this page will show your confirmed seat and the trip chat.
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-sky-100 dark:bg-sky-900/40 px-3 py-1 text-xs font-bold text-sky-700 dark:text-sky-300">
                  {trip.seats_available} {trip.seats_available === 1 ? 'seat left' : 'seats left'}
                </div>
              </div>
              <button
                onClick={() => setShowBookConfirm(true)}
                className="w-full rounded-2xl bg-sky-600 dark:bg-sky-500 px-4 py-4 text-base font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press shadow-md"
              >
                {t('book_seat')} →
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/30 p-5 space-y-4">
              <div>
                <p className="text-sm font-bold text-sky-900 dark:text-sky-100 mb-1">{t('confirm_booking_title')}</p>
                <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                  {trip.origin_name} → {trip.destination_name}
                  {trip.price_cents != null &&
                    ` · ${trip.price_cents === 0 ? 'Free' : `$${(trip.price_cents / 100).toFixed(2)}`} per seat`}
                </p>
                <p className="text-xs text-sky-600 dark:text-sky-300 mt-2">
                  Booking here reserves your seat immediately. You will return to this page with chat access.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBook}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-sky-600 dark:bg-sky-500 px-4 py-3 font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? t('booking') : 'Confirm booking'}
                </button>
                <button
                  onClick={() => setShowBookConfirm(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {hasBooked && !isDriver && (isScheduled || isFull) && (
        <div className="space-y-2">
          <button
            onClick={handleCancelBooking}
            disabled={loading}
            className="w-full rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
          >
            {loading ? t('cancelling') : t('cancel_my_booking')}
          </button>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
            Cancel only if you no longer need this seat. You can return to the ride list after canceling.
          </p>
        </div>
      )}

      {!isDriver && isFull && !hasBooked && (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">This ride is full</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All seats have been taken. Search for another available ride.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/app" className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
              Browse other rides
            </Link>
            <Link href="/trips/new" className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:underline">
              Offer your own ride
            </Link>
          </div>
        </div>
      )}

      {!isDriver && !hasBooked && isPast && isScheduled && (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">This ride has already departed</p>
          <Link href="/app" className="inline-block text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
            Find upcoming rides
          </Link>
        </div>
      )}

      {!isDriver && isInProgress && !hasBooked && (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">This ride is already in progress</p>
          <Link href="/app" className="inline-block text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
            Browse other rides
          </Link>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 text-center space-y-3">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">This trip was cancelled</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {!isDriver && (
              <Link href="/app" className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
                Find other rides
              </Link>
            )}
            {isDriver && (
              <Link href="/trips/new" className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:underline">
                Publish another ride
              </Link>
            )}
          </div>
        </div>
      )}

      {isCompleted && !isDriver && hasBooked && (
        <Link
          href={`/trips/${trip.id}/rate`}
          className="block w-full rounded-2xl bg-amber-500 dark:bg-amber-600 px-4 py-4 text-center text-base font-bold text-white hover:bg-amber-600 dark:hover:bg-amber-700 transition-colors btn-press shadow-md"
        >
          {t('rate_trip')} →
        </Link>
      )}

      {isDriver && (isScheduled || isFull || isInProgress) && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
            {t('driver_controls')}
          </p>

          {(isScheduled || isFull) && (
            <button
              onClick={() => handleTripStatus('in_progress')}
              disabled={statusLoading}
              className="w-full rounded-2xl bg-indigo-600 dark:bg-indigo-500 px-4 py-4 text-base font-bold text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? '...' : 'Start trip'}
            </button>
          )}

          {isInProgress && (
            <button
              onClick={() => handleTripStatus('completed')}
              disabled={statusLoading}
              className="w-full rounded-2xl bg-emerald-600 dark:bg-emerald-500 px-4 py-4 text-base font-bold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50 transition-colors btn-press"
            >
              {statusLoading ? '...' : t('complete_trip')}
            </button>
          )}

          {(isScheduled || isFull) && !showCancelTripConfirm ? (
            <button
              onClick={() => setShowCancelTripConfirm(true)}
              disabled={statusLoading}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 disabled:opacity-50 transition-colors"
            >
              {t('cancel_trip')}
            </button>
          ) : (isScheduled || isFull) && (
            <div className="rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 space-y-3">
              <p className="text-sm font-bold text-red-800 dark:text-red-300">Cancel this trip?</p>
              <p className="text-xs text-red-700 dark:text-red-400">
                All passengers will be notified. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTripStatus('cancelled')}
                  disabled={statusLoading}
                  className="flex-1 rounded-xl bg-red-600 dark:bg-red-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {statusLoading ? '...' : 'Yes, cancel trip'}
                </button>
                <button
                  onClick={() => setShowCancelTripConfirm(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Keep it
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {bookings.length > 0 && (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            {t('passengers')} · {bookings.length}
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center text-xs font-bold">
                    P
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {booking.passenger?.display_name ?? 'Community member'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {booking.seats} {booking.seats === 1 ? 'seat' : 'seats'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
