import Link from 'next/link';
import { redirect } from 'next/navigation';
import CommunityBadge from '@/components/CommunityBadge';
import { getCurrentUser } from '@/lib/auth/session';
import { getServerI18n } from '@/lib/i18n/server';
import { formatLocalizedDate, formatLocalizedTime } from '@/lib/i18n/locale';
import { getCoordinationActionText } from '@/lib/i18n/runtime-text';
import { getInboxThreads } from '@/lib/services/message';

const COPY = {
  en: {
    title: 'Trip communication',
    noMessagesYet: 'No messages yet',
    noMessagesDesc: 'Conversations will appear here once you connect with drivers or passengers.',
    driverPrefix: 'Driver',
    driverSeat: 'You are driving',
    updatesOnly: 'Updates only',
    noMessagesPreview: 'No messages yet. Open the trip to coordinate.',
    restrictedPreview: 'Trip updates only. Direct messages are limited for this shared trip.',
    youLabel: 'You',
  },
  ar: {
    title: 'التواصل حول الرحلات',
    noMessagesYet: 'لا توجد رسائل بعد',
    noMessagesDesc: 'ستظهر المحادثات هنا بمجرد تواصلك مع السائقين أو الركاب.',
    driverPrefix: 'السائق',
    driverSeat: 'أنت السائق',
    updatesOnly: 'تحديثات فقط',
    noMessagesPreview: 'لا توجد رسائل بعد. افتح الرحلة لبدء التنسيق.',
    restrictedPreview: 'تحديثات الرحلة فقط. الرسائل المباشرة محدودة في هذه الرحلة المشتركة.',
    youLabel: 'أنت',
  },
  he: {
    title: 'תקשורת סביב הנסיעה',
    noMessagesYet: 'עדיין אין הודעות',
    noMessagesDesc: 'השיחות יופיעו כאן ברגע שתתחברו עם נהגים או נוסעים.',
    driverPrefix: 'נהג',
    driverSeat: 'אתם הנהג',
    updatesOnly: 'עדכונים בלבד',
    noMessagesPreview: 'עדיין אין הודעות. פתחו את הנסיעה כדי לתאם.',
    restrictedPreview: 'רק עדכוני נסיעה. הודעות ישירות מוגבלות בנסיעה המשותפת הזאת.',
    youLabel: 'אתם',
  },
} as const;

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { lang, t } = await getServerI18n();
  const copy = COPY[lang] ?? COPY.en;
  const threads = await getInboxThreads();

  if (threads.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 dark:text-sky-400 text-3xl mb-6 shadow-sm">
            💬
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {copy.noMessagesYet}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-[260px] mx-auto leading-relaxed">
            {copy.noMessagesDesc}
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
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
        {copy.title}
      </h1>

      <div className="space-y-3">
        {threads.map((thread) => {
          const isMyMessage = thread.lastMessage?.sender_id === user.id;
          const senderName = thread.lastMessage?.sender?.display_name || t('someone');
          const isCoordination = !!thread.lastMessage?.coordination_action;
          const msgTime = thread.lastMessage ? formatLocalizedTime(lang, thread.lastMessage.created_at) : '';
          const tripDateString = formatLocalizedDate(lang, thread.tripDate, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          let previewText: string = copy.noMessagesPreview;
          if (thread.lastMessage) {
            if (thread.lastMessage.coordination_action) {
              previewText = getCoordinationActionText(
                thread.lastMessage.coordination_action,
                lang,
                senderName,
                isMyMessage
              );
            } else {
              previewText = isMyMessage
                ? `${copy.youLabel}: ${thread.lastMessage.content}`
                : `${senderName}: ${thread.lastMessage.content}`;
            }
          }

          if (thread.isRestricted && thread.canSendMessages === false && !thread.lastMessage) {
            previewText = copy.restrictedPreview;
          }

          const conversationWith =
            thread.conversationWith === 'Driver' ? t('driver') : thread.conversationWith;
          const counterpartLabel: string =
            thread.currentUserRole === 'driver'
              ? copy.driverSeat
              : `${copy.driverPrefix}: ${conversationWith}`;

          return (
            <Link
              key={thread.tripId}
              href={`/trips/${thread.tripId}/chat`}
              className="block bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-sm card-hover relative group overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xl font-bold text-slate-500 overflow-hidden">
                  {thread.currentUserRole === 'driver' ? <span>👥</span> : <span>🚗</span>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <div className="min-w-0">
                      <CommunityBadge name={thread.communityName} type={thread.communityType} compact />
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate mt-1" dir="auto">
                        {thread.tripOrigin} → {thread.tripDestination}
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      {tripDateString}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-sky-600 dark:text-sky-400 truncate" dir="auto">
                      {counterpartLabel}
                    </p>
                    <div className="flex items-center gap-2">
                      {thread.isRestricted && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                          {copy.updatesOnly}
                        </span>
                      )}
                      {msgTime && (
                        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap hidden sm:inline-block">
                          {msgTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    className={`text-sm truncate ${
                      isCoordination
                        ? 'font-medium text-slate-700 dark:text-slate-300'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                    dir="auto"
                  >
                    {previewText}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
