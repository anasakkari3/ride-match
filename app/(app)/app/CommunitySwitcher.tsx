import Link from 'next/link';
import CommunityBadge from '@/components/CommunityBadge';
import type { CommunityInfo } from '@/lib/types';

type CommunitySwitcherItem = CommunityInfo & {
  href: string;
};

type Props = {
  communities: CommunitySwitcherItem[];
  selectedCommunityId?: string | null;
  allHref?: string | null;
  showAllOption?: boolean;
  title?: string;
  description?: string;
  allLabel?: string;
};

export default function CommunitySwitcher({
  communities,
  selectedCommunityId,
  allHref = '/app',
  showAllOption = false,
  title = 'Community scope',
  description,
  allLabel = 'All joined',
}: Props) {
  return (
    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {title}
          </p>
          {description && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
              {description}
            </p>
          )}
        </div>
        {selectedCommunityId && (
          <CommunityBadge
            name={communities.find((community) => community.id === selectedCommunityId)?.name}
            type={communities.find((community) => community.id === selectedCommunityId)?.type}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {showAllOption && (
          <Link
            href={allHref ?? '/app'}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
              !selectedCommunityId
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {allLabel}
          </Link>
        )}

        {communities.map((community) => (
          <Link
            key={community.id}
            href={community.href}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
              selectedCommunityId === community.id
                ? 'bg-sky-600 text-white dark:bg-sky-500'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {community.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
