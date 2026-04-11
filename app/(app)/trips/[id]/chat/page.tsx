import { notFound, redirect } from 'next/navigation';
import { getTripById } from '@/lib/services/trip';
import { getTripMessages, getTripCommunicationAccess } from '@/lib/services/message';
import ChatRoom from './ChatRoom';
import { getCurrentUser } from '@/lib/auth/session';
import { getEffectiveTripStatus } from '@/lib/trips/lifecycle';
import { logWarn } from '@/lib/observability/logger';
import Link from 'next/link';
import CommunityBadge from '@/components/CommunityBadge';
import { formatLocalizedDate, formatLocalizedTime } from '@/lib/i18n/locale';
import { getServerI18n } from '@/lib/i18n/server';

const COPY = {
  en: {
    backToTrip: 'Back to trip details',
    driverRole: 'You are the driver',
    passengerRole: 'You are a passenger',
    frozen: (status: string) => `This trip is ${status}`,
  },
  ar: {
    backToTrip: 'العودة إلى تفاصيل الرحلة',
    driverRole: 'أنت السائق',
    passengerRole: 'أنت راكب',
    frozen: (status: string) => `هذه الرحلة ${status}`,
  },
  he: {
    backToTrip: 'חזרה לפרטי הנסיעה',
    driverRole: 'אתם הנהג',
    passengerRole: 'אתם נוסע',
    frozen: (status: string) => `הנסיעה הזאת ${status}`,
  },
} as const;

export default async function TripChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { lang, t } = await getServerI18n();
  const copy = COPY[lang];
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Ask the access check to also backfill the trip_membership doc on first
  // entry. The chat client uses that doc as its in-session revocation signal,
  // so a missing doc would otherwise eject legacy-trip users.
  const communicationAccess = await getTripCommunicationAccess(id, {
    backfillMembership: true,
  });
  if (!communicationAccess.canView) {
    logWarn('chat.page_access_denied', {
      tripId: id,
      userId: user.id,
    });
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
  const dateString = formatLocalizedDate(lang, trip.departure_time, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeString = formatLocalizedTime(lang, trip.departure_time);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50">
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm z-10 flex items-center gap-3">
        <Link
          href={`/trips/${trip.id}`}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label={copy.backToTrip}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <CommunityBadge name={trip.community_name} type={trip.community_type} compact />
          <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate" dir="auto">
            {trip.origin_name} → {trip.destination_name}
          </h1>
          <div className="flex items-center gap-2 text-xs font-medium mt-1">
            <span className="text-sky-600 dark:text-sky-400">{dateString} • {timeString}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-500 dark:text-slate-400">
              {isDriver ? copy.driverRole : copy.passengerRole}
            </span>
          </div>
        </div>
      </div>

      {isFrozen && (
        <div className="shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest text-center py-2 border-b border-slate-200 dark:border-slate-700">
          {copy.frozen(t(effectiveStatus))}
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
