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
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{copy.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-[280px] mx-auto">
          {lang === 'en' ? error.message || copy.fallback : copy.fallback}
        </p>
        <button
          onClick={() => reset()}
          className="btn-primary w-full py-3 rounded-xl font-semibold"
        >
          {copy.retry}
        </button>
      </div>
    </div>
  );
}
