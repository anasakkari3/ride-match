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
  const toneClassName = isPublic
    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
    : 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-800';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold ${toneClassName} ${
        compact ? 'text-[10px]' : 'text-xs'
      }`}
    >
      <span className="truncate max-w-[180px]">{name}</span>
      <span className="opacity-70">
        {isPublic ? t('public_label') : t('verified_label')}
      </span>
    </span>
  );
}
