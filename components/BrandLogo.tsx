'use client';

import type { CSSProperties } from 'react';
import type { Lang } from '@/lib/i18n/dictionaries';
import { getBrandLogoAsset } from '@/lib/brand/config';

type LogoSize = 'nav' | 'auth' | 'footer' | 'hero';

type Props = {
  lang: Lang;
  size?: LogoSize;
  className?: string;
  priority?: boolean;
  style?: CSSProperties;
};

/**
 * Intrinsic dimensions for the <img> element (aspect-ratio hint for the browser).
 * The *visible* size is always controlled by the `constraintClass` below so that
 * the logo never exceeds the container it lives in.
 */
const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
  nav: { width: 507, height: 277 },
  auth: { width: 507, height: 277 },
  footer: { width: 507, height: 277 },
  hero: { width: 507, height: 277 },
};

/** Hard CSS ceilings per context so the logo can never overflow its parent. */
const CONSTRAINT_CLASS: Record<LogoSize, string> = {
  nav: 'block max-h-[44px] max-w-[140px] sm:max-h-[48px] sm:max-w-[160px] md:max-h-[52px] md:max-w-[180px]',
  auth: 'block max-h-14 max-w-[150px] sm:max-h-16 sm:max-w-[172px]',
  footer: 'block max-h-10 max-w-[126px] sm:max-h-11 sm:max-w-[136px]',
  hero: 'block max-h-[68px] max-w-[126px] sm:max-h-[84px] sm:max-w-[154px] md:max-h-[96px] md:max-w-[176px]',
};

export default function BrandLogo({
  lang,
  size = 'nav',
  className = '',
  priority = false,
  style,
}: Props) {
  const asset = getBrandLogoAsset(lang);
  const dimensions = SIZE_MAP[size];

  return (
    <img
      src={asset.src}
      alt={asset.alt}
      width={dimensions.width}
      height={dimensions.height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`h-auto w-auto max-w-full object-contain align-middle ${CONSTRAINT_CLASS[size]} ${className}`.trim()}
      style={style}
    />
  );
}
