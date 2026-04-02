import type { GetServerSideProps } from 'next';
import { canonicalUrl } from '../lib/seo';

const STATIC_ROUTES = ['/', '/mls-search', '/why-pinkaroo', '/privacy', '/terms', '/cookie-policy'];

export default function SitemapXml() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const now = new Date().toISOString();

  const urls = STATIC_ROUTES.map((route) => {
    const location = canonicalUrl(route);
    const priority = route === '/' ? '1.0' : '0.7';
    const changefreq = route === '/' ? 'daily' : 'weekly';
    return `
  <url>
    <loc>${location}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  res.setHeader('Content-Type', 'text/xml');
  res.write(xml);
  res.end();

  return { props: {} };
};
