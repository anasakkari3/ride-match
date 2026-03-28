import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth/session';
import { getMyPastTrips, getUserStats } from '@/lib/services/trip';
import { getUserProfile } from '@/lib/services/user';
import { dictionaries, Lang, translate } from '@/lib/i18n/dictionaries';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries['en'];
  const t = (key: keyof typeof dictionaries['en']) => translate(dict, key);

  const profile = await getUserProfile(user.id);

  let pastTrips: Awaited<ReturnType<typeof getMyPastTrips>> = [];
  let stats = { tripsDriven: 0, tripsJoined: 0 };
  try {
    pastTrips = await getMyPastTrips();
    stats = await getUserStats(user.id);
  } catch {
    // non-critical
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('profile')}</h1>
        <Link
          href="/profile/settings"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {t('settings')}
        </Link>
      </div>

      {/* Trust Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in-up">
        {/* Rating */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm col-span-2 lg:col-span-1 flex flex-row lg:flex-col items-center gap-3 lg:gap-1 text-left lg:text-center">
          <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-lg shrink-0">⭐</div>
          <div>
            <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">
              {profile?.rating_count ? `${Number(profile.rating_avg).toFixed(1)} (${profile.rating_count})` : 'New'}
            </p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">{t('driver_rating') || 'Rating'}</p>
          </div>
        </div>
        {/* Trips Driven */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-row lg:flex-col items-center justify-start lg:justify-center gap-3 lg:gap-1 text-left lg:text-center">
          <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-lg shrink-0">🚗</div>
          <div>
            <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">{stats.tripsDriven}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Trips Driven</p>
          </div>
        </div>
        {/* Trips Joined */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-row lg:flex-col items-center justify-start lg:justify-center gap-3 lg:gap-1 text-left lg:text-center">
          <div className="flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 text-lg shrink-0">🎫</div>
          <div>
            <p className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">{stats.tripsJoined}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 dark:text-slate-400">Trips Joined</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="animate-fade-in-up stagger-1">
        <ProfileForm
          userId={user.id}
          initialDisplayName={profile?.display_name ?? ''}
          initialAvatarUrl={profile?.avatar_url ?? ''}
        />
      </div>

      {/* Past Trips / Trip History */}
      <section className="animate-fade-in-up stagger-2">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">{t('trip_history')}</h2>
        {pastTrips.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {pastTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm shrink-0 ${trip.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400'
                  }`}>
                  {trip.status === 'completed' ? '✓' : '✕'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {trip.origin_name} → {trip.destination_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(trip.departure_time).toLocaleDateString()}
                    </span>
                    <span className={`text-xs font-medium ${trip.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                      }`}>
                    {t(trip.status as keyof typeof dictionaries['en']) || trip.status}
                    </span>
                    {trip.driver && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">· {trip.driver.display_name ?? t('driver')}</span>
                    )}
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0"><polyline points="9 18 15 12 9 6" /></svg>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm text-center">
            <div className="text-3xl mb-2">🗺️</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_past_trips')}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{t('past_trips_desc')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
