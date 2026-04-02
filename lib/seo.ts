const FALLBACK_SITE_URL = 'https://pinkaroo.ca';

export const SEO = {
  siteName: 'Pinkaroo',
  titleDefault: 'Pinkaroo | Local-first Real Estate Platform',
  descriptionDefault:
    'Discover homes with map-first search, smart filters, and trusted local real estate workflows for buyers, realtors, and brokers.',
  twitterHandle: '@pinkaroo',
  ogImagePath: '/logo-white.png',
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || FALLBACK_SITE_URL;
  return trimTrailingSlash(envUrl);
}

export function toAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${getSiteUrl()}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

export function canonicalUrl(pathname: string): string {
  const base = getSiteUrl();
  if (!pathname || pathname === '/') return `${base}/`;
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${cleanPath}`;
}
