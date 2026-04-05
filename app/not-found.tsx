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
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <div className="text-center w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{copy.title}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{copy.description}</p>
        <Link
          href="/app"
          className="inline-flex justify-center bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition"
        >
          {copy.cta}
        </Link>
      </div>
    </div>
  );
}
