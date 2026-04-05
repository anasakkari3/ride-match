import Link from 'next/link';
import { redirect } from 'next/navigation';
import CommunityBadge from '@/components/CommunityBadge';
import EmptyStateCard from '@/components/EmptyStateCard';
import { getCurrentUser } from '@/lib/auth/session';
import { getServerI18n } from '@/lib/i18n/server';
import { formatLocalizedDateTime, formatSeatAvailability } from '@/lib/i18n/locale';
import { getMyTripsAsDriver, getMyBookings } from '@/lib/services/trip';
import { getTripStatusPresentationWithTranslation } from '@/lib/trips/presentation';

function PassengerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 0 3v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a1.5 1.5 0 0 0 0-3Z" />
      <path d="M13 7v10" />
    </svg>
  );
}

function DriverIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 16H9m10 0h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 9.6 16 9 16 9s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 11v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="16" r="2" />
      <path d="M9 16h6" />
      <circle cx="17" cy="16" r="2" />
    </svg>
  );
}

export default async function MyRidesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { lang, t } = await getServerI18n();
  const [myTrips, myBookings] = await Promise.all([getMyTripsAsDriver(), getMyBookings()]);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('my_rides')}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-800/60 dark:bg-sky-900/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 dark:text-sky-300">
              {t('passenger')}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
              {myBookings.length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800/60 dark:bg-emerald-900/20">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              {t('driver')}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
              {myTrips.length}
            </p>
          </div>
        </div>
      </section>

      {myBookings.length === 0 && myTrips.length === 0 ? (
        <EmptyStateCard
          eyebrow={t('my_rides')}
          title={t('no_joined_rides')}
          description={t('no_joined_rides_desc')}
          icon={<DriverIcon />}
          actions={
            <>
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
              >
                {t('find_a_ride')}
              </Link>
              <Link
                href="/trips/new"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {t('create_a_ride')}
              </Link>
            </>
          }
        />
      ) : (
        <div className="space-y-4">
          {myBookings.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                {t('passenger')}
              </h2>
              <div className="space-y-3">
                {myBookings.map((trip) => {
                  const statusUi = getTripStatusPresentationWithTranslation(trip, t);

                  return (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm card-hover relative overflow-hidden group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${statusUi.accentClassName}`}
                        >
                          <PassengerIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-between">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate" dir="auto">
                              {trip.origin_name} → {trip.destination_name}
                            </p>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusUi.chipClassName}`}>
                              {statusUi.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <CommunityBadge name={trip.community_name} type={trip.community_type} compact />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {formatLocalizedDateTime(lang, trip.departure_time, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {formatSeatAvailability(trip.seats_available, t)}
                            </span>
                          </div>
                        </div>
                        <span className="text-slate-300 dark:text-slate-600 shrink-0 group-hover:text-sky-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {myTrips.length > 0 && (
            <section className="space-y-3 pt-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                {t('driver')}
              </h2>
              <div className="space-y-3">
                {myTrips.map((trip) => {
                  const statusUi = getTripStatusPresentationWithTranslation(trip, t);

                  return (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="block rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm card-hover relative overflow-hidden group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 ${statusUi.accentClassName}`}
                        >
                          <DriverIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 justify-between">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate" dir="auto">
                              {trip.origin_name} → {trip.destination_name}
                            </p>
                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusUi.chipClassName}`}>
                              {statusUi.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <CommunityBadge name={trip.community_name} type={trip.community_type} compact />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {formatLocalizedDateTime(lang, trip.departure_time, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {formatSeatAvailability(trip.seats_available, t)}
                            </span>
                          </div>
                        </div>
                        <span className="text-slate-300 dark:text-slate-600 shrink-0 group-hover:text-emerald-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
