import Link from 'next/link';
import { dictionaries, Lang, translate } from '@/lib/i18n/dictionaries';
import { cookies } from 'next/headers';
import { getMyNotifications } from '@/lib/services/notification';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import NotificationListClient from './NotificationListClient';

export default async function NotificationsPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const cookieStore = await cookies();
    const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
    const lang: Lang = langValue || 'en';
    const dict = dictionaries[lang] || dictionaries['en'];
    const t = (key: keyof typeof dictionaries['en']) => translate(dict, key);

    const notifications = await getMyNotifications();

    if (notifications.length === 0) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 text-3xl mb-6 shadow-sm">
                        🔔
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                        {t('notifications_empty_title') || 'No notifications yet'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-[260px] mx-auto leading-relaxed">
                        {t('notifications_empty_desc') || "When you get updates about bookings or your rides, they'll appear here."}
                    </p>
                    <Link
                        href="/app"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 dark:bg-sky-500 px-6 py-3 font-bold text-white shadow-sm hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press"
                    >
                        {t('find_a_ride') || 'Find a ride'}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto space-y-6 pb-24">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('notifications') || 'Notifications'}</h1>
            <NotificationListClient initialNotifications={notifications} />
        </div>
    );
}
