'use client';

import { createContext, useContext, ReactNode } from 'react';
import { dictionaries, type DictKey, Lang } from './dictionaries';

interface LanguageContextProps {
    lang: Lang;
    t: (key: DictKey | (string & {})) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
    lang: 'en',
    t: (k) => k as string,
});

export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
    const t = (key: DictKey | (string & {})): string => {
        return (dictionaries[lang][key as keyof typeof dictionaries['en']] as string | undefined)
            ?? (dictionaries['en'][key as keyof typeof dictionaries['en']] as string | undefined)
            ?? key as string;
    };

    return (
        <LanguageContext.Provider value={{ lang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useTranslation() {
    return useContext(LanguageContext);
}
