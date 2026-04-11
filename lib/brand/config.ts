export type BrandLang = 'en' | 'ar' | 'he';

type BrandLogoAsset = {
  src: string;
  alt: string;
};

export const BRAND_NAME = 'بطريقك';

const BRAND_LOGO: BrandLogoAsset = {
  src: '/brand/logo-ar.png',
  alt: 'شعار بطريقك',
};

const LEGACY_BRAND_NAMES = ['OnWay', 'Btriq', 'בדרכך', BRAND_NAME] as const;

export function getBrandDisplayName(lang: BrandLang): string {
  void lang;
  return BRAND_NAME;
}

export function getBrandLogoAsset(lang: BrandLang): BrandLogoAsset {
  void lang;
  return BRAND_LOGO;
}

export function getBrandMetaTitle(): string {
  return BRAND_NAME;
}

export function getBrandMetaDescription(lang: BrandLang): string {
  switch (lang) {
    case 'ar':
      return 'بطريقك يساعد مجتمع الجامعة على تنسيق الرحلات بوضوح وثقة.';
    case 'he':
      return `${BRAND_NAME} עוזרת לקהילת האוניברסיטה לתאם נסיעות בבהירות ובאמון.`;
    case 'en':
    default:
      return `${BRAND_NAME} helps a university community coordinate rides with clarity and trust.`;
  }
}

export function brandText(input: string): string {
  return LEGACY_BRAND_NAMES.reduce(
    (value, legacyName) => value.split(legacyName).join(BRAND_NAME),
    input
  );
}

export function brandCopy<T>(input: T): T {
  if (typeof input === 'string') {
    return brandText(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => brandCopy(item)) as T;
  }

  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, brandCopy(value)])
    ) as T;
  }

  return input;
}
