'use client';

import { useState, useEffect, useRef } from 'react';
import { getFirebaseFirestore } from '@/lib/firebase/config';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import type { MessageWithSender } from '@/lib/types';
import { sendMessage } from './actions';
import ReportUserModal from '../ReportUserModal';

type Props = {
  tripId: string;
  initialMessages: MessageWithSender[];
  currentUserId: string;
  isFrozen: boolean;
  canSendMessages: boolean;
  isRestricted: boolean;
};

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
  const { t } = useTranslation();
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCacheRef = useRef(new Map(initialMessages.map((message) => [message.id, message])));

  useEffect(() => {
    const db = getFirebaseFirestore();
    const q = query(
      collection(db, 'messages'),
      where('trip_id', '==', tripId),
      orderBy('created_at', 'asc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextMessages: MessageWithSender[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const existing = messageCacheRef.current.get(doc.id);
          return {
            ...(data as MessageWithSender),
            id: doc.id,
            sender: existing?.sender ?? {
              display_name: (data.sender_display_name as string | null) ?? null,
              avatar_url: (data.sender_avatar_url as string | null) ?? null,
            },
          };
        });
        messageCacheRef.current = new Map(nextMessages.map((message) => [message.id, message]));
        setMessages(nextMessages);
      },
      (err) => {
        console.warn('Chat subscription error (likely security rules):', err.message);
      }
    );
    return () => unsubscribe();
  }, [tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          const timeString = new Date(hydratedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const senderName = hydratedMessage.sender?.display_name ?? 'Someone';

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
                    {isMe ? 'You' : senderName} {hydratedMessage.content}
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
                  <span>You</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setReportTarget({ id: hydratedMessage.sender_id, name: senderName })}
                    className="hover:underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
                    title={`Report ${senderName}`}
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
        <div ref={bottomRef} />
      </ul>

      {isRestricted && !isFrozen && (
        <div className="px-4 pb-2 text-xs text-amber-700 dark:text-amber-300">
          A block setting limits this shared trip thread. Structured trip updates and cancellations stay visible, but free-text messages are disabled.
        </div>
      )}

      {isFrozen && (
        <div className="px-4 pb-2 text-xs text-slate-500 dark:text-slate-400">
          Trip chat is read-only because this trip is no longer active.
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isFrozen
              ? 'Chat is closed for this trip'
              : !canSendMessages
                ? 'Free-text messaging is unavailable for this trip'
                : t('type_message')
          }
          disabled={isFrozen || loading || !canSendMessages}
          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || isFrozen || !canSendMessages}
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
