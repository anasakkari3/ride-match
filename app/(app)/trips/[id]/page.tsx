import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getTripById } from '@/lib/services/trip';
import { getBookingsForTrip } from '@/lib/services/booking';
import { getMyCommunities } from '@/lib/services/community';
import { trackEvent } from '@/lib/services/analytics';
import { canViewTrip, canViewTripRoster } from '@/lib/auth/permissions';
import { dictionaries, Lang, translate } from '@/lib/i18n/dictionaries';
import TripDetailClient from './TripDetailClient';
import { getTripCommunicationAccess } from '@/lib/services/message';

export default async function TripDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries['en'];
  const t = (key: keyof typeof dictionaries['en']) => translate(dict, key);

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

  // Enforce same-community restriction
  let userInCommunity = false;
  try {
    const communities = await getMyCommunities();
    userInCommunity = canViewTrip(user?.id, trip, communities);
  } catch {
    // ignore
  }

  if (!userInCommunity) {
    notFound(); // Redirect immediately if viewing outside community
  }

  // Determine participant authorization (driver or confirmed passenger)
  let authorizedBookings: typeof bookings = [];
  if (canViewTripRoster(user?.id, trip, bookings ?? [])) {
      authorizedBookings = bookings;
  }

  try {
    await trackEvent('trip_opened', { userId: user?.id, payload: { trip_id: id } });
  } catch {
    // Analytics event - non-critical, ignore errors
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
          href="/app"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><path d="m15 18-6-6 6-6" /></svg>
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
