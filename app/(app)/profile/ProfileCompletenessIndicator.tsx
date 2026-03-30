import Link from 'next/link';

type Props = {
  hasDisplayName: boolean;
  hasAvatar: boolean;
  hasPhone: boolean;
};

export default function ProfileCompletenessIndicator({
  hasDisplayName,
  hasAvatar,
  hasPhone,
}: Props) {
  const fields = [
    { label: 'Display name', complete: hasDisplayName },
    { label: 'Profile photo', complete: hasAvatar },
    { label: 'Phone number', complete: hasPhone },
  ];

  const missingFields = fields.filter((field) => !field.complete);

  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
      role="region"
      aria-label="Profile details available for coordination"
    >
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          Profile details
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {missingFields.length === 0 ? 'Contact details are ready for coordination' : 'Add the basics people use to identify you'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          This is only profile setup. Ratings and completed trips are shown separately.
        </p>
      </div>

      <ul className="space-y-1.5" aria-label="Profile details checklist">
        {fields.map((field) => (
          <li key={field.label} className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
                field.complete
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              }`}
              aria-hidden="true"
            >
              {field.complete ? 'Y' : '-'}
            </span>
            <span className={field.complete ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300'}>
              {field.label}
            </span>
          </li>
        ))}
      </ul>

      {missingFields.length > 0 && (
        <Link
          href="/profile/settings"
          className="block w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Review profile details
        </Link>
      )}
    </div>
  );
}
