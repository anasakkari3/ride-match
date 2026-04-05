'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import { signOut } from '@/app/(auth)/login/actions';
import { useTranslation } from '@/lib/i18n/LanguageProvider';
import { setLanguageCookie } from '@/lib/i18n/actions';
import type { Lang } from '@/lib/i18n/dictionaries';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { signOut as firebaseSignOut } from 'firebase/auth';

const COPY = {
  en: {
    personalDetailsNote: 'Personal details are managed from your profile page. Document verification there is placeholder-only for now and does not upload or store real files yet.',
  },
  ar: {
    personalDetailsNote: 'تتم إدارة التفاصيل الشخصية من صفحة الملف الشخصي. التحقق من المستندات هناك ما يزال مؤقتًا فقط ولا يرفع أو يخزن ملفات حقيقية بعد.',
  },
  he: {
    personalDetailsNote: 'הפרטים האישיים מנוהלים מדף הפרופיל. אימות המסמכים שם הוא עדיין זמני בלבד ואינו מעלה או שומר קבצים אמיתיים.',
  },
} as const;

export default function SettingsPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [signingOut, setSigningOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const { lang, t } = useTranslation();
  const copy = COPY[lang];

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      window.location.href = '/';
    } catch (err) {
      console.error('Sign out failed:', err);
      setSigningOut(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-6">
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

      <section className="animate-fade-in-up">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">{t('account')}</h2>
        <div className="space-y-3">
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
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
            {copy.personalDetailsNote}
          </div>
        </div>
      </section>

      <section className="animate-fade-in-up stagger-1">
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-1">{t('preferences')}</h2>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
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
        </div>
      </section>

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
        </div>
      </section>
    </div>
  );
}
