import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTripById } from '@/lib/services/trip';
import { getTripMessages, getTripCommunicationAccess } from '@/lib/services/message';
import { Lang } from '@/lib/i18n/dictionaries';
import ChatRoom from './ChatRoom';
import { getCurrentUser } from '@/lib/auth/session';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';
import Link from 'next/link';

export default async function TripChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const communicationAccess = await getTripCommunicationAccess(id);
  if (!communicationAccess.canView) {
    redirect('/messages');
  }

  let trip;
  let messages;
  try {
    trip = await getTripById(id);
    messages = await getTripMessages(id);
  } catch {
    notFound();
  }
  if (!trip) notFound();

  const isDriver = trip.driver_id === user.id;
  const effectiveStatus = getEffectiveTripStatus(trip);
  const isFrozen = effectiveStatus === 'completed' || effectiveStatus === 'cancelled';
  const departureDate = new Date(trip.departure_time);
  const dateString = departureDate.toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeString = departureDate.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50">
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm z-10 flex items-center gap-3">
        <Link
          href={`/trips/${trip.id}`}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Back to trip details"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
            {trip.origin_name} to {trip.destination_name}
          </h1>
          <div className="flex items-center gap-2 text-xs font-medium mt-1">
            <span className="text-sky-600 dark:text-sky-400">{dateString} at {timeString}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-500 dark:text-slate-400">
              {isDriver ? 'You are the driver' : 'You are a passenger'}
            </span>
          </div>
        </div>
      </div>

      {isFrozen && (
        <div className="shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest text-center py-2 border-b border-slate-200 dark:border-slate-700">
          This trip is {effectiveStatus}
        </div>
      )}

      <ChatRoom
        tripId={id}
        currentUserId={user.id}
        initialMessages={messages ?? []}
        isFrozen={isFrozen}
        canSendMessages={communicationAccess.canSendMessages && !isFrozen}
        isRestricted={communicationAccess.isRestricted}
      />
    </div>
  );
}
