'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitReportAction, blockUserAction } from './actions';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  reportedUserId: string;
  reportedUserName: string;
};

const REASONS = [
  'Inappropriate behavior or harassment',
  'Unsafe driving',
  "Vehicle did not match or brought unagreed guests",
  'No-show',
  'Other',
];

export default function ReportUserModal({
  isOpen,
  onClose,
  tripId,
  reportedUserId,
  reportedUserName,
}: Props) {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState('');
  const [context, setContext] = useState('');
  const [shouldBlock, setShouldBlock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError(null);

    const reportResult = await submitReportAction({
      tripId,
      reportedUserId,
      reason: selectedReason,
      context,
    });

    let blockResult: { ok: true } | { ok: false; error: string } = { ok: true };
    if (shouldBlock) {
      blockResult = await blockUserAction({ reportedUserId });
    }

    if (reportResult.ok && blockResult.ok) {
      setSuccess(true);
      if (shouldBlock) {
        router.refresh();
      }
    } else {
      const nextError = !reportResult.ok
        ? reportResult.error
        : (!blockResult.ok ? blockResult.error : 'Unknown error');
      setError(nextError);
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {success ? (
          <div className="p-8 text-center flex flex-col items-center justify-center" aria-live="polite">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6">
                OK
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Report submitted</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
               Your report was saved for this trip. The reported user is not notified. If you also blocked them, future search and booking interactions are prevented and shared trip threads become updates-only.
             </p>
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h2 id="report-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Report {reportedUserName}
              </h2>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                This report is private and tied to this trip.
              </p>
            </div>

            <form id="report-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <fieldset>
                <legend className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                  What happened?
                </legend>
                <div className="space-y-2">
                  {REASONS.map((reason) => (
                    <label
                      key={reason}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                        selectedReason === reason
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/10 dark:border-sky-500/50'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        value={reason}
                        checked={selectedReason === reason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 focus:ring-sky-500 dark:bg-slate-800 dark:border-slate-700 focus:ring-offset-slate-900"
                      />
                      <span className={`text-sm ${selectedReason === reason ? 'font-medium text-sky-900 dark:text-sky-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {reason}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="report-context" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Additional details <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="report-context"
                  rows={3}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Briefly describe what happened."
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={shouldBlock}
                    onChange={(e) => setShouldBlock(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500 dark:bg-slate-800"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      Also block this user
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      This stops future search and booking interactions. Existing shared trips stay visible, but direct messages are limited.
                    </span>
                  </div>
                </label>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </form>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="report-user-form"
                disabled={!selectedReason || loading}
                className="rounded-xl bg-red-600 dark:bg-red-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
