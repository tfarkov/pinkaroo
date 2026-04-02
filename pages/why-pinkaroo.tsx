import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { SEO, canonicalUrl, toAbsoluteUrl } from '../lib/seo';
import { useAuth } from '../lib/hooks/useAuth';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';

const CHANNEL_MIX = [
  { channel: 'Google Search (Simcoe intent)', allocation: '35%', monthly: '$1,050', goal: 'Capture active home searchers', kpi: 'Cost per qualified lead' },
  { channel: 'Meta Ads (FB/IG)', allocation: '20%', monthly: '$600', goal: 'Awareness + lead forms', kpi: 'Lead form completion rate' },
  { channel: 'Retargeting (Meta + Display)', allocation: '15%', monthly: '$450', goal: 'Re-engage visitors', kpi: 'Return visitor conversion' },
  { channel: 'Local SEO + Content', allocation: '20%', monthly: '$600', goal: 'Organic growth', kpi: 'Non-branded local traffic' },
  { channel: 'Partnerships', allocation: '10%', monthly: '$300', goal: 'Trust + referral leads', kpi: 'Referral signups' },
];

const AD_COPY_EXAMPLES = [
  {
    audience: 'Buyers',
    headline: 'Find Homes in Simcoe County Faster',
    body: 'Browse local listings with map-first search, smart filters, and favourites so you can compare homes in minutes.',
  },
  {
    audience: 'Eco-conscious buyers',
    headline: 'Find Greener Homes with Eco-Rating',
    body: 'Use Pinkaroo Eco-Rating insights to spot homes with stronger sustainability potential before you book a showing.',
  },
  {
    audience: 'Buyers',
    headline: 'Search Barrie and Simcoe with Confidence',
    body: 'Stop scrolling random listings. Pinkaroo helps you discover homes by city, budget, beds, baths, and map area.',
  },
  {
    audience: 'Realtors',
    headline: 'Get More Local Buyer Visibility',
    body: 'Join Pinkaroo to showcase listings locally and manage client workflows without juggling multiple tools.',
  },
  {
    audience: 'Brokers',
    headline: 'Support Team Growth with Better Insights',
    body: 'Track team activity, approvals, and weekly KPI trends from one clean broker dashboard.',
  },
];

const WHY_PINKAROO_STOCK_IMAGES = [
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412745/pinkaroo/mock-assets/bb4d1ea69adec350.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412746/pinkaroo/mock-assets/da868d444b391574.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412747/pinkaroo/mock-assets/f2d742c9dc41d29e.jpg',
];

export default function WhyPinkarooPage() {
  const { isSystemAdmin, isOfficeAdmin } = useAuth();
  const canViewAdminMarketingMaterials = isSystemAdmin || isOfficeAdmin;
  const title = 'Why Pinkaroo | Local-first Real Estate Platform';
  const description =
    'See how Pinkaroo helps buyers, realtors, and brokers with practical search tools, Eco-Rating insights, Simcoe-first growth strategy, and measurable weekly KPIs.';
  const canonical = canonicalUrl('/why-pinkaroo');
  const ogImage = toAbsoluteUrl(SEO.ogImagePath);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'Why Pinkaroo',
    url: canonical,
    description,
    publisher: {
      '@type': 'Organization',
      name: SEO.siteName,
      url: canonicalUrl('/'),
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content={SEO.siteName} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <div className="page-container flex flex-col">
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 content-width max-w-6xl py-8 pb-20">
          <section className="bg-white border border-slate-200 rounded-lg shadow-card p-6 md:p-8 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Why Pinkaroo</h1>
            <p className="text-slate-600 text-lg max-w-3xl">
              Pinkaroo is built to make local home discovery easier for buyers and more actionable for real estate professionals.
              We focus on practical search experience, clean workflows, and meaningful performance visibility.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/#listings" className="btn-primary">Start Searching</Link>
              <Link href="/mls-search" className="btn-secondary">Explore MLS Search</Link>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg shadow-card p-4 md:p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {WHY_PINKAROO_STOCK_IMAGES.map((src, idx) => (
                <div key={src} className="relative h-48 md:h-56 rounded-lg overflow-hidden">
                  <Image
                    src={src}
                    alt={`Pinkaroo sustainability and local real estate visual ${idx + 1}`}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg shadow-card p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Who it is for</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-md p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Buyers</h3>
                <p className="text-sm text-slate-600">Find and compare listings quickly with local filters, map browsing, favourites, and Eco-Rating context.</p>
              </div>
              <div className="border border-slate-200 rounded-md p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Realtors</h3>
                <p className="text-sm text-slate-600">Showcase listings, manage client touchpoints, and stay responsive through one platform.</p>
              </div>
              <div className="border border-slate-200 rounded-md p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Brokers</h3>
                <p className="text-sm text-slate-600">Monitor team outcomes, assignments, approvals, and weekly KPI trends with less friction.</p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-slate-300 rounded-lg shadow-card p-6 md:p-8 mb-8">
            <div className="inline-flex items-center rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold tracking-wide uppercase mb-4">
              Eco-Rating Focus
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Eco-Rating and sustainable practices that actually help decisions</h2>
            <p className="text-slate-700 mb-4">
              Pinkaroo believes better real estate decisions should support both families and the long-term health of our communities. Our Eco-Rating helps
              people understand sustainability signals earlier in the search process, so they can ask better questions before making big commitments.
            </p>
            <p className="text-slate-700 mb-6">
              We run the business the same way: practical product choices, responsible growth, and long-term value over short-term hype.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-1">Decision-ready visibility</h3>
                <p className="text-sm text-slate-700">Eco-Rating context appears where users are already evaluating homes and comparing options.</p>
              </article>
              <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-1">Practical sustainability</h3>
                <p className="text-sm text-slate-700">We prioritize durable product improvements that reduce waste and improve everyday workflows.</p>
              </article>
              <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900 mb-1">Long-term operating mindset</h3>
                <p className="text-sm text-slate-700">Our team is committed to sustainable business practices that strengthen trust over time.</p>
              </article>
            </div>
          </section>

          {canViewAdminMarketingMaterials && (
            <>
              <section className="bg-white border border-slate-200 rounded-lg shadow-card p-6 md:p-8 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Simcoe-first channel mix</h2>
                <p className="text-slate-600 mb-4">Example monthly media split using a CAD $3,000 starter budget.</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <caption className="sr-only">Simcoe-first marketing channel budget and KPI plan</caption>
                    <thead>
                      <tr className="text-left text-slate-500 border-b border-slate-200">
                        <th scope="col" className="py-2 pr-3">Channel</th>
                        <th scope="col" className="py-2 pr-3">Allocation</th>
                        <th scope="col" className="py-2 pr-3">Monthly</th>
                        <th scope="col" className="py-2 pr-3">Goal</th>
                        <th scope="col" className="py-2">Primary KPI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CHANNEL_MIX.map((item) => (
                        <tr key={item.channel} className="border-b border-slate-100">
                          <td className="py-2 pr-3 font-medium text-slate-900">{item.channel}</td>
                          <td className="py-2 pr-3 text-slate-700">{item.allocation}</td>
                          <td className="py-2 pr-3 text-slate-700">{item.monthly}</td>
                          <td className="py-2 pr-3 text-slate-700">{item.goal}</td>
                          <td className="py-2 text-slate-700">{item.kpi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-lg shadow-card p-6 md:p-8 mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Ad copy examples</h2>
                <p className="text-slate-600 mb-4">
                  Use these as starting points across search ads, social campaigns, landing pages, and broker outreach.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AD_COPY_EXAMPLES.map((copy) => (
                    <article key={copy.headline} className="border border-slate-200 rounded-md p-4">
                      <p className="text-xs uppercase tracking-wide text-accent-700 font-semibold mb-2">{copy.audience}</p>
                      <h3 className="font-semibold text-slate-900 mb-2">{copy.headline}</h3>
                      <p className="text-sm text-slate-600">{copy.body}</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="bg-header text-white rounded-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-2">Ready to explore Pinkaroo?</h2>
            <p className="text-white/90 mb-4 max-w-2xl">
              Start browsing local listings, or sign in to access role-specific dashboards built for buyers, realtors, and brokers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/#listings" className="btn-primary">Find a Home</Link>
              <Link href="/signin" className="btn-secondary">Sign in</Link>
            </div>
          </section>
        </main>
        <Footer />
        <BottomNav />
      </div>
    </>
  );
}
