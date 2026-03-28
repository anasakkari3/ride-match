import Link from 'next/link';
import { cookies } from 'next/headers';
import { dictionaries, Lang, translate } from '@/lib/i18n/dictionaries';

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';

export default async function PublicLandingPage() {
    const user = await getCurrentUser();
    if (user) {
        redirect('/app');
    }
    const cookieStore = await cookies();
    const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
    const lang: Lang = langValue || 'en';
    const dict = dictionaries[lang] || dictionaries['en'];
    const t = (key: keyof typeof dictionaries['en']) => translate(dict, key);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans flex flex-col">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="text-2xl group-hover:animate-bounce-subtle">🚗</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">
                            {t('ride_match')}
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/app" className="rounded-xl bg-sky-600 dark:bg-sky-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700 dark:hover:bg-sky-600 transition-colors btn-press shadow-sm">
                            {t('get_started')}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-16">
                {/* A. Hero Section */}
                <section className="relative bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-950 pt-24 pb-20 sm:pt-32 sm:pb-28 px-4 overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-300/20 dark:bg-sky-500/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-300/10 dark:bg-emerald-500/5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 animate-fade-in-up">
                            {t('landing_hero_title')}
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-1 leading-relaxed">
                            {t('landing_hero_subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-2">
                            <Link href="/app" className="w-full sm:w-auto rounded-2xl bg-sky-600 dark:bg-sky-500 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-sky-700 dark:hover:bg-sky-600 hover:shadow-xl transition-all btn-press">
                                {t('get_started')}
                            </Link>
                            <a href="#how-it-works" className="w-full sm:w-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-8 py-4 text-lg font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors btn-press hidden sm:block">
                                {t('learn_more')}
                            </a>
                        </div>
                    </div>
                </section>

                {/* B. How it works */}
                <section id="how-it-works" className="py-20 px-4 bg-white dark:bg-slate-950">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-16">{t('how_it_works')}</h2>
                        <div className="grid sm:grid-cols-3 gap-10 sm:gap-6 relative">
                            <div className="hidden sm:block absolute top-[45px] left-[15%] right-[15%] h-[2px] bg-slate-100 dark:bg-slate-800 -z-10"></div>

                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 shadow-sm">1</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('step_1_title')}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('step_1_desc')}</p>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 shadow-sm">2</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('step_2_title')}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('step_2_desc')}</p>
                            </div>

                            <div className="text-center">
                                <div className="w-20 h-20 mx-auto bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 shadow-sm">3</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t('step_3_title')}</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{t('step_3_desc')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* C. Why Ride Match */}
                <section className="py-20 px-4 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-16">{t('why_ride_match')}</h2>
                        <div className="grid sm:grid-cols-3 gap-8">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-transform">
                                <div className="text-4xl mb-4">💰</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('benefit_1_title')}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{t('benefit_1_desc')}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-transform">
                                <div className="text-4xl mb-4">🌍</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('benefit_2_title')}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{t('benefit_2_desc')}</p>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:-translate-y-1 transition-transform">
                                <div className="text-4xl mb-4">📱</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('benefit_3_title')}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{t('benefit_3_desc')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* D. Product Preview */}
                <section className="py-24 px-4 bg-white dark:bg-slate-950 overflow-hidden">
                    <div className="max-w-6xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">{t('product_preview')}</h2>

                        {/* Minimal App Mockup */}
                        <div className="relative mx-auto max-w-[320px] rounded-[40px] border-[8px] border-slate-900 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 h-[600px] shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 dark:bg-slate-800 rounded-b-2xl z-20"></div>

                            <div className="pt-12 px-4 pb-4 h-full overflow-y-auto scrollbar-hide">
                                {/* Mock Search Header */}
                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm mb-6 border border-slate-100 dark:border-slate-800">
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-sky-500 mt-2 shrink-0"></div>
                                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-4"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full border border-emerald-500 mt-1 shrink-0"></div>
                                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    </div>
                                </div>

                                {/* Mock Trip Cards */}
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm mb-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                        </div>
                                        <div className="h-3 w-3/4 bg-slate-100 dark:bg-slate-800 rounded mb-2"></div>
                                        <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded mb-4"></div>
                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-800">
                                            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                            <div className="h-5 w-16 bg-sky-100 dark:bg-sky-900/30 rounded-full"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* E. Final CTA */}
                <section className="py-24 bg-gradient-to-tr from-sky-600 to-cyan-700 dark:from-sky-900 dark:to-slate-800 text-center px-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-4xl font-extrabold text-white mb-4">{t('final_cta_title')}</h2>
                        <p className="text-sky-100 text-lg mb-10">{t('final_cta_subtitle')}</p>
                        <Link href="/app" className="inline-block rounded-2xl bg-white text-sky-700 px-10 py-4 text-xl font-bold shadow-xl hover:bg-sky-50 transition-colors btn-press">
                            {t('get_started')}
                        </Link>
                    </div>
                </section>
            </main>

            {/* F. Footer */}
            <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🚗</span>
                        <span className="font-bold text-slate-900 dark:text-white tracking-tight">{t('ride_match')}</span>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-500 dark:text-slate-400">
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_privacy')}</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_terms')}</a>
                        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_contact')}</a>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        © {new Date().getFullYear()} Ride Match. {t('all_rights_reserved')}
                    </p>
                </div>
            </footer>
        </div>
    );
}
