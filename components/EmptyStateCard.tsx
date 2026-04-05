'use client';

import type { ReactNode } from 'react';

type Tone = 'neutral' | 'sky' | 'amber';

type Props = {
  eyebrow?: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone?: Tone;
  actions?: ReactNode;
  className?: string;
};

const TONE_STYLES: Record<Tone, { shell: string; icon: string; eyebrow: string }> = {
  neutral: {
    shell:
      'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/50',
    icon:
      'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    eyebrow: 'text-slate-500 dark:text-slate-400',
  },
  sky: {
    shell:
      'border-sky-200 bg-sky-50/80 dark:border-sky-800 dark:bg-sky-900/20',
    icon:
      'bg-white text-sky-600 ring-1 ring-sky-200 dark:bg-slate-900 dark:text-sky-300 dark:ring-sky-800',
    eyebrow: 'text-sky-600 dark:text-sky-300',
  },
  amber: {
    shell:
      'border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-900/20',
    icon:
      'bg-white text-amber-600 ring-1 ring-amber-200 dark:bg-slate-900 dark:text-amber-300 dark:ring-amber-800',
    eyebrow: 'text-amber-700 dark:text-amber-300',
  },
};

export default function EmptyStateCard({
  eyebrow,
  title,
  description,
  icon,
  tone = 'neutral',
  actions,
  className = '',
}: Props) {
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={`rounded-3xl border p-6 text-center shadow-sm sm:p-7 ${styles.shell} ${className}`.trim()}
    >
      <div
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm ${styles.icon}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      {eyebrow ? (
        <p className={`mt-4 text-[11px] font-bold uppercase tracking-[0.18em] ${styles.eyebrow}`}>
          {eyebrow}
        </p>
      ) : null}

      <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mx-auto mt-2 max-w-[28rem] text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {description}
      </p>

      {actions ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
