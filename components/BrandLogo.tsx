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

const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
  nav: { width: 132, height: 48 },
  auth: { width: 176, height: 64 },
  footer: { width: 152, height: 56 },
  hero: { width: 228, height: 84 },
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
      className={`h-auto w-auto max-w-full object-contain ${className}`.trim()}
      style={style}
    />
  );
}
