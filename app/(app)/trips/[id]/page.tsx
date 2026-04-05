import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getTripById } from '@/lib/services/trip';
import { getBookingsForTrip } from '@/lib/services/booking';
import { trackEvent } from '@/lib/services/analytics';
import { canViewTripRoster, isCommunityMember } from '@/lib/auth/permissions';
import TripDetailClient from './TripDetailClient';
import { getTripCommunicationAccess } from '@/lib/services/message';
import { getServerI18n } from '@/lib/i18n/server';

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { t } = await getServerI18n();

  const user = await getCurrentUser();
  let trip;
  let bookings;
  let communicationAccess = {
    canView: false,
    canSendMessages: false,
    canSendCoordination: false,
    isRestricted: false,
  };
  try {
    trip = await getTripById(id);
    bookings = await getBookingsForTrip(id);
    communicationAccess = await getTripCommunicationAccess(id);
  } catch {
    notFound();
  }
  if (!trip) notFound();

  const userInCommunity = await isCommunityMember(user?.id, trip.community_id);
  if (!userInCommunity) {
    notFound();
  }

  let authorizedBookings: typeof bookings = [];
  if (canViewTripRoster(user?.id, trip, bookings ?? [])) {
    authorizedBookings = bookings;
  }

  try {
    await trackEvent('trip_opened', { userId: user?.id, payload: { trip_id: id } });
  } catch {
    // non-critical
  }

  return (
    <div className="p-4 max-w-lg mx-auto pb-8">
      <TripDetailClient
        trip={trip}
        bookings={authorizedBookings ?? []}
        currentUserId={user?.id ?? null}
        communicationAccess={communicationAccess}
        wasJustCreated={resolvedSearchParams?.created === '1'}
      />
      <div className="mt-4">
        <Link
          href={`/app?community_id=${encodeURIComponent(trip.community_id)}`}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m15 18-6-6 6-6" /></svg>
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
