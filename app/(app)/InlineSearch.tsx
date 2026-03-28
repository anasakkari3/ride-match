'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

type Props = {
    communityId?: string;
    initialOrigin?: string;
    initialDestination?: string;
};

export default function InlineSearch({ communityId, initialOrigin = '', initialDestination = '' }: Props) {
    const router = useRouter();
    const { t } = useTranslation();
    const [origin, setOrigin] = useState(initialOrigin);
    const [destination, setDestination] = useState(initialDestination);

    const hasActiveSearch = Boolean(origin.trim() || destination.trim());

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!origin && !destination) return;

        const params = new URLSearchParams();
        if (communityId) params.append('community_id', communityId);
        if (origin) params.append('originName', origin);
        if (destination) params.append('destinationName', destination);

        // Push the search directly to the app homepage to trigger inline results
        router.push(`/app?${params.toString()}`);
    };

    const handleClear = () => {
        setOrigin('');
        setDestination('');
        router.push('/app');
    };

    return (
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-2 sm:p-3 border border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl relative w-full translate-y-2">
            <div className="flex-1 flex flex-col relative">
                <label htmlFor="origin" className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest px-3 pt-1">{t('from')}</label>
                <input
                    id="origin"
                    aria-label="Search origin"
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder={t('anywhere')}
                    className="w-full bg-transparent px-3 pb-2 pt-0 text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-0"
                />
            </div>

            <div className="hidden sm:block w-px bg-slate-100 dark:bg-slate-800 my-2"></div>
            <div className="sm:hidden h-px bg-slate-100 dark:bg-slate-800 mx-3"></div>

            <div className="flex-1 flex flex-col relative">
                <label htmlFor="destination" className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest px-3 pt-1">{t('to')}</label>
                <input
                    id="destination"
                    aria-label="Search destination"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder={t('anywhere')}
                    className="w-full bg-transparent px-3 pb-2 pt-0 text-[15px] font-medium text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-0"
                />
            </div>

            <div className="flex items-center gap-2 pl-2 sm:pl-0 sm:pr-1 pt-2 sm:pt-0">
                {hasActiveSearch && (
                    <button
                        type="button"
                        onClick={handleClear}
                        title={t('clear_search')}
                        className="flex h-[42px] items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 px-3 text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 btn-press shrink-0"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        <span className="sr-only">{t('clear_search')}</span>
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!origin.trim() && !destination.trim()}
                    className="flex h-[42px] flex-1 sm:flex-none items-center justify-center gap-2 rounded-2xl bg-slate-900 dark:bg-sky-600 px-6 font-bold text-white shadow-md transition-colors hover:bg-slate-800 dark:hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed btn-press"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <span className="sm:hidden lg:inline">{t('search')}</span>
                </button>
            </div>
        </form>
    );
}
