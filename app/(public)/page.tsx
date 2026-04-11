import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import FounderStorySection from '@/components/public/FounderStorySection';
import PhoneVideoPlayer from '@/components/public/PhoneVideoPlayer';
import { getCurrentUser } from '@/lib/auth/session';
import { getPostAuthRedirectPath } from '@/lib/auth/onboarding';
import { dictionaries, type DictKey, Lang, translate } from '@/lib/i18n/dictionaries';

export default async function PublicLandingPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(await getPostAuthRedirectPath(user.id));
  }

  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dict = dictionaries[lang] || dictionaries.en;
  const t = (key: DictKey) => translate(dict, key);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans flex flex-col">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/88 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/86">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-w-0 shrink-0 items-center rounded-2xl max-w-[48vw] sm:max-w-none" aria-label={t('home')}>
            <BrandLogo
              lang={lang}
              size="nav"
              priority
              className="transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
              {t('sign_in') || 'Sign in'}
            </Link>
            <Link href="/app" className="btn-primary rounded-2xl px-4 py-2.5 text-sm font-bold shadow-md sm:px-5">
              {t('get_started')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <section className="relative bg-gradient-to-b from-sky-50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-28 pb-24 sm:pt-40 sm:pb-32 px-4 overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-300/15 dark:bg-cyan-500/5 rounded-full blur-[100px] transform -translate-x-1/3 translate-y-1/3 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-sky-200/10 to-transparent dark:from-sky-800/5 rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="mb-8 flex justify-center animate-fade-in-up">
              <BrandLogo lang={lang} size="hero" priority />
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 animate-fade-in-up leading-[1.1]">
              {t('landing_hero_title')}
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12 animate-fade-in-up stagger-1 leading-relaxed">
              {t('landing_hero_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-2">
              <Link href="/app" className="w-full sm:w-auto btn-primary rounded-2xl px-10 py-4 text-lg font-bold shadow-lg">
                {t('get_started')}
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 px-8 py-4 text-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all btn-press hidden sm:block">
                {t('learn_more')}
              </a>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 px-4 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-3">{t('how_it_works')}</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{t('how_it_works')}</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-10 sm:gap-8 relative">
              <div className="hidden sm:block absolute top-[44px] left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-sky-200 via-emerald-200 to-amber-200 dark:from-sky-800 dark:via-emerald-800 dark:to-amber-800 -z-10" />

              <div className="text-center group">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/50 dark:to-sky-900/20 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 shadow-sm ring-1 ring-sky-200/50 dark:ring-sky-800/50 group-hover:scale-105 transition-transform duration-300">1</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('step_1_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">{t('step_1_desc')}</p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/50 dark:to-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 shadow-sm ring-1 ring-emerald-200/50 dark:ring-emerald-800/50 group-hover:scale-105 transition-transform duration-300">2</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('step_2_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">{t('step_2_desc')}</p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/50 dark:to-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 shadow-sm ring-1 ring-amber-200/50 dark:ring-amber-800/50 group-hover:scale-105 transition-transform duration-300">3</div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('step_3_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">{t('step_3_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-4 bg-slate-50/80 dark:bg-slate-900/30 border-y border-slate-100 dark:border-slate-800/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{t('why_ride_match')}</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="bg-white dark:bg-slate-900/80 p-8 rounded-3xl shadow-elevated border border-slate-100 dark:border-slate-800 hover:-translate-y-1.5 transition-all duration-300 group">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/10 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('benefit_1_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t('benefit_1_desc')}</p>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-8 rounded-3xl shadow-elevated border border-slate-100 dark:border-slate-800 hover:-translate-y-1.5 transition-all duration-300 group">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/40 dark:to-sky-900/10 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600 dark:text-sky-400"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('benefit_2_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t('benefit_2_desc')}</p>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-8 rounded-3xl shadow-elevated border border-slate-100 dark:border-slate-800 hover:-translate-y-1.5 transition-all duration-300 group">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-900/10 rounded-2xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-600 dark:text-violet-400"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('benefit_3_title')}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t('benefit_3_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <FounderStorySection />

        <section className="py-24 px-4 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-12">
              <p className="text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest mb-3">{t('product_preview')}</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{t('product_preview')}</h2>
            </div>

            <div className="relative mx-auto max-w-[320px]">
              {/* Phone glow */}
              <div className="absolute -inset-8 bg-gradient-to-b from-sky-400/20 to-cyan-400/10 dark:from-sky-500/10 dark:to-cyan-500/5 rounded-[60px] blur-2xl pointer-events-none" />

              <div className="relative rounded-[44px] border-[6px] border-slate-900 dark:border-slate-700 bg-slate-950 h-[620px] shadow-2xl overflow-hidden ring-1 ring-slate-800/20">
                {/* Notch overlay — sits above the video */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 rounded-b-2xl z-20 pointer-events-none" />
                {/* Home indicator overlay */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-600/70 rounded-full z-20 pointer-events-none" />

                {/* Remotion video fills the phone */}
                <div className="w-full h-full">
                  <PhoneVideoPlayer />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-28 bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-700 dark:from-sky-900 dark:via-slate-800 dark:to-slate-900 text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">{t('final_cta_title')}</h2>
            <p className="text-sky-100/90 text-lg sm:text-xl mb-12 leading-relaxed">{t('final_cta_subtitle')}</p>
            <Link href="/app" className="inline-block rounded-2xl bg-white text-sky-700 px-10 py-4 text-xl font-bold shadow-xl hover:bg-sky-50 hover:shadow-2xl hover:-translate-y-0.5 transition-all btn-press">
              {t('get_started')}
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800/50 py-14 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center">
            <BrandLogo lang={lang} size="footer" className="opacity-80" />
          </div>
          <div className="flex gap-8 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_privacy')}</Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_terms')}</Link>
            <Link href="/contact" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_contact')}</Link>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            {t('copyright')} {new Date().getFullYear()} {t('ride_match')}. {t('all_rights_reserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}
