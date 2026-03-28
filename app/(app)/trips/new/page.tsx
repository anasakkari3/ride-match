import { redirect } from 'next/navigation';
import { getMyCommunities, getFirstCommunity } from '@/lib/services/community';
import CreateTripForm from './CreateTripForm';

export default async function NewTripPage({
  searchParams,
}: {
  searchParams?: Promise<{ originName?: string; destinationName?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const communities = await getMyCommunities();
  const community = getFirstCommunity(communities);
  if (!community) redirect('/community');

  return (
    <div className="p-4 max-w-lg mx-auto pb-8">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400 mb-2">
          Offer a ride
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Offer a ride</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Keep it simple: route, time, seats, and optional price. Once you publish, passengers in your community can book a seat right away.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 mb-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">What riders will see</p>
        <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">Route</div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">Departure time</div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">Seats and price</div>
        </div>
      </div>
      <CreateTripForm
        communityId={community.id}
        initialOriginName={resolvedSearchParams?.originName ?? ''}
        initialDestinationName={resolvedSearchParams?.destinationName ?? ''}
      />
    </div>
  );
}
