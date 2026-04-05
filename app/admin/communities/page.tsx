import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireCompletedProfile } from '@/lib/auth/onboarding';
import CommunityBadge from '@/components/CommunityBadge';
import { getServerLang } from '@/lib/i18n/server';
import { formatLocalizedDateTime } from '@/lib/i18n/locale';
import {
  getAdminCommunities,
  getPendingJoinRequestQueue,
  getPendingReportsForCommunity,
} from '@/lib/services/admin';
import {
  approveJoinRequestAction,
  markReportResolvedAction,
  markReportReviewedAction,
  rejectJoinRequestAction,
} from './actions';

const COPY = {
  en: {
    eyebrow: 'Admin',
    title: 'Community operations',
    description: 'Review join requests and pending reports for communities where you are an admin.',
    analytics: 'Analytics',
    scope: 'Community scope',
    chooseCommunity: 'Choose a community',
    chooseDescription: 'Moderation and request handling are scoped to one community at a time.',
    pendingJoinRequests: 'Pending join requests',
    noJoinRequests: 'No pending requests for this community.',
    requestedAt: 'Requested',
    decisionPlaceholder: 'Optional approval or rejection note',
    approve: 'Approve',
    reject: 'Reject',
    pendingReports: 'Pending reports',
    pendingReportsDescription:
      'Review reports before escalating or following up outside the product.',
    noReports: 'No pending reports for this community.',
    reporter: 'Reporter',
    reportedUser: 'Reported user',
    submittedAt: 'Submitted',
    openTrip: 'Open trip',
    reviewPlaceholder: 'Optional moderation note',
    markReviewed: 'Mark reviewed',
    resolve: 'Resolve',
    reportReasons: {
      'Inappropriate behavior or harassment': 'Inappropriate behavior or harassment',
      'Unsafe driving': 'Unsafe driving',
      'Vehicle did not match or brought unagreed guests':
        'Vehicle did not match or brought unagreed guests',
      'No-show': 'No-show',
      Other: 'Other',
    } as Record<string, string>,
  },
  ar: {
    eyebrow: 'المشرف',
    title: 'عمليات المجتمع',
    description: 'راجع طلبات الانضمام والبلاغات المعلقة للمجتمعات التي لديك فيها صلاحية مشرف.',
    analytics: 'التحليلات',
    scope: 'نطاق المجتمع',
    chooseCommunity: 'اختر مجتمعًا',
    chooseDescription: 'الإشراف ومعالجة الطلبات مرتبطان بمجتمع واحد في كل مرة.',
    pendingJoinRequests: 'طلبات الانضمام المعلقة',
    noJoinRequests: 'لا توجد طلبات معلقة لهذا المجتمع.',
    requestedAt: 'تم الطلب',
    decisionPlaceholder: 'ملاحظة اختيارية للموافقة أو الرفض',
    approve: 'موافقة',
    reject: 'رفض',
    pendingReports: 'البلاغات المعلقة',
    pendingReportsDescription: 'راجع البلاغات قبل التصعيد أو المتابعة خارج المنتج.',
    noReports: 'لا توجد بلاغات معلقة لهذا المجتمع.',
    reporter: 'المبلّغ',
    reportedUser: 'المستخدم المبلّغ عنه',
    submittedAt: 'تم الإرسال',
    openTrip: 'فتح الرحلة',
    reviewPlaceholder: 'ملاحظة إشرافية اختيارية',
    markReviewed: 'تحديد كمُراجع',
    resolve: 'حل البلاغ',
    reportReasons: {
      'Inappropriate behavior or harassment': 'سلوك غير لائق أو مضايقة',
      'Unsafe driving': 'قيادة غير آمنة',
      'Vehicle did not match or brought unagreed guests': 'المركبة لا تطابق الوصف أو كان هناك ركاب غير متفق عليهم',
      'No-show': 'عدم الحضور',
      Other: 'أخرى',
    } as Record<string, string>,
  },
  he: {
    eyebrow: 'ניהול',
    title: 'תפעול קהילה',
    description: 'בדקו בקשות הצטרפות ודיווחים ממתינים עבור קהילות שבהן אתם מנהלים.',
    analytics: 'אנליטיקות',
    scope: 'היקף קהילה',
    chooseCommunity: 'בחרו קהילה',
    chooseDescription: 'ניהול ובדיקת בקשות מתבצעים עבור קהילה אחת בכל פעם.',
    pendingJoinRequests: 'בקשות הצטרפות ממתינות',
    noJoinRequests: 'אין בקשות ממתינות לקהילה הזאת.',
    requestedAt: 'התבקש',
    decisionPlaceholder: 'הערה אופציונלית לאישור או דחייה',
    approve: 'אשר',
    reject: 'דחה',
    pendingReports: 'דיווחים ממתינים',
    pendingReportsDescription: 'בדקו דיווחים לפני הסלמה או מעקב מחוץ למוצר.',
    noReports: 'אין דיווחים ממתינים לקהילה הזאת.',
    reporter: 'מדווח',
    reportedUser: 'המשתמש שדווח',
    submittedAt: 'נשלח',
    openTrip: 'פתח נסיעה',
    reviewPlaceholder: 'הערת ניהול אופציונלית',
    markReviewed: 'סמן כנבדק',
    resolve: 'פתור',
    reportReasons: {
      'Inappropriate behavior or harassment': 'התנהגות לא הולמת או הטרדה',
      'Unsafe driving': 'נהיגה לא בטוחה',
      'Vehicle did not match or brought unagreed guests': 'הרכב לא התאים או צורפו אורחים שלא סוכמו',
      'No-show': 'אי-הגעה',
      Other: 'אחר',
    } as Record<string, string>,
  },
};

export default async function AdminCommunitiesPage(props: {
  searchParams?: Promise<{ community_id?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const nextPath = searchParams?.community_id
    ? `/admin/communities?community_id=${encodeURIComponent(searchParams.community_id)}`
    : '/admin/communities';

  await requireCompletedProfile(nextPath);

  const lang = await getServerLang();
  const copy = COPY[lang] ?? COPY.en;

  const adminCommunities = await getAdminCommunities();
  if (adminCommunities.length === 0) redirect('/app');

  const selectedCommunityId = searchParams?.community_id;
  const selectedCommunity =
    adminCommunities.find((community) => community.id === selectedCommunityId) ??
    (adminCommunities.length === 1 ? adminCommunities[0] : null);

  const joinRequests = selectedCommunity
    ? await getPendingJoinRequestQueue(selectedCommunity.id)
    : [];
  const pendingReports = selectedCommunity
    ? await getPendingReportsForCommunity(selectedCommunity.id)
    : [];

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400">
            {copy.eyebrow}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
            {copy.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
            {copy.description}
          </p>
        </div>
        <Link
          href={
            selectedCommunity
              ? `/admin/analytics?community_id=${encodeURIComponent(selectedCommunity.id)}`
              : '/admin/analytics'
          }
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
        >
          {copy.analytics}
        </Link>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {copy.scope}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {adminCommunities.map((community) => (
            <Link
              key={community.id}
              href={`/admin/communities?community_id=${encodeURIComponent(community.id)}`}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                selectedCommunity?.id === community.id
                  ? 'bg-sky-600 text-white dark:bg-sky-500'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {community.name}
            </Link>
          ))}
        </div>
      </section>

      {!selectedCommunity && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/40 dark:bg-amber-900/20">
          <h2 className="text-base font-bold text-amber-900 dark:text-amber-300">
            {copy.chooseCommunity}
          </h2>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
            {copy.chooseDescription}
          </p>
        </div>
      )}

      {selectedCommunity && (
        <>
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CommunityBadge name={selectedCommunity.name} type={selectedCommunity.type} />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-3">
                  {copy.pendingJoinRequests}
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {joinRequests.length}
              </span>
            </div>

            {joinRequests.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">{copy.noJoinRequests}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    data-testid={`join-request-${request.user_id}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100" dir="auto">
                          {request.user_display_name ?? request.user_id}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {copy.requestedAt} {formatLocalizedDateTime(lang, request.created_at)}
                        </p>
                        {request.request_note && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2" dir="auto">
                            {request.request_note}
                          </p>
                        )}
                      </div>
                      <form className="w-full max-w-sm space-y-2">
                        <input type="hidden" name="communityId" value={selectedCommunity.id} />
                        <input type="hidden" name="requesterId" value={request.user_id} />
                        <textarea
                          name="decisionNote"
                          rows={2}
                          placeholder={copy.decisionPlaceholder}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            formAction={approveJoinRequestAction}
                            data-testid={`approve-request-${request.user_id}`}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                          >
                            {copy.approve}
                          </button>
                          <button
                            type="submit"
                            formAction={rejectJoinRequestAction}
                            data-testid={`reject-request-${request.user_id}`}
                            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            {copy.reject}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {copy.pendingReports}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {copy.pendingReportsDescription}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                {pendingReports.length}
              </span>
            </div>

            {pendingReports.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">{copy.noReports}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {pendingReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    data-testid={`report-item-${report.id}`}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {copy.reportReasons[report.reason] ?? report.reason}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" dir="auto">
                            {copy.reporter}: {report.reporter_display_name ?? report.reporter_id}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400" dir="auto">
                            {copy.reportedUser}: {report.reported_display_name ?? report.reported_id}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {copy.submittedAt} {formatLocalizedDateTime(lang, report.created_at)}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <Link href={`/trips/${report.trip_id}`} className="font-semibold text-sky-600 hover:underline dark:text-sky-400">
                              {copy.openTrip}
                            </Link>
                          </p>
                        </div>
                        <form className="w-full max-w-sm space-y-2">
                          <input type="hidden" name="reportId" value={report.id} />
                          <input type="hidden" name="communityId" value={selectedCommunity.id} />
                          <textarea
                            name="reviewNote"
                            rows={3}
                            placeholder={copy.reviewPlaceholder}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              formAction={markReportReviewedAction}
                              data-testid={`mark-report-reviewed-${report.id}`}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              {copy.markReviewed}
                            </button>
                            <button
                              type="submit"
                              formAction={markReportResolvedAction}
                              data-testid={`mark-report-resolved-${report.id}`}
                              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                            >
                              {copy.resolve}
                            </button>
                          </div>
                        </form>
                      </div>

                      {report.context && (
                        <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:bg-slate-950/60 dark:text-slate-300" dir="auto">
                          {report.context}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
