import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMyCommunities } from '@/lib/services/community';
import CommunityBadge from '@/components/CommunityBadge';
import CreateTripForm from './CreateTripForm';
import { getServerI18n } from '@/lib/i18n/server';

function buildNewTripHref(input: {
  communityId: string;
  originName?: string;
  destinationName?: string;
}) {
  const params = new URLSearchParams();
  params.set('community_id', input.communityId);
  if (input.originName) params.set('originName', input.originName);
  if (input.destinationName) params.set('destinationName', input.destinationName);
  return `/trips/new?${params.toString()}`;
}

const COPY = {
  en: {
    eyebrow: 'Offer a ride',
    chooseCommunity: 'Choose a community',
    chooseCommunityDesc: 'New trips belong to exactly one community. Pick where this ride should live before you publish it.',
    backToRides: 'Back to rides',
    title: 'Offer a ride',
    heroDesc: (name: string) => `Keep it simple: route, time, seats, and optional price. This trip will only appear inside ${name}.`,
    ridersSee: 'What riders will see',
    route: 'Route',
    departure: 'Departure time',
    seatsPrice: 'Seats and price',
  },
  ar: {
    eyebrow: 'اعرض رحلة',
    chooseCommunity: 'اختر مجتمعًا',
    chooseCommunityDesc: 'كل رحلة جديدة تنتمي إلى مجتمع واحد فقط. اختر أين ستظهر هذه الرحلة قبل نشرها.',
    backToRides: 'العودة إلى الرحلات',
    title: 'اعرض رحلة',
    heroDesc: (name: string) => `الأمر بسيط: المسار والوقت والمقاعد والسعر الاختياري. ستظهر هذه الرحلة داخل ${name} فقط.`,
    ridersSee: 'ما الذي سيراه الركاب',
    route: 'المسار',
    departure: 'وقت الانطلاق',
    seatsPrice: 'المقاعد والسعر',
  },
  he: {
    eyebrow: 'הציעו נסיעה',
    chooseCommunity: 'בחרו קהילה',
    chooseCommunityDesc: 'כל נסיעה חדשה שייכת לקהילה אחת בלבד. בחרו איפה הנסיעה הזו צריכה להופיע לפני הפרסום.',
    backToRides: 'חזרה לנסיעות',
    title: 'הציעו נסיעה',
    heroDesc: (name: string) => `שמרו על זה פשוט: מסלול, שעה, מושבים ומחיר אופציונלי. הנסיעה הזו תופיע רק בתוך ${name}.`,
    ridersSee: 'מה הנוסעים יראו',
    route: 'מסלול',
    departure: 'שעת יציאה',
    seatsPrice: 'מושבים ומחיר',
  },
} as const;

export default async function NewTripPage({
  searchParams,
}: {
  searchParams?: Promise<{ community_id?: string; originName?: string; destinationName?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { lang } = await getServerI18n();
  const copy = COPY[lang];
  const memberships = await getMyCommunities();
  const joinedCommunities = memberships.map((membership) => ({
    ...membership.community,
    role: membership.role === 'admin' ? 'admin' : 'member',
  }));

  if (joinedCommunities.length === 0) {
    redirect('/community');
  }

  const requestedCommunityId = resolvedSearchParams?.community_id;
  const selectedCommunity =
    joinedCommunities.find((community) => community.id === requestedCommunityId) ??
    (joinedCommunities.length === 1 ? joinedCommunities[0] : null);

  if (!selectedCommunity) {
    return (
      <div className="p-4 max-w-lg mx-auto pb-8 space-y-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400 mb-2">
            {copy.eyebrow}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{copy.chooseCommunity}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {copy.chooseCommunityDesc}
          </p>
        </div>

        <div className="space-y-3">
          {joinedCommunities.map((community) => (
            <Link
              key={community.id}
              href={buildNewTripHref({
                communityId: community.id,
                originName: resolvedSearchParams?.originName,
                destinationName: resolvedSearchParams?.destinationName,
              })}
              className="block rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CommunityBadge name={community.name} type={community.type} />
                  {community.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
                      {community.description}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {community.role}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/app"
          className="block text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          {copy.backToRides}
        </Link>
      </div>
    );
  }

  const backHref = `/app?community_id=${encodeURIComponent(selectedCommunity.id)}`;

  return (
    <div className="p-4 max-w-lg mx-auto pb-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400 mb-2">
          {copy.eyebrow}
        </p>
        <CommunityBadge name={selectedCommunity.name} type={selectedCommunity.type} />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">{copy.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {copy.heroDesc(selectedCommunity.name)}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{copy.ridersSee}</p>
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">{copy.route}</div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">{copy.departure}</div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">{copy.seatsPrice}</div>
        </div>
      </div>
      <CreateTripForm
        communityId={selectedCommunity.id}
        communityName={selectedCommunity.name}
        communityType={selectedCommunity.type}
        initialOriginName={resolvedSearchParams?.originName ?? ''}
        initialDestinationName={resolvedSearchParams?.destinationName ?? ''}
        backHref={backHref}
      />
    </div>
  );
}
