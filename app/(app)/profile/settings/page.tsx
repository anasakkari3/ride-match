'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { signOut } from '@/app/(auth)/login/actions';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { setLanguageCookie } from '@/lib/i18n/actions';
import type { Lang } from '@/lib/i18n/dictionaries';


export default function SettingsPage() {
    const [signingOut, setSigningOut] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const { theme, setTheme } = useTheme();
    const { lang, t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [locationSharing, setLocationSharing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Standard SSR hydration guard for next-themes — set state after mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSignOut = async () => {
        setSigningOut(true);
        await signOut();
        window.location.href = '/';
    };

    return (
        <div className="p-4 max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    href="/profile"
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rtl:rotate-180">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('settings')}</h1>
            </div>

            {/* Account Section */}
            <section className="animate-fade-in-up">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">{t('account')}</h2>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('edit_profile')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('edit_profile_desc')}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                    </Link>
                    <Link href="/community" className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('my_communities')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('my_communities_desc')}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                    </Link>
                </div>
            </section>

            {/* Preferences Section */}
            <section className="animate-fade-in-up stagger-1">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">{t('preferences')}</h2>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Notifications */}
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('notifications')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('notifications_desc')}</p>
                        </div>
                        <button
                            onClick={() => setNotifications(!notifications)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${notifications ? 'bg-sky-600 dark:bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            dir="ltr"
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifications ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    {/* Theme Settings */}
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800 dark:bg-slate-700 text-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('theme_appearance')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('theme_appearance_desc')}</p>
                        </div>
                        {mounted && (
                            <select
                                value={theme}
                                onChange={(e) => setTheme(e.target.value)}
                                className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                            >
                                <option value="light">{t('light')}</option>
                                <option value="dark">{t('dark')}</option>
                                <option value="system">{t('system')}</option>
                            </select>
                        )}
                    </div>

                    {/* Language Settings */}
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('language')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 rtl:text-right" dir="ltr">{t('language_desc')}</p>
                        </div>
                        <select
                            value={lang}
                            onChange={async (e) => {
                                await setLanguageCookie(e.target.value as Lang);
                                window.location.reload();
                            }}
                            className="text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                        >
                            <option value="en">English</option>
                            <option value="ar">العربية</option>
                            <option value="he">עברית</option>
                        </select>
                    </div>

                    {/* Location Sharing */}
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('location_sharing')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('location_sharing_desc')}</p>
                        </div>
                        <button
                            onClick={() => setLocationSharing(!locationSharing)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${locationSharing ? 'bg-sky-600 dark:bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            dir="ltr"
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${locationSharing ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Support Section */}
            <section className="animate-fade-in-up stagger-2">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">{t('support')}</h2>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('help_faq')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('help_faq_desc')}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('rate_the_app')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{t('rate_the_app_desc')}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 rtl:rotate-180"><polyline points="9 18 15 12 9 6" /></svg>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3.5">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{t('about')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400" dir="ltr">{t('about_desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Danger Zone */}
            <section className="animate-fade-in-up stagger-3">
                <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">{t('account_actions')}</h2>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                        dir={lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr'}
                    >
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{signingOut ? t('signing_out') : t('sign_out')}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">{t('sign_out_desc')}</p>
                        </div>
                    </button>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
                            dir={lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr'}
                        >
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">{t('delete_account')}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-500">{t('delete_account_desc')}</p>
                            </div>
                        </button>
                    ) : (
                        <div className="px-4 py-3.5 bg-red-50 dark:bg-red-900/10 space-y-3">
                            <p className="text-sm text-red-800 dark:text-red-300 font-medium">{t('are_you_sure_delete')}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    className="flex-1 rounded-lg bg-red-600 dark:bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                                >
                                    {t('delete')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
