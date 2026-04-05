'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
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
    restricted: 'A block setting limits this shared trip thread. Structured trip updates and cancellations stay visible, but free-text messages are disabled.',
    frozen: 'Trip chat is read-only because this trip is no longer active.',
    chatClosed: 'Chat is closed for this trip',
    messagingUnavailable: 'Free-text messaging is unavailable for this trip',
    you: 'You',
  },
  ar: {
    reportTitle: (name: string) => `الإبلاغ عن ${name}`,
    restricted: 'إعداد الحظر يقيّد هذه المحادثة المشتركة. ما زالت تحديثات الرحلة والإلغاءات المهيكلة ظاهرة، لكن الرسائل الحرة متوقفة.',
    frozen: 'دردشة الرحلة للقراءة فقط لأن هذه الرحلة لم تعد نشطة.',
    chatClosed: 'تم إغلاق الدردشة لهذه الرحلة',
    messagingUnavailable: 'الرسائل الحرة غير متاحة لهذه الرحلة',
    you: 'أنت',
  },
  he: {
    reportTitle: (name: string) => `דיווח על ${name}`,
    restricted: 'הגדרת חסימה מגבילה את השרשור המשותף הזה. עדכוני נסיעה וביטולים מובנים עדיין נשארים גלויים, אבל הודעות חופשיות מושבתות.',
    frozen: 'צ׳אט הנסיעה הוא לקריאה בלבד כי הנסיעה הזו כבר לא פעילה.',
    chatClosed: 'הצ׳אט סגור לנסיעה הזאת',
    messagingUnavailable: 'הודעות חופשיות אינן זמינות לנסיעה הזאת',
    you: 'אתם',
  },
} as const;

function hydrateMessage(raw: Record<string, unknown>): MessageWithSender {
  return {
    ...(raw as MessageWithSender),
    sender: {
      display_name: (raw.sender as MessageWithSender['sender'])?.display_name ?? (raw.sender_display_name as string | null) ?? null,
      avatar_url: (raw.sender as MessageWithSender['sender'])?.avatar_url ?? (raw.sender_avatar_url as string | null) ?? null,
    },
  };
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
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const db = getFirebaseFirestore();
    const messagesQuery = query(
      collection(db, 'messages'),
      where('trip_id', '==', tripId),
      orderBy('created_at', 'asc')
    );
    const membershipRef = doc(db, 'trip_memberships', getTripMembershipDocId(tripId, currentUserId));

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((messageDoc) => hydrateMessage({
            id: messageDoc.id,
            ...messageDoc.data(),
          } as Record<string, unknown>))
        );
      },
      (snapshotError) => {
        if (snapshotError.code === 'permission-denied') {
          router.replace('/messages');
          return;
        }
        console.warn('Chat subscription failed:', snapshotError.message);
      }
    );

    const unsubscribeMembership = onSnapshot(
      membershipRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          router.replace('/messages');
          return;
        }

        const membershipStatus = snapshot.data().status as string | undefined;
        if (membershipStatus === 'cancelled') {
          router.replace('/messages');
        }
      },
      (snapshotError) => {
        if (snapshotError.code === 'permission-denied') {
          router.replace('/messages');
          return;
        }

        console.warn('Trip membership subscription failed:', snapshotError.message);
      }
    );

    return () => {
      unsubscribeMessages();
      unsubscribeMembership();
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
    try {
      await sendMessage(tripId, content);
      setInput('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ul className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
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
                <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 border ${
                  isCancellation
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  <span className="text-xs font-semibold">
                    {getCoordinationActionText(hydratedMessage.coordination_action, lang, senderName, isMe)}
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
                    onClick={() => setReportTarget({ id: hydratedMessage.sender_id, name: senderName })}
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
        })}
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

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
