'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

export default function AppNav() {
  const pathname = usePathname();
  const { lang, t } = useTranslation();
  const navLabel =
    lang === 'ar'
      ? 'التنقل الرئيسي'
      : lang === 'he'
        ? 'ניווט ראשי'
        : 'Primary navigation';

  const nav = [
    {
      href: '/app',
      label: t('home'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: '/trips/my-rides',
      label: t('my_rides'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
      ),
    },
    {
      href: '/profile',
      label: t('profile'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: '/messages',
      label: t('messages_nav'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: '/notifications',
      label: t('notifications_nav'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label={navLabel}
      className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/88 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/86 animate-slide-down"
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-2.5 sm:gap-3 sm:px-4">
        <Link
          href="/app"
          className="group flex min-w-0 shrink-0 items-center rounded-2xl max-w-[84px] sm:max-w-none"
          aria-label={t('home')}
        >
          <BrandLogo
            lang={lang}
            size="nav"
            className="transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </Link>

        <div className="flex items-center gap-0.5 sm:gap-1">
          {nav.map(({ href, label, icon }) => {
            const active = pathname === href || (href === '/profile' && pathname.startsWith('/profile'));
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`nav-link relative flex h-9 min-w-9 shrink-0 items-center justify-center gap-1 rounded-2xl px-0 py-0 text-sm font-medium transition-all duration-200 sm:h-auto sm:min-w-[42px] sm:gap-1.5 sm:px-2.5 sm:py-2.5 md:justify-start md:px-3.5 ${active
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white'
                  }`}
              >
                <span className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                  {icon}
                </span>
                <span className="hidden md:inline">{label}</span>
                {active && (
                  <span className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-sky-600 dark:bg-sky-400 animate-scale-in" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
