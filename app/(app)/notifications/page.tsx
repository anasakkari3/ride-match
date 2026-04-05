import Link from 'next/link';
import { redirect } from 'next/navigation';
import EmptyStateCard from '@/components/EmptyStateCard';
import { getCurrentUser } from '@/lib/auth/session';
import { getServerI18n } from '@/lib/i18n/server';
import { getMyNotifications } from '@/lib/services/notification';
import NotificationListClient from './NotificationListClient';

const COPY = {
  en: {
    emptyTitle: 'No notifications',
    emptyDesc: "When you get updates about bookings or your rides, they'll appear here.",
    summaryDesc:
      'Bookings, ride changes, and chat events appear here so nothing important gets buried.',
    unreadCount: (count: number) => `${count} unread`,
    allCaughtUp: 'All caught up',
  },
  ar: {
    emptyTitle: 'لا توجد إشعارات',
    emptyDesc: 'عندما تصلك تحديثات عن الحجوزات أو رحلاتك ستظهر هنا.',
    summaryDesc:
      'تظهر هنا تحديثات الحجوزات وتغييرات الرحلات وأحداث الدردشة حتى لا يضيع عليك شيء مهم.',
    unreadCount: (count: number) => `${count} غير مقروء`,
    allCaughtUp: 'لا شيء جديد الآن',
  },
  he: {
    emptyTitle: 'אין התראות',
    emptyDesc: 'כשתקבלו עדכונים על הזמנות או על הנסיעות שלכם, הם יופיעו כאן.',
    summaryDesc:
      'כאן מופיעים עדכוני הזמנות, שינויי נסיעה ואירועי צ׳אט כדי שדבר חשוב לא ייעלם.',
    unreadCount: (count: number) => `${count} לא נקראו`,
    allCaughtUp: 'הכול מעודכן',
  },
} as const;

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { lang, t } = await getServerI18n();
  const copy = COPY[lang];
  const notifications = await getMyNotifications();
  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  if (notifications.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <EmptyStateCard
            tone="amber"
            eyebrow={t('notifications')}
            title={copy.emptyTitle}
            description={copy.emptyDesc}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.27 21a2 2 0 0 0 3.46 0" />
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              </svg>
            }
            actions={
              <>
                <Link
                  href="/app"
                  className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600"
                >
                  {t('find_a_ride')}
                </Link>
                <Link
                  href="/messages"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {t('messages')}
                </Link>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-24">
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('notifications')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {copy.summaryDesc}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              unreadCount > 0
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {unreadCount > 0 ? copy.unreadCount(unreadCount) : copy.allCaughtUp}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {notifications.length}
          </span>
        </div>
      </section>

      <NotificationListClient initialNotifications={notifications} />
    </div>
  );
}
