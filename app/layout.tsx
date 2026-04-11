import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from 'next/headers';
import { getBrandMetaDescription, getBrandMetaTitle } from '@/lib/brand/config';
import { LanguageProvider } from '@/lib/i18n/LanguageProvider';
import type { Lang } from '@/lib/i18n/dictionaries';
import { getLangDir } from '@/lib/i18n/locale';
import { ThemeProvider } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: getBrandMetaTitle(),
  description: getBrandMetaDescription('ar'),
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const langValue = cookieStore.get('NEXT_LOCALE')?.value as Lang | undefined;
  const lang: Lang = langValue || 'en';
  const dir = getLangDir(lang);

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground transition-colors duration-200`}
      >
        <ThemeProvider>
          <LanguageProvider lang={lang}>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
