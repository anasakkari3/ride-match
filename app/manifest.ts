import type { MetadataRoute } from 'next';
import { getBrandDisplayName, getBrandMetaDescription, getBrandMetaTitle } from '@/lib/brand/config';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: getBrandMetaTitle(),
    short_name: getBrandDisplayName('ar'),
    description: getBrandMetaDescription('ar'),
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
