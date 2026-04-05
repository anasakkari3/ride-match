'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { NotificationsRow } from '@/lib/types';
import { markAsRead, markAllAsRead } from './actions';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { formatLocalizedDateTime } from '@/lib/i18n/locale';
import { getLocalizedNotificationContent } from '@/lib/i18n/runtime-text';

function NotificationIcon(props: { type: NotificationsRow['type'] }) {
  if (props.type === 'message') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 10h10" />
        <path d="M7 14h6" />
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
      </svg>
    );
  }

  if (props.type === 'booking') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a1.5 1.5 0 0 0 0 3v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-3a1.5 1.5 0 0 0 0-3Z" />
        <path d="M13 7v10" />
        <path d="M9 10h.01" />
        <path d="M9 14h.01" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.27 21a2 2 0 0 0 3.46 0" />
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    </svg>
  );
}

export default function NotificationListClient({
  initialNotifications,
}: {
  initialNotifications: NotificationsRow[];
}) {
  const { t, lang } = useTranslation();
  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
      await markAsRead(id);
    } catch {
      // non-critical
    }
  };

  const handleMarkAll = async () => {
    try {
      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
      await markAllAsRead();
    } catch {
      // non-critical
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleMarkAll}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('mark_all_read')}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notification) => {
          const localized = getLocalizedNotificationContent(notification, lang);

          const cardContent = (
            <div
              className={`rounded-3xl border p-4 transition-colors ${
                notification.is_read
                  ? 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                  : 'border-sky-200 bg-white shadow-sm dark:border-sky-800 dark:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                    notification.is_read
                      ? 'bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700'
                      : 'bg-sky-50 text-sky-600 ring-1 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-800'
                  }`}
                >
                  <NotificationIcon type={notification.type} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className={`text-sm font-bold ${
                          notification.is_read
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {localized.title}
                      </h3>
                      <p
                        className={`mt-1 text-sm leading-relaxed ${
                          notification.is_read
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {localized.body}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-start gap-2">
                      {!notification.is_read && (
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-sky-500" aria-hidden="true" />
                      )}
                      {!notification.is_read && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="rounded-full p-2 text-sky-500 transition-colors hover:bg-sky-50 dark:hover:bg-sky-900/30"
                          title={t('mark_as_read')}
                          aria-label={t('mark_as_read')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {formatLocalizedDateTime(lang, notification.created_at, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          );

          if (!notification.link_url) {
            return <div key={notification.id}>{cardContent}</div>;
          }

          return (
            <Link
              key={notification.id}
              href={notification.link_url}
              className="block group"
              onClick={() => {
                if (!notification.is_read) {
                  setNotifications((prev) =>
                    prev.map((item) =>
                      item.id === notification.id ? { ...item, is_read: true } : item
                    )
                  );
                  void markAsRead(notification.id);
                }
              }}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
