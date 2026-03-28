import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getTripById } from '@/lib/services/trip';
import { getTripMessages, canUserAccessChat } from '@/lib/services/message';
import { dictionaries, Lang, translate } from '@/lib/i18n/dictionaries';
import ChatRoom from './ChatRoom';

export default async function TripChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries['en'];
  const t = (key: keyof typeof dictionaries['en']) => translate(dict, key);

  const isAuthorized = await canUserAccessChat(id);
  if (!isAuthorized) {
    redirect('/messages');
  }

  let trip;
  let messages;
  try {
    trip = await getTripById(id);
    messages = await getTripMessages(id);
  } catch {
    notFound();
  }
  if (!trip) notFound();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-lg mx-auto">
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h1 className="font-medium text-slate-900 dark:text-white truncate">
          {t('chat_title')} {trip.origin_name} → {trip.destination_name}
        </h1>
      </div>
      <ChatRoom tripId={id} initialMessages={messages ?? []} />
    </div>
  );
}
