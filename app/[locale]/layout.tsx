import { Suspense } from 'react';
import { NextIntlClientProvider, useMessages } from 'next-intl';

import { Toaster } from '@/components/ui/sonner';
import GoogleAdScript from '@/components/ad/GoogleAdScript';
import Navigation from '@/components/home/Navigation';
import SeoScript from '@/components/seo/SeoScript';
import ThemeProvider from '@/app/components/ThemeProvider';

import Loading from './loading';

import './globals.css';

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = useMessages();

  return (
    <html lang={locale} suppressHydrationWarning className='dark'>
      <body className='bg-tap4-black dark:bg-tap4-black relative mx-auto flex min-h-screen flex-col text-white dark:text-white'>
        <ThemeProvider attribute='class' defaultTheme='dark' forcedTheme='dark' enableSystem={false}>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Toaster
              position='top-center'
              toastOptions={{
                classNames: {
                  error: 'bg-red-400',
                  success: 'text-green-400',
                  warning: 'text-yellow-400',
                  info: 'bg-blue-400',
                },
              }}
            />
            <Navigation />
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </NextIntlClientProvider>
        </ThemeProvider>
        <SeoScript />
        <GoogleAdScript />
      </body>
    </html>
  );
}
