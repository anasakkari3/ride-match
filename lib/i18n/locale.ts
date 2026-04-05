import type { Lang } from '@/lib/i18n/dictionaries';

type TranslationFn = (key: string) => string;

export function isRtlLang(lang: Lang): boolean {
  return lang === 'ar' || lang === 'he';
}

export function getLangDir(lang: Lang): 'ltr' | 'rtl' {
  return isRtlLang(lang) ? 'rtl' : 'ltr';
}

export function getLocaleTag(lang: Lang): string {
  switch (lang) {
    case 'ar':
      return 'ar';
    case 'he':
      return 'he';
    case 'en':
    default:
      return 'en-US';
  }
}

export function formatLocalizedDate(
  lang: Lang,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleDateString(getLocaleTag(lang), options);
}

export function formatLocalizedTime(
  lang: Lang,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleTimeString(getLocaleTag(lang), {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

export function formatLocalizedDateTime(
  lang: Lang,
  value: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(value).toLocaleString(getLocaleTag(lang), options);
}

export function getRelativeDayLabel(
  lang: Lang,
  value: Date | string,
  t: TranslationFn
): string {
  const target = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const dayDiff = Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000);

  if (dayDiff === 0) {
    return t('today');
  }

  if (dayDiff === 1) {
    return t('tomorrow');
  }

  return formatLocalizedDate(lang, target, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPriceLabel(
  priceCents: number | null | undefined,
  t: TranslationFn
): string | null {
  if (priceCents == null) return null;
  if (priceCents === 0) return t('free');
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function formatSeatCount(count: number, t: TranslationFn): string {
  return count === 1 ? `1 ${t('seat')}` : `${count} ${t('seats')}`;
}

export function formatSeatAvailability(count: number, t: TranslationFn): string {
  return count === 1 ? `1 ${t('seat_left')}` : `${count} ${t('seats_left')}`;
}

export function formatRouteLabel(origin: string, destination: string): string {
  return `${origin} - ${destination}`;
}
