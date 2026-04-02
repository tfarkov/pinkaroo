import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactGA from 'react-ga';
import Head from 'next/head';
import { API, DEFAULT_PROVINCE, GA, MLS_STANDARD_STATUSES, PROVINCES, PROPERTY_TYPES, UI, SQFT_CONVERSION_FACTOR } from '../lib/constants';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import { getMockMLSResults } from '../lib/mockData';
import { SEO, canonicalUrl, toAbsoluteUrl } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import ListingCard from '../components/ListingCard';
import type { ListingBasic } from '../lib/types';

interface SearchFormData {
  province: string;
  city?: string;
  postalCode?: string;
  standardStatus?: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
}

export default function MLSSearch() {
  const title = 'Canadian MLS Search | Pinkaroo';
  const description =
    'Search Canadian MLS listings by city, postal code, property type, price, size, beds, and baths with a clean local-first experience.';
  const canonical = canonicalUrl('/mls-search');
  const ogImage = toAbsoluteUrl(SEO.ogImagePath);
  const { register, handleSubmit, formState: { errors } } = useForm<SearchFormData>({ defaultValues: { province: DEFAULT_PROVINCE, standardStatus: 'Active' }, mode: 'onBlur' });
  const { isMetric } = useUnitToggle();
  const [searchParams, setSearchParams] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: mlsListings, isLoading } = useQuery({
    queryKey: ['mls', searchParams],
    queryFn: async () => {
      try {
        const res = await fetch(`${API.MLS_SEARCH}?${searchParams}`);
        if (res.ok) return res.json();
        return getMockMLSResults();
      } catch {
        return getMockMLSResults();
      }
    },
    enabled: !!searchParams,
  });
  const resultCount = Array.isArray(mlsListings) ? mlsListings.length : 0;

  const onSubmit = (data: SearchFormData) => {
    const params = new URLSearchParams();
    const payload = { ...data };
    if (!isMetric) {
      if (payload.minSize != null && String(payload.minSize).trim() !== '') {
        payload.minSize = Number(payload.minSize) / SQFT_CONVERSION_FACTOR;
      }
      if (payload.maxSize != null && String(payload.maxSize).trim() !== '') {
        payload.maxSize = Number(payload.maxSize) / SQFT_CONVERSION_FACTOR;
      }
    }
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) params.set(k, String(v));
    });
    setSearchParams(params.toString());
    setError(null);
    ReactGA.event({ category: GA.MLS, action: GA.MLS_SEARCH, label: data.province });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Header />
        <main id="main-content" tabIndex={-1} className="content-width flex items-center justify-center min-h-[40vh]">
          <p className="text-slate-500" role="status" aria-live="polite">{UI.SEARCHING_MLS}</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO.siteName} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </Head>
      <Header />
      <main id="main-content" role="main" tabIndex={-1} aria-labelledby="mls-title" className="flex-1 content-width max-w-5xl pb-14">
        <h1 id="mls-title" className="text-3xl font-bold text-slate-900 py-8">{UI.SEARCH_CANADIAN_MLS}</h1>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="standardStatus" className="label">Listing status</label>
                <select id="standardStatus" {...register('standardStatus')} className="input-field">
                  <option value="Active">Active</option>
                  <option value="Any">Any</option>
                  {MLS_STANDARD_STATUSES.filter(s => s !== 'Active').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="province" className="label">Province</label>
                <select id="province" {...register('province', { required: 'Province is required' })} className="input-field" aria-invalid={!!errors.province}>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <p className="text-red-600 text-sm mt-1" role="alert">{errors.province.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="label">City (optional)</label>
                <input id="city" {...register('city')} className="input-field" placeholder="e.g. Barrie" />
              </div>
              <div>
                <label htmlFor="postalCode" className="label">Postal code (optional)</label>
                <input id="postalCode" {...register('postalCode')} className="input-field" placeholder="e.g. L4M or L4M 1A1" maxLength={7} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="minPrice" className="label">Min price (CAD)</label>
                <input id="minPrice" {...register('minPrice')} type="number" className="input-field" />
              </div>
              <div>
                <label htmlFor="maxPrice" className="label">Max price (CAD)</label>
                <input id="maxPrice" {...register('maxPrice')} type="number" className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="minSize" className="label">Min size ({isMetric ? 'm²' : 'sq ft'})</label>
                <input id="minSize" {...register('minSize')} type="number" className="input-field" />
              </div>
              <div>
                <label htmlFor="maxSize" className="label">Max size ({isMetric ? 'm²' : 'sq ft'})</label>
                <input id="maxSize" {...register('maxSize')} type="number" className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bedrooms" className="label">Bedrooms</label>
                <input id="bedrooms" {...register('bedrooms')} type="number" className="input-field" />
              </div>
              <div>
                <label htmlFor="bathrooms" className="label">Bathrooms</label>
                <input id="bathrooms" {...register('bathrooms')} type="number" className="input-field" />
              </div>
            </div>
            <div>
              <label htmlFor="propertyType" className="label">Property type</label>
              <select id="propertyType" {...register('propertyType')} className="input-field">
                <option value="">Any</option>
                {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto">Search MLS</button>
          </form>
        </div>
        {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
        {!!searchParams && !error && (
          <p className="text-sm text-slate-600 mb-4" role="status" aria-live="polite">
            {resultCount === 1 ? '1 listing found.' : `${resultCount} listings found.`}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="MLS search results">
          {mlsListings?.map((listing: any) => (
            <article key={listing.ListingKey} role="listitem">
              <ListingCard
                listing={{
                  id: '',
                  title: `${listing.PropertyType ?? 'Property'} in ${listing.City ?? 'Unknown city'}`,
                  price: typeof listing.ListPrice === 'number' ? listing.ListPrice : undefined,
                  location: [listing.StateOrProvince, listing.PostalCode].filter(Boolean).join(' '),
                  images: listing.Media?.[0]?.MediaURL ? [listing.Media[0].MediaURL] : [],
                  bedroomsTotal: listing.BedroomsTotal,
                  bathroomsTotal: listing.BathroomsTotalInteger,
                  sizeSqm: listing.LivingArea,
                } as ListingBasic}
                isMetric={isMetric}
                imagePlaceholder={UI.IMAGE_OF_MLS_LISTING}
              />
            </article>
          ))}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
