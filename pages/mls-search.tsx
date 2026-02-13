import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import ReactGA from 'react-ga';
import { API, CONTENT_TYPE, DEFAULT_PROVINCE, GA, MLS_STANDARD_STATUSES, PROVINCES, PROPERTY_TYPES, UI, SQFT_CONVERSION_FACTOR } from '../lib/constants';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import { getMockMLSResults } from '../lib/mockData';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import SafeListingImage from '../components/ui/SafeListingImage';

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
  const { register, handleSubmit } = useForm<SearchFormData>({ defaultValues: { province: DEFAULT_PROVINCE, standardStatus: 'Active' } });
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
  const mutation = useMutation({
    mutationFn: (mlsData: any) => fetch(API.MLS_SEARCH, { method: 'POST', body: JSON.stringify({ mlsData }), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => ReactGA.event({ category: GA.MLS, action: GA.MLS_IMPORT_SUCCESS }),
    onError: () => ReactGA.event({ category: GA.MLS, action: GA.MLS_IMPORT_FAILURE }),
  });

  const onSubmit = (data: SearchFormData) => {
    const params = new URLSearchParams();
    const payload = { ...data };
    if (!isMetric) {
      if (payload.minSize != null && payload.minSize !== '') {
        payload.minSize = Number(payload.minSize) / SQFT_CONVERSION_FACTOR;
      }
      if (payload.maxSize != null && payload.maxSize !== '') {
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

  const importListing = (mlsData: any) => {
    mutation.mutate(mlsData);
    ReactGA.event({ category: GA.MLS, action: GA.MLS_IMPORT_ATTEMPT, label: mlsData.ListingKey });
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Header />
        <main className="content-width flex items-center justify-center min-h-[40vh]"><p className="text-slate-500">{UI.SEARCHING_MLS}</p></main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main role="main" aria-labelledby="mls-title" className="flex-1 content-width max-w-5xl pb-14">
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
                <select id="province" {...register('province')} className="input-field" required>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list" aria-label="MLS search results">
          {mlsListings?.map((listing: any) => (
            <article key={listing.ListingKey} className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden" role="listitem">
              <div className="aspect-[4/3] w-full bg-slate-200 overflow-hidden">
                <SafeListingImage src={listing.Media?.[0]?.MediaURL} alt={UI.IMAGE_OF_MLS_LISTING} />
              </div>
              <div className="p-4">
                <h2 className="font-bold text-slate-900">{listing.PropertyType} in {listing.City}</h2>
                <p className="text-sm text-slate-600 mt-1">{listing.StateOrProvince} ({listing.PostalCode})</p>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{listing.PublicRemarks?.substring(0, 100)}...</p>
                <button type="button" onClick={() => importListing(listing)} className="btn-primary w-full mt-3">{UI.IMPORT_TO_MY_LISTINGS}</button>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
