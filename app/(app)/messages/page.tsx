import Link from 'next/link';
import { dictionaries, Lang, translate } from '@/lib/i18n/dictionaries';
import { cookies } from 'next/headers';
import { getInboxThreads } from '@/lib/services/message';
import { getCurrentUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries.en;
  const t = (key: keyof typeof dictionaries.en) => translate(dict, key);

  const threads = await getInboxThreads();

  if (threads.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 dark:text-sky-400 text-3xl mb-6 shadow-sm">
            💬
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t('messages_empty_title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-[260px] mx-auto leading-relaxed">
            {t('messages_empty_desc')}
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Trip communication</h1>

      <div className="space-y-3">
        {threads.map((thread) => {
          const isMyMessage = thread.lastMessage?.sender_id === user.id;
          const senderName = thread.lastMessage?.sender?.display_name || 'Someone';
          const isCoordination = !!thread.lastMessage?.coordination_action;
          const msgTime = thread.lastMessage
            ? new Date(thread.lastMessage.created_at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })
            : '';
          const tripDateString = new Date(thread.tripDate).toLocaleDateString(lang, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });

          let previewText = 'No messages yet. Open the trip to coordinate.';
          if (thread.lastMessage) {
            previewText = isMyMessage
              ? `You: ${thread.lastMessage.content}`
              : `${senderName}: ${thread.lastMessage.content}`;

            if (isCoordination) {
              previewText = `${isMyMessage ? 'You' : senderName} ${thread.lastMessage.content}`;
            }
          }

          if (thread.isRestricted && thread.canSendMessages === false && !thread.lastMessage) {
            previewText = 'Trip updates only. Direct messages are limited for this shared trip.';
          }

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
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {thread.tripTitle}
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                      {tripDateString}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-sky-600 dark:text-sky-400 truncate">
                      {thread.currentUserRole === 'driver' ? 'You are driving' : `Driver: ${thread.conversationWith}`}
                    </p>
                    <div className="flex items-center gap-2">
                      {thread.isRestricted && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                          Updates only
                        </span>
                      )}
                      {msgTime && (
                        <span className="text-xs font-semibold text-slate-400 whitespace-nowrap hidden sm:inline-block">
                          {msgTime}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`text-sm truncate ${isCoordination ? 'font-medium text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
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
