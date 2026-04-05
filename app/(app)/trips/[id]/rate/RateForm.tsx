'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { submitRating } from './actions';

type Props = { tripId: string; driverId: string };

const COPY = {
  en: {
    title: 'Rate this trip from 1 to 5',
    optionalFeedback: 'Optional feedback',
    feedbackHint: 'Keep it short. This helps explain the rating but is not required.',
    feedbackPlaceholder: 'Share anything useful about the trip.',
    stars: (count: number) => `${count} star${count === 1 ? '' : 's'}`,
  },
  ar: {
    title: 'قيّم هذه الرحلة من 1 إلى 5',
    optionalFeedback: 'ملاحظات اختيارية',
    feedbackHint: 'اجعلها قصيرة. قد تساعد في توضيح التقييم لكنها ليست مطلوبة.',
    feedbackPlaceholder: 'شارك أي ملاحظة مفيدة عن الرحلة.',
    stars: (count: number) => `${count} نجوم`,
  },
  he: {
    title: 'דרגו את הנסיעה הזאת מ־1 עד 5',
    optionalFeedback: 'משוב אופציונלי',
    feedbackHint: 'שמרו על זה קצר. זה יכול להסביר את הדירוג אבל לא חובה.',
    feedbackPlaceholder: 'שתפו משהו מועיל על הנסיעה.',
    stars: (count: number) => `${count} כוכבים`,
  },
} as const;

export default function RateForm({ tripId, driverId }: Props) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const copy = COPY[lang];
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 1 || score > 5) return;

    setLoading(true);
    setError(null);

    try {
      await submitRating(tripId, driverId, score, feedback);
      router.refresh();
      router.push(`/trips/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_submit_rating'));
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-center mb-3">
          {copy.title}
        </p>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={`w-10 h-10 rounded-full text-lg font-medium transition-colors ${
                score >= n
                  ? 'bg-sky-600 dark:bg-sky-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
              aria-label={copy.stars(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
          {t('poor_great')}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-2">
        <label
          htmlFor="rating-feedback"
          className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          {copy.optionalFeedback}
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {copy.feedbackHint}
        </p>
        <textarea
          id="rating-feedback"
          rows={4}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder={copy.feedbackPlaceholder}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
        />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading || score < 1}
        className="w-full rounded-lg bg-sky-600 dark:bg-sky-500 px-4 py-3 font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-50 transition-colors"
      >
        {loading ? t('submitting') : t('submit_rating')}
      </button>
    </form>
  );
}
