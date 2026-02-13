import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import ReactGA from 'react-ga';
import { API, CONTENT_TYPE, DEFAULT_PROVINCE, GA, PROVINCES, PROPERTY_TYPES, UI } from '../lib/constants';
import Header from '../components/Header';
import AdvancedFilters from '../components/AdvancedFilters';
import BottomNav from '../components/ui/BottomNav';

interface SearchFormData {
  province: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
}

export default function MLSSearch() {
  const { register, handleSubmit } = useForm<SearchFormData>({ defaultValues: { province: DEFAULT_PROVINCE } });
  const [searchParams, setSearchParams] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: mlsListings, isLoading } = useQuery({
    queryKey: ['mls', searchParams],
    queryFn: () => fetch(`${API.MLS_SEARCH}?${searchParams}`).then(res => {
      if (!res.ok) throw new Error('MLS search failed');
      return res.json();
    }),
    enabled: !!searchParams,
  });
  const mutation = useMutation({
    mutationFn: (mlsData: any) => fetch(API.MLS_SEARCH, { method: 'POST', body: JSON.stringify({ mlsData }), headers: { 'Content-Type': CONTENT_TYPE.JSON } }),
    onSuccess: () => ReactGA.event({ category: GA.MLS, action: GA.MLS_IMPORT_SUCCESS }),
    onError: () => ReactGA.event({ category: GA.MLS, action: GA.MLS_IMPORT_FAILURE }),
  });

  const onSubmit = (data: SearchFormData) => {
    const params = new URLSearchParams(data as any).toString();
    setSearchParams(params);
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
        <main className="content-width flex items-center justify-center min-h-[40vh]"><p className="text-primary-500">{UI.SEARCHING_MLS}</p></main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      <main role="main" aria-labelledby="mls-title" className="content-width max-w-5xl pb-16 md:pb-8">
        <h1 id="mls-title" className="text-3xl font-bold text-primary-900 py-6">{UI.SEARCH_CANADIAN_MLS}</h1>
        <div className="card p-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="province" className="label">Province</label>
                <select id="province" {...register('province')} className="input-field" required>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="city" className="label">City (optional)</label>
                <input id="city" {...register('city')} className="input-field" placeholder="e.g. Barrie" />
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
                <label htmlFor="minSize" className="label">Min size (m²)</label>
                <input id="minSize" {...register('minSize')} type="number" className="input-field" />
              </div>
              <div>
                <label htmlFor="maxSize" className="label">Max size (m²)</label>
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
            <article key={listing.ListingKey} className="card" role="listitem">
              <div className="aspect-[4/3] w-full bg-primary-100 overflow-hidden">
                {listing.Media?.[0]?.MediaURL ? (
                  <Image src={listing.Media[0].MediaURL} alt={UI.IMAGE_OF_MLS_LISTING} width={300} height={200} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-primary-400 text-sm">No image</div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-primary-900">{listing.PropertyType} in {listing.City}</h2>
                <p className="text-sm text-primary-600 mt-1">{listing.StateOrProvince} ({listing.PostalCode})</p>
                <p className="text-sm text-primary-600 mt-2 line-clamp-2">{listing.PublicRemarks?.substring(0, 100)}...</p>
                <button type="button" onClick={() => importListing(listing)} className="btn-primary w-full mt-3">{UI.IMPORT_TO_MY_LISTINGS}</button>
              </div>
            </article>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
