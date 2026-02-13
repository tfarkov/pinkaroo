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
import Footer from '../../components/Footer';
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
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width pb-14">
        <div className="py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Find a Home</h1>
          <AdvancedFilters onFilter={setFilters} />
          {isRealtor && <div className="mt-6"><ListingForm /></div>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing: any) => (
            <article key={listing.id} className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden hover:shadow-card-hover transition-shadow group">
              <Link href={`/listings/${listing.id}`} className="block">
                <div className="aspect-[4/3] w-full bg-slate-200 overflow-hidden">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">No image</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xl font-bold text-accent-600">
                    {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(listing.price ?? 0)}
                  </p>
                  <h2 className="mt-1 font-semibold text-slate-900 group-hover:text-accent-600 transition-colors line-clamp-2">
                    {listing.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {listing.bedroomsTotal ?? '—'} bed · {listing.bathroomsTotal ?? '—'} bath
                    {listing.sizeSqm != null && ` · ${isMetric ? `${listing.sizeSqm} m²` : (listing.sizeSqm * SQFT_CONVERSION_FACTOR).toFixed(0)} sq ft`}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{listing.location}</p>
                  <span className="inline-block mt-3 text-accent-600 font-semibold text-sm">View Details →</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        {hasNextPage && <div ref={ref} className="text-center py-8 text-slate-500 text-sm">{UI.LOADING_MORE}</div>}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
