import { cookies } from 'next/headers';
import { dictionaries, type DictKey, Lang, translate } from './dictionaries';

export async function getServerLang(): Promise<Lang> {
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  return langValue && dictionaries[langValue] ? langValue : 'en';
}

export async function getServerI18n() {
  const lang = await getServerLang();
  const dict = dictionaries[lang] ?? dictionaries.en;

  return {
    lang,
    dict,
    t: (key: DictKey) => translate(dict, key),
    tWide: (key: string) => translate(dict, key as DictKey),
  };
}
