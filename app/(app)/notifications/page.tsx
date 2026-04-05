import Link from 'next/link';
import { getMyNotifications } from '@/lib/services/notification';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import NotificationListClient from './NotificationListClient';
import { getServerI18n } from '@/lib/i18n/server';

const COPY = {
  en: {
    emptyTitle: 'No notifications',
    emptyDesc: "When you get updates about bookings or your rides, they'll appear here.",
  },
  ar: {
    emptyTitle: 'لا توجد إشعارات',
    emptyDesc: 'عندما تصلك تحديثات عن الحجوزات أو رحلاتك ستظهر هنا.',
  },
  he: {
    emptyTitle: 'אין התראות',
    emptyDesc: 'כשתקבלו עדכונים על הזמנות או על הנסיעות שלכם, הם יופיעו כאן.',
  },
} as const;

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { lang, t } = await getServerI18n();
  const copy = COPY[lang];
  const notifications = await getMyNotifications();

  if (notifications.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 text-3xl mb-6 shadow-sm">
            🔔
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {copy.emptyTitle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-[260px] mx-auto leading-relaxed">
            {copy.emptyDesc}
          </p>
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 dark:bg-sky-500 px-6 py-3 font-bold text-white shadow-sm hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press"
          >
            {t('find_a_ride')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('notifications')}</h1>
      <NotificationListClient initialNotifications={notifications} />
    </div>
  );
}
