'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { createTrip } from './actions';

type Props = {
  communityId: string;
  initialOriginName?: string;
  initialDestinationName?: string;
};

function getMinDatetime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5, 0, 0);

  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}`;
}

export default function CreateTripForm({
  communityId,
  initialOriginName = '',
  initialDestinationName = '',
}: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [originName, setOriginName] = useState(initialOriginName);
  const [destinationName, setDestinationName] = useState(initialDestinationName);
  const [departureTime, setDepartureTime] = useState('');
  const [seats, setSeats] = useState(3);
  const [isFree, setIsFree] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [touched, setTouched] = useState({ origin: false, destination: false, time: false });

  const minDatetime = getMinDatetime();
  const originError = touched.origin && !originName.trim() ? 'Required' : null;
  const destinationError = touched.destination && !destinationName.trim() ? 'Required' : null;
  const timeError = touched.time && !departureTime ? 'Required' : null;

  const routePreview =
    originName.trim() && destinationName.trim()
      ? `${originName.trim()} → ${destinationName.trim()}`
      : 'Your route will appear here';
  const pricePreview = isFree
    ? 'Free'
    : priceInput
      ? `$${Number(priceInput || '0').toFixed(2)} per seat`
      : 'No price shown yet';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ origin: true, destination: true, time: true });

    if (!originName.trim() || !destinationName.trim() || !departureTime) {
      setError('Please fill in all required fields.');
      return;
    }

    const departureDate = new Date(departureTime);
    if (departureDate <= new Date()) {
      setError(t('time_in_future'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const priceCents = isFree
        ? 0
        : priceInput
          ? Math.round(parseFloat(priceInput) * 100)
          : null;

      const trip = await createTrip({
        communityId,
        originLat: 0,
        originLng: 0,
        originName: originName.trim(),
        destinationLat: 0,
        destinationLng: 0,
        destinationName: destinationName.trim(),
        departureTime: departureDate.toISOString(),
        seatsTotal: seats,
        priceCents,
      });

      setSuccess(true);
      router.replace(`/trips/${trip.id}?created=1`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create trip. Please try again.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xl font-bold mx-auto">
          OK
        </div>
        <p className="text-base font-bold text-slate-900 dark:text-slate-100">Ride published</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Opening your trip now...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Before you publish</p>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <li>Passengers will see your route, departure time, seats, and optional price.</li>
          <li>Required fields are marked with an asterisk.</li>
          <li>After submit, you will land on the trip page to review or manage the ride.</li>
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-4 pt-4 pb-3">
          <label
            htmlFor="origin"
            className="block text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-1"
          >
            Starting point <span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            id="origin"
            type="text"
            value={originName}
            onChange={(event) => setOriginName(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, origin: true }))}
            placeholder="e.g. Tel Aviv Central Station"
            className="w-full bg-transparent text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
            autoComplete="off"
          />
          {originError && <p className="text-[10px] text-red-500 mt-1">{originError}</p>}
        </div>

        <div className="flex items-center px-4">
          <div className="flex flex-col items-center mr-3">
            <div className="w-2 h-2 rounded-full bg-sky-500" />
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 my-0.5" />
            <div className="w-2 h-2 rounded-full border-2 border-emerald-500" />
          </div>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="px-4 pt-3 pb-4">
          <label
            htmlFor="destination"
            className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1"
          >
            Destination <span className="text-red-400 ml-0.5">*</span>
          </label>
          <input
            id="destination"
            type="text"
            value={destinationName}
            onChange={(event) => setDestinationName(event.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, destination: true }))}
            placeholder="e.g. Jerusalem Bus Station"
            className="w-full bg-transparent text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none"
            autoComplete="off"
          />
          {destinationError && <p className="text-[10px] text-red-500 mt-1">{destinationError}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <label htmlFor="departure" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Departure time <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Earliest time is 5 minutes from now.
          </p>
        </div>
        <input
          id="departure"
          type="datetime-local"
          value={departureTime}
          min={minDatetime}
          onChange={(event) => setDepartureTime(event.target.value)}
          onBlur={() => setTouched((prev) => ({ ...prev, time: true }))}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
        />
        {timeError && <p className="text-xs text-red-500">{timeError}</p>}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Seats for passengers
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Choose how many passengers can join you.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSeats((prev) => Math.max(1, prev - 1))}
            disabled={seats <= 1}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-lg font-bold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            -
          </button>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 w-8 text-center tabular-nums">
            {seats}
          </span>
          <button
            type="button"
            onClick={() => setSeats((prev) => Math.min(8, prev + 1))}
            disabled={seats >= 8}
            className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-lg font-bold flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
          >
            +
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
            {seats === 1 ? '1 seat' : `${seats} seats`}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Price per seat
              <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Optional</span>
            </label>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Leave blank if you want riders to ask before discussing cost.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsFree((prev) => !prev);
              setPriceInput('');
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
              isFree
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:bg-slate-50'
            }`}
          >
            {isFree ? 'Free ride' : 'Mark as free'}
          </button>
        </div>

        {!isFree && (
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-colors"
            />
          </div>
        )}

        {isFree && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Passengers will see this ride as free.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Preview</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{routePreview}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">
            {departureTime ? new Date(departureTime).toLocaleString() : 'Choose a departure time'}
          </span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">
            {seats} {seats === 1 ? 'seat' : 'seats'}
          </span>
          <span className="rounded-full bg-white dark:bg-slate-800 px-3 py-1">{pricePreview}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 px-4 py-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-sky-600 dark:bg-sky-500 px-4 py-4 text-base font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors btn-press shadow-md"
        >
          {loading ? 'Publishing your ride...' : 'Publish this ride'}
        </button>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          After publishing, you will land on the trip page to manage seats and see the next step.
        </p>
        <Link
          href="/app"
          className="block text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Back to rides
        </Link>
      </div>
    </form>
  );
}
