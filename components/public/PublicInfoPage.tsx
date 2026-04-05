import Link from 'next/link';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import BrandLogo from '@/components/BrandLogo';
import { dictionaries, type DictKey, Lang, translate } from '@/lib/i18n/dictionaries';

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
};

export default async function PublicInfoPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  children,
}: Props) {
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries.en;
  const t = (key: DictKey) => translate(dict, key);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans flex flex-col">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/88 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/84">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 shrink-0 items-center rounded-2xl max-w-[48vw] sm:max-w-none" aria-label={t('home')}>
            <BrandLogo lang={lang} size="nav" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              {t('home')}
            </Link>
            <Link
              href="/app"
              className="rounded-xl bg-sky-600 dark:bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press shadow-sm"
            >
              {t('get_started')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <section className="relative bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 pt-20 pb-12 px-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-sky-300/15 dark:bg-sky-500/10 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 pointer-events-none" />
          <div className="max-w-4xl mx-auto relative z-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-400 mb-4">
              {eyebrow}
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
              {title}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {description}
            </p>
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              {t('last_updated')}: {lastUpdated}
            </p>
          </div>
        </section>

        <section className="pb-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 space-y-8">{children}</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <BrandLogo lang={lang} size="footer" />
          </div>
          <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t('footer_privacy')}
            </Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t('footer_terms')}
            </Link>
            <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              {t('footer_contact')}
            </Link>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('copyright')} {new Date().getFullYear()} {t('ride_match')}. {t('all_rights_reserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}
