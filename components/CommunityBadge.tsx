'use client';

import type { CommunityType } from '@/lib/types';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

type Props = {
  name?: string | null;
  type?: CommunityType | null;
  compact?: boolean;
};

export default function CommunityBadge({ name, type, compact = false }: Props) {
  const { t } = useTranslation();

  if (!name) return null;

  const isPublic = type === 'public';
  const visibilityLabel = isPublic ? t('public_label') : t('verified_label');
  const toneClassName = isPublic
    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
    : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800';

  return (
    <span
      title={`${name} - ${visibilityLabel}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold ${toneClassName} ${
        compact ? 'text-[10px]' : 'text-xs'
      }`}
    >
      <span className="opacity-80" aria-hidden="true">
        {isPublic ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a14.5 14.5 0 0 1 0 20" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3 7 4v5c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V7l7-4Z" />
            <path d="m9.5 12 1.7 1.7 3.3-3.7" />
          </svg>
        )}
      </span>
      <span className="truncate max-w-[140px] sm:max-w-[180px]">{name}</span>
      <span className="opacity-70">
        {visibilityLabel}
      </span>
    </span>
  );
}
