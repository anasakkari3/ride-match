'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NotificationsRow } from '@/lib/types';
import { markAsRead, markAllAsRead } from './actions';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { formatLocalizedDateTime } from '@/lib/i18n/locale';
import { getLocalizedNotificationContent } from '@/lib/i18n/runtime-text';

export default function NotificationListClient({ initialNotifications }: { initialNotifications: NotificationsRow[] }) {
  const { t, lang } = useTranslation();
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      await markAsRead(id);
    } catch {
      // non-critical
    }
  };

  const handleMarkAll = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      await markAllAsRead();
    } catch {
      // non-critical
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button onClick={handleMarkAll} className="text-sm text-sky-600 dark:text-sky-400 font-medium hover:underline transition-colors">
            {t('mark_all_read')}
          </button>
        </div>
      )}
      <div className="space-y-3">
        {notifications.map(n => {
          const icon = n.type === 'message' ? '💬' : n.type === 'booking' ? '🎫' : '⚠️';
          const localized = getLocalizedNotificationContent(n, lang);

          const cardContent = (
            <div className={`p-4 rounded-2xl border ${n.is_read ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-white dark:bg-slate-800 border-sky-200 dark:border-sky-800 shadow-sm'} flex items-start gap-4 transition-colors`}>
              <div className="text-2xl shrink-0 leading-none pt-1">{icon}</div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold truncate ${n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>{localized.title}</h3>
                <p className={`text-sm mt-1 leading-relaxed ${n.is_read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{localized.body}</p>
                <p className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 mt-2 tracking-wider">
                  {formatLocalizedDateTime(lang, n.created_at, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.is_read && (
                <button onClick={(e) => handleMarkAsRead(n.id, e)} className="shrink-0 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-900/30 text-sky-500 transition-colors" title={t('mark_as_read')}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </button>
              )}
            </div>
          );

          return n.link_url ? (
            <Link
              key={n.id}
              href={n.link_url}
              className="block group"
              onClick={() => {
                if (!n.is_read) {
                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                  markAsRead(n.id);
                }
              }}
            >
              {cardContent}
            </Link>
          ) : (
            <div key={n.id}>{cardContent}</div>
          );
        })}
      </div>
    </div>
  );
}
