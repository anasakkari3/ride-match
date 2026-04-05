import { redirect } from 'next/navigation';
import Link from 'next/link';
import CommunityBadge from '@/components/CommunityBadge';
import { getCurrentUser } from '@/lib/auth/session';
import { getServerI18n } from '@/lib/i18n/server';
import { formatLocalizedDateTime, formatSeatAvailability } from '@/lib/i18n/locale';
import { getMyTripsAsDriver, getMyBookings } from '@/lib/services/trip';
import { getTripStatusPresentationWithTranslation } from '@/lib/trips/presentation';

export default async function MyRidesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { lang, t } = await getServerI18n();
  const [myTrips, myBookings] = await Promise.all([getMyTripsAsDriver(), getMyBookings()]);

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('my_rides')}</h1>

      {myBookings.length === 0 && myTrips.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            📨
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t('no_joined_rides')}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto mb-8">
            {t('no_joined_rides_desc')}
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/app"
              className="w-full rounded-xl bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600 text-white px-6 py-3.5 text-sm font-bold shadow-sm transition-colors btn-press"
            >
              {t('find_a_ride')}
            </Link>
            <Link
              href="/trips/new"
              className="w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-6 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm transition-colors btn-press hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {t('create_a_ride')}
            </Link>
          </div>
        </div>
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
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shrink-0 ${statusUi.accentClassName}`}>
                          🎫
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
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
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shrink-0 ${statusUi.accentClassName}`}>
                          🚗
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
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
