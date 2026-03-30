type Props = {
  ratingAvg?: number | null;
  ratingCount?: number | null;
  completedDrives?: number | null;
  variant?: 'compact' | 'full';
};

function formatAverage(avg: number): string {
  return avg.toFixed(1).replace(/\.0$/, '');
}

function formatReceivedRatingCount(ratingCount: number): string {
  if (ratingCount <= 0) return 'No ratings received';
  return `${ratingCount} rating${ratingCount === 1 ? '' : 's'} received`;
}

function CompactTrustSummary({
  ratingAvg,
  ratingCount,
  completedDrives,
}: {
  ratingAvg: number;
  ratingCount: number;
  completedDrives: number;
}) {
  const hasRatings = ratingCount > 0;
  const hasCompletedDrives = completedDrives > 0;

  if (!hasRatings && !hasCompletedDrives) {
    return (
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
        New driver
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-[10px]">
      {hasRatings ? (
        <span className="font-bold text-amber-500">
          <span className="font-normal text-slate-500 dark:text-slate-400 mr-1">
            Rating
          </span>
          {formatAverage(ratingAvg)}
          <span className="font-normal text-slate-400 dark:text-slate-500 ml-0.5">
            ({ratingCount})
          </span>
        </span>
      ) : (
        <span className="text-slate-400 dark:text-slate-500 font-medium">
          No ratings yet
        </span>
      )}
      {hasCompletedDrives && (
        <>
          <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">|</span>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {completedDrives} completed drive{completedDrives === 1 ? '' : 's'}
          </span>
        </>
      )}
    </span>
  );
}

function FullTrustSummary({
  ratingAvg,
  ratingCount,
  completedDrives,
}: {
  ratingAvg: number;
  ratingCount: number;
  completedDrives: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-center min-w-[84px]">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
          Received rating
        </p>
        <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
          {ratingCount > 0 ? formatAverage(ratingAvg) : 'New'}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
          {formatReceivedRatingCount(ratingCount)}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-center min-w-[108px]">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-bold">
          Completed drives
        </p>
        <p className="text-sm font-black text-slate-900 dark:text-slate-100 mt-1">
          {completedDrives}
        </p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
          as driver
        </p>
      </div>
    </div>
  );
}

export function DriverTrustSummary({
  ratingAvg = 0,
  ratingCount = 0,
  completedDrives = 0,
  variant = 'compact',
}: Props) {
  if (variant === 'full') {
    return (
      <FullTrustSummary
        ratingAvg={ratingAvg ?? 0}
        ratingCount={ratingCount ?? 0}
        completedDrives={Math.max(0, completedDrives ?? 0)}
      />
    );
  }

  return (
    <CompactTrustSummary
      ratingAvg={ratingAvg ?? 0}
      ratingCount={ratingCount ?? 0}
      completedDrives={Math.max(0, completedDrives ?? 0)}
    />
  );
}
