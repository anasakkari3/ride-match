import Link from 'next/link';
import { redirect } from 'next/navigation';
import CommunityBadge from '@/components/CommunityBadge';
import EmptyStateCard from '@/components/EmptyStateCard';
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
    pageIntro:
      'Each ride keeps its own conversation so pickup updates, cancellations, and chat stay in one place.',
    threadCount: (count: number) => `${count} active ${count === 1 ? 'thread' : 'threads'}`,
    restrictedCount: (count: number) =>
      `${count} updates-only ${count === 1 ? 'thread' : 'threads'}`,
    browseTrips: 'Browse rides',
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
    pageIntro:
      'كل رحلة تحتفظ بمحادثتها الخاصة ليبقى تنسيق الالتقاء والإلغاء والدردشة في مكان واحد.',
    threadCount: (count: number) =>
      `${count} ${count === 1 ? 'محادثة نشطة' : 'محادثات نشطة'}`,
    restrictedCount: (count: number) =>
      `${count} ${count === 1 ? 'محادثة تحديثات فقط' : 'محادثات تحديثات فقط'}`,
    browseTrips: 'تصفح الرحلات',
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
    pageIntro:
      'לכל נסיעה יש שרשור נפרד כדי שעדכוני איסוף, ביטולים וצ׳אט יישארו במקום אחד.',
    threadCount: (count: number) =>
      `${count} ${count === 1 ? 'שרשור פעיל' : 'שרשורים פעילים'}`,
    restrictedCount: (count: number) =>
      `${count} ${count === 1 ? 'שרשור עדכונים בלבד' : 'שרשורי עדכונים בלבד'}`,
    browseTrips: 'עיינו בנסיעות',
  },
} as const;

function ThreadRoleIcon(props: { currentUserRole: 'driver' | 'passenger' | string }) {
  if (props.currentUserRole === 'driver') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 16H9m10 0h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 9.6 16 9 16 9s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 11v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="16" r="2" />
      <path d="M9 16h6" />
      <circle cx="17" cy="16" r="2" />
    </svg>
  );
}

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { lang, t } = await getServerI18n();
  const copy = COPY[lang] ?? COPY.en;
  const threads = await getInboxThreads();
  const restrictedCount = threads.filter((thread) => thread.isRestricted).length;

  if (threads.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <EmptyStateCard
            tone="sky"
            eyebrow={copy.title}
            title={copy.noMessagesYet}
            description={copy.noMessagesDesc}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 10h10" />
                <path d="M7 14h6" />
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
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
                  href="/trips/my-rides"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {copy.browseTrips}
                </Link>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {copy.pageIntro}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/20 dark:text-sky-300">
            {copy.threadCount(threads.length)}
          </span>
          {restrictedCount > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              {copy.restrictedCount(restrictedCount)}
            </span>
          )}
        </div>
      </section>

      <div className="space-y-3">
        {threads.map((thread) => {
          const isMyMessage = thread.lastMessage?.sender_id === user.id;
          const senderName = thread.lastMessage?.sender?.display_name || t('someone');
          const isCoordination = !!thread.lastMessage?.coordination_action;
          const msgTime = thread.lastMessage
            ? formatLocalizedTime(lang, thread.lastMessage.created_at)
            : '';
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
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <ThreadRoleIcon currentUserRole={thread.currentUserRole} />
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
