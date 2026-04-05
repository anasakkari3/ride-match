'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitReportAction, blockUserAction } from './actions';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  reportedUserId: string;
  reportedUserName: string;
};

const REASON_VALUES = [
  'Inappropriate behavior or harassment',
  'Unsafe driving',
  'Vehicle did not match or brought unagreed guests',
  'No-show',
  'Other',
] as const;

const COPY = {
  en: {
    reasons: [
      'Inappropriate behavior or harassment',
      'Unsafe driving',
      'Vehicle did not match or brought unagreed guests',
      'No-show',
      'Other',
    ],
    reportSubmitted: 'Report submitted',
    reportDesc: 'Your report was saved for this trip. The reported user is not notified. If you also blocked them, future search and booking interactions are prevented and shared trip threads become updates-only.',
    reportUser: (name: string) => `Report ${name}`,
    privateReport: 'This report is private and tied to this trip.',
    whatHappened: 'What happened?',
    additionalDetails: 'Additional details',
    optional: 'optional',
    contextPlaceholder: 'Briefly describe what happened.',
    blockUser: 'Also block this user',
    blockHelper: 'This stops future search and booking interactions. Existing shared trips stay visible, but direct messages are limited.',
    submitError: 'Please select a reason',
    cancel: 'Cancel',
    submit: 'Submit report',
    submitting: 'Submitting...',
    close: 'Close',
  },
  ar: {
    reasons: [
      'سلوك غير لائق أو مضايقة',
      'قيادة غير آمنة',
      'المركبة لا تطابق الوصف أو وُجد ركاب غير متفق عليهم',
      'عدم الحضور',
      'أخرى',
    ],
    reportSubmitted: 'تم إرسال البلاغ',
    reportDesc: 'تم حفظ بلاغك لهذه الرحلة. لن يتم إشعار المستخدم المبلّغ عنه. إذا قمت بحظره أيضًا فسيتم منع التفاعل معه في البحث والحجز مستقبلًا، وتصبح المحادثات المشتركة تحديثات فقط.',
    reportUser: (name: string) => `الإبلاغ عن ${name}`,
    privateReport: 'هذا البلاغ خاص ومرتبط بهذه الرحلة.',
    whatHappened: 'ماذا حدث؟',
    additionalDetails: 'تفاصيل إضافية',
    optional: 'اختياري',
    contextPlaceholder: 'اشرح باختصار ما الذي حدث.',
    blockUser: 'احظر هذا المستخدم أيضًا',
    blockHelper: 'سيؤدي هذا إلى منع التفاعل معه في البحث والحجز مستقبلًا. ستبقى الرحلات المشتركة الحالية ظاهرة، لكن الرسائل المباشرة ستكون محدودة.',
    submitError: 'يرجى اختيار سبب',
    cancel: 'إلغاء',
    submit: 'إرسال البلاغ',
    submitting: 'جارٍ الإرسال...',
    close: 'إغلاق',
  },
  he: {
    reasons: [
      'התנהגות לא הולמת או הטרדה',
      'נהיגה לא בטוחה',
      'הרכב לא התאים או צורפו אורחים שלא סוכמו',
      'אי-הגעה',
      'אחר',
    ],
    reportSubmitted: 'הדיווח נשלח',
    reportDesc: 'הדיווח שלכם נשמר עבור הנסיעה הזאת. המשתמש שדווח עליו לא מקבל הודעה. אם גם חסמתם אותו, אינטראקציות חיפוש והזמנה עתידיות ייחסמו ושרשורים משותפים יהפכו לעדכונים בלבד.',
    reportUser: (name: string) => `דיווח על ${name}`,
    privateReport: 'הדיווח הזה פרטי ומקושר לנסיעה הזאת.',
    whatHappened: 'מה קרה?',
    additionalDetails: 'פרטים נוספים',
    optional: 'אופציונלי',
    contextPlaceholder: 'תארו בקצרה מה קרה.',
    blockUser: 'לחסום גם את המשתמש הזה',
    blockHelper: 'זה יעצור אינטראקציות חיפוש והזמנה עתידיות. נסיעות משותפות קיימות יישארו גלויות, אבל הודעות ישירות יהיו מוגבלות.',
    submitError: 'בחרו סיבה',
    cancel: 'ביטול',
    submit: 'שליחת דיווח',
    submitting: 'שולח...',
    close: 'סגירה',
  },
} as const;

export default function ReportUserModal({
  isOpen,
  onClose,
  tripId,
  reportedUserId,
  reportedUserName,
}: Props) {
  const router = useRouter();
  const { lang } = useTranslation();
  const copy = COPY[lang];
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
      setError(copy.submitError);
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{copy.reportSubmitted}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
              {copy.reportDesc}
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {copy.close}
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h2 id="report-modal-title" className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                {copy.reportUser(reportedUserName)}
              </h2>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {copy.privateReport}
              </p>
            </div>

            <form id="report-user-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <fieldset>
                <legend className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                  {copy.whatHappened}
                </legend>
                <div className="space-y-2">
                  {REASON_VALUES.map((reason, index) => (
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
                        data-testid={`report-reason-${reason}`}
                        className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 focus:ring-sky-500 dark:bg-slate-800 dark:border-slate-700 focus:ring-offset-slate-900"
                      />
                      <span className={`text-sm ${selectedReason === reason ? 'font-medium text-sky-900 dark:text-sky-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {copy.reasons[index]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="report-context" className="block text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {copy.additionalDetails} <span className="text-slate-400 font-normal">({copy.optional})</span>
                </label>
                <textarea
                  id="report-context"
                  rows={3}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  data-testid="report-context-input"
                  placeholder={copy.contextPlaceholder}
                  className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={shouldBlock}
                    onChange={(e) => setShouldBlock(e.target.checked)}
                    data-testid="report-block-checkbox"
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500 dark:bg-slate-800"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {copy.blockUser}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {copy.blockHelper}
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
                {copy.cancel}
              </button>
              <button
                type="submit"
                form="report-user-form"
                disabled={!selectedReason || loading}
                data-testid="submit-report-button"
                className="rounded-xl bg-red-600 dark:bg-red-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? copy.submitting : copy.submit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
