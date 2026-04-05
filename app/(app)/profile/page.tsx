import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getMyPastTrips, getUserStats } from '@/lib/services/trip';
import { getMyProfileFull } from '@/lib/services/user';
import ProfileForm from './ProfileForm';
import ProfileCompletenessIndicator from './ProfileCompletenessIndicator';
import { DriverTrustSummary } from '@/app/(app)/DriverTrustSummary';
import { formatLocalizedDate } from '@/lib/i18n/locale';
import { getServerI18n } from '@/lib/i18n/server';
import { getCurrentUser } from '@/lib/auth/session';
import { getTripStatusPresentationWithTranslation } from '@/lib/trips/presentation';

const COPY = {
  en: {
    trustTitle: 'Trip history and trust',
    completedDrives: 'completed drives',
    completedJoined: 'completed rides joined',
    trustHelper: 'Received rating shows the feedback this person has received from other trip participants across completed trips. Completed drives count finished trips this person has driven. Profile setup is shown separately and does not change either number.',
    tripHistoryEmptyIcon: 'clock',
  },
  ar: {
    trustTitle: 'سجل الرحلات والثقة',
    completedDrives: 'رحلات مكتملة كسائق',
    completedJoined: 'رحلات مكتملة انضممت إليها',
    trustHelper: 'يعرض التقييم المستلم الانطباع العام الذي تلقاه هذا الشخص من بقية المشاركين في الرحلات المكتملة. أما عدد الرحلات المكتملة كسائق فيمثل الرحلات التي قادها بالفعل. إعداد الملف الشخصي معروض بشكل منفصل ولا يغيّر أيًا من الرقمين.',
    tripHistoryEmptyIcon: 'clock',
  },
  he: {
    trustTitle: 'היסטוריית נסיעות ואמון',
    completedDrives: 'נסיעות שהושלמו כנהג',
    completedJoined: 'נסיעות שהצטרפתם אליהן והושלמו',
    trustHelper: 'הדירוג שהתקבל מציג את המשוב הכללי שהאדם הזה קיבל ממשתתפים אחרים בנסיעות שהושלמו. מספר הנסיעות שהושלמו כנהג מייצג נסיעות שהוא נהג בהן בפועל. הגדרת הפרופיל מוצגת בנפרד ואינה משנה אף אחד מהמספרים.',
    tripHistoryEmptyIcon: 'clock',
  },
} as const;

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { lang, t } = await getServerI18n();
  const copy = COPY[lang];
  const profile = await getMyProfileFull(user.id);

  let pastTrips: Awaited<ReturnType<typeof getMyPastTrips>> = [];
  let stats = { completedDrives: 0, completedJoins: 0 };
  try {
    pastTrips = await getMyPastTrips();
    stats = await getUserStats(user.id);
  } catch {
    // non-critical
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('profile')}</h1>
        <Link
          href="/profile/settings"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {t('settings')}
        </Link>
      </div>

      <div className="animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-5 shadow-elevated dark:border-slate-800 dark:bg-slate-900/80">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{copy.trustTitle}</p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <DriverTrustSummary
            ratingAvg={profile?.rating_avg}
            ratingCount={profile?.rating_count}
            completedDrives={stats.completedDrives}
            variant="full"
          />
          <div className="ml-auto flex gap-2">
            <div className="flex min-w-[64px] flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800/60 dark:bg-emerald-900/20">
              <span className="text-sm font-black leading-none tabular-nums text-emerald-700 dark:text-emerald-300">{stats.completedDrives}</span>
              <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-slate-400 dark:text-slate-500">{copy.completedDrives}</span>
            </div>
            <div className="flex min-w-[64px] flex-col items-center justify-center rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 dark:border-sky-800/60 dark:bg-sky-900/20">
              <span className="text-sm font-black leading-none tabular-nums text-sky-700 dark:text-sky-300">{stats.completedJoins}</span>
              <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-slate-400 dark:text-slate-500">{copy.completedJoined}</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          {copy.trustHelper}
        </p>
      </div>

      <div className="animate-fade-in-up stagger-1">
        <ProfileCompletenessIndicator
          hasDisplayName={!!profile?.display_name}
          hasPhone={!!profile?.phone}
          hasCityOrArea={!!profile?.city_or_area}
          hasAge={typeof profile?.age === 'number' && profile.age > 0}
          hasGender={!!profile?.gender}
          hasIsDriver={typeof profile?.is_driver === 'boolean'}
          showDriverLicense={profile?.is_driver === true}
          hasDriverLicense={profile?.has_driver_license === true}
        />
      </div>

      <div className="animate-fade-in-up stagger-2">
        <ProfileForm
          userId={user.id}
          initialDisplayName={profile?.display_name ?? ''}
          initialAvatarUrl={profile?.avatar_url ?? ''}
          initialPhone={profile?.phone ?? ''}
          initialCityOrArea={profile?.city_or_area ?? ''}
          initialAge={profile?.age ?? null}
          initialGender={profile?.gender ?? ''}
          initialIsDriver={profile?.is_driver ?? null}
          initialHasDriverLicense={profile?.has_driver_license ?? null}
          initialGenderPreference={profile?.gender_preference ?? ''}
          initialLicenseImageStatus={profile?.license_image_status ?? 'not_provided'}
          initialInsuranceImageStatus={profile?.insurance_image_status ?? 'not_provided'}
          initialLicenseDeclared={profile?.license_declared ?? false}
          initialInsuranceDeclared={profile?.insurance_declared ?? false}
        />
      </div>

      <section className="animate-fade-in-up stagger-3">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('trip_history')}</h2>
        {pastTrips.length > 0 ? (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-700 dark:bg-slate-900">
            {pastTrips.map((trip) => (
              (() => {
                const statusUi = getTripStatusPresentationWithTranslation(trip, (key) => t(key));
                return (
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm ${
                        trip.status === 'completed'
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {trip.status === 'completed' ? 'OK' : 'X'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100" dir="auto">
                        {trip.origin_name} → {trip.destination_name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatLocalizedDate(lang, trip.departure_time)}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            trip.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-500 dark:text-red-400'
                          }`}
                        >
                          {statusUi.label}
                        </span>
                        {trip.driver && (
                          <span className="text-xs text-slate-400 dark:text-slate-500">| {trip.driver.display_name ?? t('driver')}</span>
                        )}
                      </div>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-slate-400 rtl:rotate-180">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                );
              })()
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('no_past_trips')}</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t('past_trips_desc')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
