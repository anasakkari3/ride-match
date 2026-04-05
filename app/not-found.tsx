import Link from 'next/link';
import { getServerLang } from '@/lib/i18n/server';

export default async function NotFound() {
  const lang = await getServerLang();
  const copy = {
    en: {
      title: 'Page not found',
      description:
        'We could not find the resource you are looking for. It may have been removed or the link may be incorrect.',
      cta: 'Return home',
    },
    ar: {
      title: 'الصفحة غير موجودة',
      description: 'لم نتمكن من العثور على الصفحة التي تبحث عنها. ربما تمت إزالتها أو أن الرابط غير صحيح.',
      cta: 'العودة إلى الرئيسية',
    },
    he: {
      title: 'העמוד לא נמצא',
      description: 'לא הצלחנו למצוא את המשאב שחיפשתם. ייתכן שהוא הוסר או שהקישור שגוי.',
      cta: 'חזרה לבית',
    },
  }[lang];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
      <div className="text-center w-full max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </div>
        <p className="text-7xl font-black text-slate-200 dark:text-slate-800 mb-2">404</p>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{copy.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-[280px] mx-auto">{copy.description}</p>
        <Link
          href="/app"
          className="btn-primary inline-flex justify-center px-8 py-3 rounded-xl font-semibold"
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}
