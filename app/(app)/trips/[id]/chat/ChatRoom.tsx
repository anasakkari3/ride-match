'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
import EmptyStateCard from '@/components/EmptyStateCard';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { MessageWithSender } from '@/lib/types';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import { getTripMembershipDocId } from '@/lib/trips/membership';
import { sendMessage } from './actions';
import ReportUserModal from '../ReportUserModal';
import { formatLocalizedTime } from '@/lib/i18n/locale';
import { getCoordinationActionText } from '@/lib/i18n/runtime-text';

type Props = {
  tripId: string;
  initialMessages: MessageWithSender[];
  currentUserId: string;
  isFrozen: boolean;
  canSendMessages: boolean;
  isRestricted: boolean;
};

const COPY = {
  en: {
    reportTitle: (name: string) => `Report ${name}`,
    restricted:
      'A block setting limits this shared trip thread. Structured trip updates and cancellations stay visible, but free-text messages are disabled.',
    frozen: 'Trip chat is read-only because this trip is no longer active.',
    chatClosed: 'Chat is closed for this trip',
    messagingUnavailable: 'Free-text messaging is unavailable for this trip',
    you: 'You',
    sendFailed: 'Could not send that message right now.',
    emptyTitle: 'No trip messages yet',
    emptyDescription:
      'The first message, pickup update, or cancellation notice will appear here once someone posts it.',
    emptyRestrictedDescription:
      'This trip currently uses structured updates. Those updates and any cancellations will appear here first.',
  },
  ar: {
    reportTitle: (name: string) => `الإبلاغ عن ${name}`,
    restricted:
      'إعداد الحظر يقيّد هذه المحادثة المشتركة. ما زالت تحديثات الرحلة والإلغاءات المهيكلة ظاهرة، لكن الرسائل الحرة متوقفة.',
    frozen: 'دردشة الرحلة للقراءة فقط لأن هذه الرحلة لم تعد نشطة.',
    chatClosed: 'تم إغلاق الدردشة لهذه الرحلة',
    messagingUnavailable: 'الرسائل الحرة غير متاحة لهذه الرحلة',
    you: 'أنت',
    sendFailed: 'لم نتمكن من إرسال الرسالة. حاول مرة أخرى.',
    emptyTitle: 'لا توجد رسائل حتى الآن.',
    emptyDescription:
      'ستظهر أول رسالة أو تحديث الالتقاء أو إشعار الإلغاء هنا بمجرد إرسالها.',
    emptyRestrictedDescription:
      'تستخدم هذه الرحلة حاليًا التحديثات المهيكلة. ستظهر هذه التحديثات وأي إلغاء هنا أولًا.',
  },
  he: {
    reportTitle: (name: string) => `דיווח על ${name}`,
    restricted:
      'הגדרת חסימה מגבילה את השרשור המשותף הזה. עדכוני נסיעה וביטולים מובנים עדיין נשארים גלויים, אבל הודעות חופשיות מושבתות.',
    frozen: 'צ׳אט הנסיעה הוא לקריאה בלבד כי הנסיעה הזו כבר לא פעילה.',
    chatClosed: 'הצ׳אט סגור לנסיעה הזאת',
    messagingUnavailable: 'הודעות חופשיות אינן זמינות לנסיעה הזאת',
    you: 'אתם',
    sendFailed: 'לא הצלחנו לשלוח את ההודעה הזאת כרגע.',
    emptyTitle: 'עדיין אין הודעות לנסיעה',
    emptyDescription:
      'ההודעה הראשונה, עדכון האיסוף או הודעת הביטול יופיעו כאן ברגע שמישהו ישלח אותם.',
    emptyRestrictedDescription:
      'הנסיעה הזאת משתמשת עכשיו בעדכונים מובנים. העדכונים האלה וכל ביטול יופיעו כאן תחילה.',
  },
} as const;

function hydrateMessage(raw: Record<string, unknown>): MessageWithSender {
  return {
    ...(raw as MessageWithSender),
    sender: {
      display_name:
        (raw.sender as MessageWithSender['sender'])?.display_name ??
        (raw.sender_display_name as string | null) ??
        null,
      avatar_url:
        (raw.sender as MessageWithSender['sender'])?.avatar_url ??
        (raw.sender_avatar_url as string | null) ??
        null,
    },
  };
}

function getAsyncErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export default function ChatRoom({
  tripId,
  initialMessages,
  currentUserId,
  isFrozen,
  canSendMessages,
  isRestricted,
}: Props) {
  const { t, lang } = useTranslation();
  const copy = COPY[lang];
  const router = useRouter();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  // The server already authorized this user before rendering this page
  // (see chat/page.tsx → getTripCommunicationAccess). The client listeners
  // below are only allowed to react to *explicit revocation* events while
  // the user is sitting in the chat — they must NEVER eject the user based
  // on initial absence, transient permission errors, or auth-state races.
  // The previous implementation redirected on `!exists()` and on every
  // `permission-denied`, which caused users to be kicked out 2-3 seconds
  // after entering chat (race with Firebase Auth client init / legacy trips
  // missing a backfilled membership doc).
  const hasObservedMembershipRef = useRef(false);

  useEffect(() => {
    hasObservedMembershipRef.current = false;
    let isMounted = true;
    let isRefreshingMessages = false;
    let isRefreshingMembership = false;
    const db = getFirebaseFirestore();
    const messagesQuery = query(
      collection(db, 'messages'),
      where('trip_id', '==', tripId),
      orderBy('created_at', 'asc')
    );
    const membershipRef = doc(db, 'trip_memberships', getTripMembershipDocId(tripId, currentUserId));

    const refreshMessages = async () => {
      if (isRefreshingMessages) return;
      isRefreshingMessages = true;
      try {
        const snapshot = await getDocs(messagesQuery);
        if (!isMounted) return;

        setMessages(
          snapshot.docs.map((messageDoc) =>
            hydrateMessage({
              id: messageDoc.id,
              ...messageDoc.data(),
            } as Record<string, unknown>)
          )
        );
      } catch (refreshError) {
        // Server already validated read access. Don't redirect on transient
        // refresh errors - they're often auth-state races or short-lived
        // network/permission blips that recover on the next reconnect.
        console.warn('Chat refresh failed:', getAsyncErrorMessage(refreshError));
      } finally {
        isRefreshingMessages = false;
      }
    };

    const refreshMembership = async () => {
      if (isRefreshingMembership) return;
      isRefreshingMembership = true;
      try {
        const snapshot = await getDoc(membershipRef);
        if (!isMounted) return;

        if (!snapshot.exists()) {
          // First refresh with no doc: likely a legacy trip without a backfilled
          // membership doc, or the doc hasn't propagated yet. Trust the server
          // check and stay put. Only treat disappearance as revocation if we
          // had previously observed the doc as existing in this session.
          if (hasObservedMembershipRef.current) {
            router.replace('/messages');
          }
          return;
        }

        hasObservedMembershipRef.current = true;
        const membershipStatus = snapshot.data().status as string | undefined;
        if (membershipStatus === 'cancelled') {
          router.replace('/messages');
        }
      } catch (refreshError) {
        // Same reasoning as above: never redirect on refresh errors. The
        // explicit cancelled-status branch above is the only legitimate
        // in-session revocation signal.
        console.warn('Trip membership refresh failed:', getAsyncErrorMessage(refreshError));
      } finally {
        isRefreshingMembership = false;
      }
    };

    const refreshChatState = () => {
      void refreshMessages();
      void refreshMembership();
    };

    refreshChatState();
    const refreshInterval = window.setInterval(refreshChatState, 3000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshInterval);
    };
  }, [currentUserId, router, tripId]);

  useEffect(() => {
    const messageList = document.getElementById('trip-chat-bottom');
    messageList?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading || !canSendMessages) return;
    setLoading(true);
    setSendError(null);
    try {
      await sendMessage(tripId, content);
      setInput('');
    } catch (sendErr) {
      const errMsg = sendErr instanceof Error ? sendErr.message.toLowerCase() : '';
      if (lang === 'ar') {
        if (errMsg.includes('blocked')) {
          setSendError('لا يمكنك إرسال رسائل لأن أحد المشاركين في الرحلة محظور.');
        } else if (errMsg.includes('read-only') || errMsg.includes('read_only')) {
          setSendError('هذه الرحلة في وضع القراءة فقط ولا يمكن إرسال رسائل الآن.');
        } else if (errMsg.includes('unauthorized')) {
          setSendError('ليست لديك صلاحية لإرسال رسائل في هذه الرحلة.');
        } else {
          setSendError(copy.sendFailed);
        }
      } else {
        setSendError(copy.sendFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ul className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <li className="pt-6">
            <EmptyStateCard
              eyebrow={copy.chatClosed}
              title={copy.emptyTitle}
              description={
                isRestricted ? copy.emptyRestrictedDescription : copy.emptyDescription
              }
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 10h10" />
                  <path d="M7 14h6" />
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
                </svg>
              }
              className="mx-auto max-w-md"
            />
          </li>
        ) : (
          messages.map((message) => {
            const hydratedMessage = hydrateMessage(message as unknown as Record<string, unknown>);
            const isMe = hydratedMessage.sender_id === currentUserId;
            const timeString = formatLocalizedTime(lang, hydratedMessage.created_at);
            const senderName = hydratedMessage.sender?.display_name ?? t('someone');

            if (hydratedMessage.coordination_action) {
              const isCancellation =
                hydratedMessage.coordination_action === 'DRIVER_CANCELED_TRIP' ||
                hydratedMessage.coordination_action === 'PASSENGER_CANCELED_SEAT';

              return (
                <li key={hydratedMessage.id} className="flex justify-center my-6">
                  <div
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 border ${
                      isCancellation
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">
                      {getCoordinationActionText(
                        hydratedMessage.coordination_action,
                        lang,
                        senderName,
                        isMe
                      )}
                    </span>
                    <span className="text-[10px] opacity-70 ml-1">{timeString}</span>
                  </div>
                </li>
              );
            }

            return (
              <li key={hydratedMessage.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="text-[10px] text-slate-400 font-medium mb-1 px-1 flex items-center gap-1">
                  {isMe ? (
                    <span>{copy.you}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setReportTarget({ id: hydratedMessage.sender_id, name: senderName })
                      }
                      className="hover:underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
                      title={copy.reportTitle(senderName)}
                    >
                      {senderName}
                    </button>
                  )}
                  <span>|</span>
                  <span>{timeString}</span>
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    isMe
                      ? 'bg-sky-600 dark:bg-sky-500 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-none'
                  }`}
                >
                  {hydratedMessage.content}
                </div>
              </li>
            );
          })
        )}
        <div id="trip-chat-bottom" />
      </ul>

      {isRestricted && !isFrozen && (
        <div className="px-4 pb-2 text-xs text-amber-700 dark:text-amber-300">
          {copy.restricted}
        </div>
      )}

      {isFrozen && (
        <div className="px-4 pb-2 text-xs text-slate-500 dark:text-slate-400">
          {copy.frozen}
        </div>
      )}

      {sendError && (
        <div className="px-4 pb-2 text-xs font-medium text-red-600 dark:text-red-400">
          {sendError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (sendError) setSendError(null);
          }}
          data-testid="chat-message-input"
          placeholder={
            isFrozen
              ? copy.chatClosed
              : !canSendMessages
                ? copy.messagingUnavailable
                : t('type_message')
          }
          disabled={isFrozen || loading || !canSendMessages}
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || isFrozen || !canSendMessages}
          data-testid="chat-send-button"
          className="rounded-xl bg-sky-600 dark:bg-sky-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('send')}
        </button>
      </form>

      {reportTarget && (
        <ReportUserModal
          isOpen={true}
          onClose={() => setReportTarget(null)}
          tripId={tripId}
          reportedUserId={reportTarget.id}
          reportedUserName={reportTarget.name}
        />
      )}
    </div>
  );
}
