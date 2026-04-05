import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireCompletedProfile } from '@/lib/auth/onboarding';
import CommunityBadge from '@/components/CommunityBadge';
import { getServerLang } from '@/lib/i18n/server';
import { formatLocalizedDate } from '@/lib/i18n/locale';
import {
  getAdminCommunities,
  getDailyTripsAndBookings,
  getFunnelMetrics,
} from '@/lib/services/admin';

const COPY = {
  en: {
    title: 'Admin analytics',
    description: 'Analytics are scoped to a single community at a time.',
    ops: 'Community ops',
    scope: 'Community scope',
    chooseCommunity: 'Choose a community',
    chooseDescription: 'Analytics access is enforced per community admin role.',
    funnel: 'Funnel events',
    daily: 'Daily trips and bookings by community',
    event: 'Event',
    count: 'Count',
    date: 'Date',
    community: 'Community',
    trips: 'Trips',
    bookings: 'Bookings',
    events: {
      auth_success: 'Successful sign-ins',
      trip_created: 'Trips created',
      trip_search: 'Trip searches',
      trip_results_shown: 'Search results shown',
      trip_opened: 'Trip detail opened',
      booking_attempted: 'Booking attempts',
      booking_confirmed: 'Confirmed bookings',
      trip_completed: 'Trips completed',
      rating_submitted: 'Ratings submitted',
    } as Record<string, string>,
  },
  ar: {
    title: 'تحليلات المشرف',
    description: 'يتم عرض التحليلات ضمن نطاق مجتمع واحد في كل مرة.',
    ops: 'عمليات المجتمع',
    scope: 'نطاق المجتمع',
    chooseCommunity: 'اختر مجتمعًا',
    chooseDescription: 'الوصول إلى التحليلات مرتبط بدور المشرف داخل كل مجتمع.',
    funnel: 'أحداث المسار',
    daily: 'الرحلات والحجوزات اليومية حسب المجتمع',
    event: 'الحدث',
    count: 'العدد',
    date: 'التاريخ',
    community: 'المجتمع',
    trips: 'الرحلات',
    bookings: 'الحجوزات',
    events: {
      auth_success: 'تسجيلات الدخول الناجحة',
      trip_created: 'الرحلات المنشورة',
      trip_search: 'عمليات البحث عن رحلة',
      trip_results_shown: 'نتائج البحث المعروضة',
      trip_opened: 'فتح تفاصيل الرحلة',
      booking_attempted: 'محاولات الحجز',
      booking_confirmed: 'الحجوزات المؤكدة',
      trip_completed: 'الرحلات المكتملة',
      rating_submitted: 'التقييمات المرسلة',
    } as Record<string, string>,
  },
  he: {
    title: 'אנליטיקות מנהל',
    description: 'האנליטיקות מוצגות עבור קהילה אחת בכל פעם.',
    ops: 'תפעול קהילה',
    scope: 'היקף קהילה',
    chooseCommunity: 'בחרו קהילה',
    chooseDescription: 'הגישה לאנליטיקות נאכפת לפי תפקיד מנהל בכל קהילה.',
    funnel: 'אירועי משפך',
    daily: 'נסיעות והזמנות יומיות לפי קהילה',
    event: 'אירוע',
    count: 'כמות',
    date: 'תאריך',
    community: 'קהילה',
    trips: 'נסיעות',
    bookings: 'הזמנות',
    events: {
      auth_success: 'כניסות מוצלחות',
      trip_created: 'נסיעות שנוצרו',
      trip_search: 'חיפושי נסיעות',
      trip_results_shown: 'תוצאות חיפוש שהוצגו',
      trip_opened: 'פתיחת פרטי נסיעה',
      booking_attempted: 'ניסיונות הזמנה',
      booking_confirmed: 'הזמנות שאושרו',
      trip_completed: 'נסיעות שהושלמו',
      rating_submitted: 'דירוגים שנשלחו',
    } as Record<string, string>,
  },
};

export default async function AdminAnalyticsPage(props: {
  searchParams?: Promise<{ community_id?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const nextPath = searchParams?.community_id
    ? `/admin/analytics?community_id=${encodeURIComponent(searchParams.community_id)}`
    : '/admin/analytics';

  await requireCompletedProfile(nextPath);

  const lang = await getServerLang();
  const copy = COPY[lang] ?? COPY.en;

  const adminCommunities = await getAdminCommunities();
  if (adminCommunities.length === 0) redirect('/app');

  const selectedCommunityId = searchParams?.community_id;
  const selectedCommunity =
    adminCommunities.find((community) => community.id === selectedCommunityId) ??
    (adminCommunities.length === 1 ? adminCommunities[0] : null);

  const [funnel, daily] = selectedCommunity
    ? await Promise.all([
        getFunnelMetrics(selectedCommunity.id),
        getDailyTripsAndBookings(selectedCommunity.id),
      ])
    : [[], []];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{copy.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{copy.description}</p>
        </div>
        <Link
          href={
            selectedCommunity
              ? `/admin/communities?community_id=${encodeURIComponent(selectedCommunity.id)}`
              : '/admin/communities'
          }
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          {copy.ops}
        </Link>
      </div>

      <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {copy.scope}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {adminCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/admin/analytics?community_id=${encodeURIComponent(community.id)}`}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                selectedCommunity?.id === community.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {community.name}
            </Link>
          ))}
        </div>
      </section>

      {!selectedCommunity && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
          <h2 className="text-base font-bold text-amber-900">{copy.chooseCommunity}</h2>
          <p className="mt-2 text-sm text-amber-700">{copy.chooseDescription}</p>
        </div>
      )}

      {selectedCommunity && (
        <div className="mb-6">
          <CommunityBadge name={selectedCommunity.name} type={selectedCommunity.type} />
        </div>
      )}

      {selectedCommunity && (
        <section className="mb-8">
          <h2 className="text-lg font-medium text-slate-800 mb-3">{copy.funnel}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left px-4 py-2 text-slate-700">{copy.event}</th>
                  <th className="text-right px-4 py-2 text-slate-700">{copy.count}</th>
                </tr>
              </thead>
              <tbody>
                {funnel.map((row) => (
                  <tr key={row.event_name} className="border-t border-slate-200">
                    <td className="px-4 py-2 text-slate-900">
                      {copy.events[row.event_name] ?? row.event_name}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-700">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedCommunity && (
        <section>
          <h2 className="text-lg font-medium text-slate-800 mb-3">{copy.daily}</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left px-4 py-2 text-slate-700">{copy.date}</th>
                  <th className="text-left px-4 py-2 text-slate-700">{copy.community}</th>
                  <th className="text-right px-4 py-2 text-slate-700">{copy.trips}</th>
                  <th className="text-right px-4 py-2 text-slate-700">{copy.bookings}</th>
                </tr>
              </thead>
              <tbody>
                {daily.map((row) => (
                  <tr key={`${row.date}-${row.community_id}`} className="border-t border-slate-200">
                    <td className="px-4 py-2 text-slate-900">
                      {formatLocalizedDate(lang, row.date, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2 text-slate-900">{row.community_name ?? row.community_id}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{row.trips}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{row.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
