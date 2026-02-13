import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';
import ReactGA from 'react-ga';
import { UnitProvider } from '../lib/hooks/useUnitToggle';
import '../styles/globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const FIVE_MIN = 5 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: FIVE_MIN, gcTime: TEN_MIN },
        },
      })
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !GA_ID) return;
    if (!(window as unknown as { __GA_INIT?: boolean }).__GA_INIT) {
      ReactGA.initialize(GA_ID, { testMode: process.env.NODE_ENV === 'test' });
      (window as unknown as { __GA_INIT?: boolean }).__GA_INIT = true;
    }
  }, []);
  useEffect(() => {
    if (GA_ID && router.isReady) ReactGA.pageview(router.asPath);
  }, [GA_ID, router.isReady, router.asPath]);

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </Head>
      <div className={dmSans.variable} style={{ minHeight: '100vh', width: '100%' }}>
        <SessionProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <UnitProvider>
            <Component {...pageProps} />
          </UnitProvider>
        </QueryClientProvider>
      </SessionProvider>
      </div>
    </>
  );
}
