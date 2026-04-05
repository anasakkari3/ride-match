import type { Lang } from '@/lib/i18n/dictionaries';

type BrandLogoAsset = {
  src: string;
  alt: string;
};

const BRAND_DISPLAY_NAMES: Record<Lang, string> = {
  en: 'OnWay',
  ar: 'بطريقك',
  he: 'בדרכך',
};

const BRAND_LOGOS: Record<Lang, BrandLogoAsset> = {
  en: {
    src: '/brand/logo-onway.png',
    alt: 'OnWay logo',
  },
  ar: {
    src: '/brand/logo-ar.png',
    alt: 'شعار بطريقك',
  },
  he: {
    src: '/brand/logo-onway.png',
    alt: 'לוגו OnWay',
  },
};

export function getBrandDisplayName(lang: Lang): string {
  return BRAND_DISPLAY_NAMES[lang] ?? BRAND_DISPLAY_NAMES.en;
}

export function getBrandLogoAsset(lang: Lang): BrandLogoAsset {
  return BRAND_LOGOS[lang] ?? BRAND_LOGOS.en;
}

export function getBrandMetaTitle(): string {
  return 'OnWay | بطريقك';
}

export function getBrandMetaDescription(lang: Lang): string {
  switch (lang) {
    case 'ar':
      return 'تنسيق رحلات مجتمعي بسيط وآمن وفي الوقت المناسب.';
    case 'he':
      return 'תיאום נסיעות קהילתי פשוט, מסודר ואמין.';
    case 'en':
    default:
      return 'Simple, organized, community ride coordination.';
  }
}
