import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { DM_Sans } from 'next/font/google';
import ReactGA from 'react-ga';
import { UnitProvider } from '../lib/hooks/useUnitToggle';
import { SEO, canonicalUrl, toAbsoluteUrl } from '../lib/seo';
import '../styles/globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// React Query cache times (ms)
const FIVE_MIN = 5 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;

/**
 * Root app: providers (session, React Query, units), font, and optional GA.
 * Session and pageProps.session are passed through for NextAuth.
 */
export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const canonicalPath = router.asPath.split('?')[0].split('#')[0] || '/';
  const canonical = canonicalUrl(canonicalPath);
  const defaultOgImage = toAbsoluteUrl(SEO.ogImagePath);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: FIVE_MIN, gcTime: TEN_MIN },
        },
      })
  );
  // Initialize Google Analytics once on client when GA_ID is set
  useEffect(() => {
    if (typeof window === 'undefined' || !GA_ID) return;
    if (!(window as unknown as { __GA_INIT?: boolean }).__GA_INIT) {
      ReactGA.initialize(GA_ID, { testMode: process.env.NODE_ENV === 'test' });
      (window as unknown as { __GA_INIT?: boolean }).__GA_INIT = true;
    }
  }, []);
  // Track page views when route changes
  useEffect(() => {
    if (GA_ID && router.isReady) ReactGA.pageview(router.asPath);
  }, [GA_ID, router.isReady, router.asPath]);

  return (
    <>
      <Head>
        <title key="title">{SEO.titleDefault}</title>
        <meta key="description" name="description" content={SEO.descriptionDefault} />
        <meta key="robots" name="robots" content="index, follow" />
        <link key="canonical" rel="canonical" href={canonical} />
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:site_name" property="og:site_name" content={SEO.siteName} />
        <meta key="og:title" property="og:title" content={SEO.titleDefault} />
        <meta key="og:description" property="og:description" content={SEO.descriptionDefault} />
        <meta key="og:url" property="og:url" content={canonical} />
        <meta key="og:image" property="og:image" content={defaultOgImage} />
        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
        <meta key="twitter:title" name="twitter:title" content={SEO.titleDefault} />
        <meta key="twitter:description" name="twitter:description" content={SEO.descriptionDefault} />
        <meta key="twitter:image" name="twitter:image" content={defaultOgImage} />
        <meta key="twitter:site" name="twitter:site" content={SEO.twitterHandle} />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </Head>
      <div className={dmSans.variable} style={{ minHeight: '100vh', width: '100%' }}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
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
