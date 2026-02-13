import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import Link from 'next/link';
import ListingForm from '../../components/ListingForm';
import { useAuth } from '../../lib/hooks/useAuth';
import { useUnitToggle } from '../../lib/hooks/useUnitToggle';
import { API, SQFT_CONVERSION_FACTOR, UI } from '../../lib/constants';
import Header from '../../components/Header';
import AdvancedFilters from '../../components/AdvancedFilters';
import { useState } from 'react';
import BottomNav from '../../components/ui/BottomNav';

export default function Listings() {
  const { isRealtor } = useAuth();
  const { isMetric } = useUnitToggle();
  const { ref, inView } = useInView();
  const [filters, setFilters] = useState({});
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['listings', filters],
    queryFn: ({ pageParam }) => fetch(`${API.LISTINGS}?page=${pageParam}`).then(res => res.json()),
    initialPageParam: 0,
    getNextPageParam: (lastPage: { nextPage?: number | null }) => lastPage.nextPage ?? undefined,
  });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const listings = data?.pages.flatMap(page => page.listings ?? []) ?? [];

  return (
    <div className="page-container">
      <Header />
      <main className="content-width pb-16 md:pb-8">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-primary-900 mb-6">Listings</h1>
          <AdvancedFilters onFilter={setFilters} />
          {isRealtor && <div className="mb-6"><ListingForm /></div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing: any) => (
            <article key={listing.id} className="card group">
              <Link href={`/listings/${listing.id}`} className="block">
                <div className="aspect-[4/3] w-full bg-primary-100 flex items-center justify-center text-primary-400 text-sm overflow-hidden">
                  {listing.images?.[0] ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover" /> : 'No image'}
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-primary-900 group-hover:text-accent-600 transition-colors line-clamp-2">{listing.title}</h2>
                  <p className="mt-2 text-lg font-semibold text-accent-600">
                    {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(listing.price ?? 0)}
                  </p>
                  <p className="mt-1 text-sm text-primary-600">
                    {listing.bedroomsTotal ?? '—'} bed · {listing.bathroomsTotal ?? '—'} bath
                    {listing.sizeSqm != null && ` · ${isMetric ? `${listing.sizeSqm} m²` : (listing.sizeSqm * SQFT_CONVERSION_FACTOR).toFixed(0)} sq ft`}
                  </p>
                  <p className="mt-2 text-primary-500 text-sm">{listing.location}</p>
                  <span className="inline-block mt-3 text-accent-600 font-medium text-sm">{UI.VIEW_DETAILS} →</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        {hasNextPage && <div ref={ref} className="text-center py-8 text-primary-500 text-sm">{UI.LOADING_MORE}</div>}
      </main>
      <BottomNav />
    </div>
  );
}
