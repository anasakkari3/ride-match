'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; code?: string };
  reset: () => void;
}) {
  const { lang } = useTranslation();

  useEffect(() => {
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  const copy = {
    en: {
      title: 'Something went wrong',
      fallback: 'An unexpected error occurred while processing your request.',
      retry: 'Try again',
    },
    ar: {
      title: 'حدث خطأ ما',
      fallback: 'وقع خطأ غير متوقع أثناء معالجة طلبك.',
      retry: 'حاول مرة أخرى',
    },
    he: {
      title: 'משהו השתבש',
      fallback: 'אירעה שגיאה לא צפויה בזמן עיבוד הבקשה שלך.',
      retry: 'נסה שוב',
    },
  }[lang] ?? {
    title: 'Something went wrong',
    fallback: 'An unexpected error occurred while processing your request.',
    retry: 'Try again',
  };

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{copy.title}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          {lang === 'en' ? error.message || copy.fallback : copy.fallback}
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 transition"
        >
          {copy.retry}
        </button>
      </div>
    </div>
  );
}
