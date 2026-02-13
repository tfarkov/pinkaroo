import dynamic from 'next/dynamic';
import { useQuery, useInfiniteQuery, useQueries } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { API, RECENTLY_VIEWED_LIMIT, STALE_TIME_5_MIN, UI, DEFAULT_NEARBY_RADIUS_KM, SQFT_CONVERSION_FACTOR } from '../lib/constants';
import { getMockListingsPage, getMockNearbyListings, getMockListing, getMockFavorites } from '../lib/mockData';
import { useGeolocation } from '../lib/hooks/useGeolocation';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import SafeListingImage from '../components/ui/SafeListingImage';

const HomeMap = dynamic(() => import('../components/HomeMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-500">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const position = useGeolocation();
  const { isMetric } = useUnitToggle();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [heroImageError, setHeroImageError] = useState(false);
  const { ref, inView } = useInView();

  const { data: nearbyListings = [] } = useQuery({
    queryKey: ['nearby', position],
    queryFn: async () => {
      try {
        const res = await fetch(`${API.LISTINGS_NEARBY}?lat=${position?.lat ?? ''}&lng=${position?.lng ?? ''}&radius=${DEFAULT_NEARBY_RADIUS_KM}`);
        if (res.ok) return res.json();
        return getMockNearbyListings();
      } catch {
        return getMockNearbyListings();
      }
    },
    staleTime: STALE_TIME_5_MIN,
  });

  const {
    data: listingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['listings-public'],
    queryFn: async ({ pageParam }) => {
      try {
        const res = await fetch(`${API.LISTINGS_PUBLIC}?page=${pageParam}`);
        if (res.ok) return res.json();
        return getMockListingsPage(pageParam);
      } catch {
        return getMockListingsPage(pageParam);
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: { nextPage?: number | null }) => lastPage.nextPage ?? undefined,
    staleTime: STALE_TIME_5_MIN,
  });

  const listings = listingsData?.pages.flatMap((p: { listings?: unknown[] }) => p.listings ?? []) ?? [];

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      try {
        const res = await fetch(API.FAVORITES, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockFavorites();
      } catch {
        return getMockFavorites();
      }
    },
    staleTime: STALE_TIME_5_MIN,
  });

  const recentIds = recentlyViewed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  const recentListingsQueries = useQueries({
    queries: recentIds.map((id) => ({
      queryKey: ['listing', id],
      queryFn: async () => {
        try {
          const res = await fetch(`${API.LISTINGS}/${id}`);
          if (res.ok) return res.json();
          return getMockListing(id);
        } catch {
          return getMockListing(id);
        }
      },
      staleTime: STALE_TIME_5_MIN,
    })),
  });

  useEffect(() => {
    let viewed: string[] = [];
    try {
      const raw = localStorage.getItem('recentlyViewed');
      const parsed = JSON.parse(raw || '[]');
      viewed = Array.isArray(parsed) ? parsed.filter((v: unknown) => typeof v === 'string' && (v as string).trim()) : [];
    } catch {
      viewed = [];
    }
    setRecentlyViewed(viewed.slice(-RECENTLY_VIEWED_LIMIT));
  }, []);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero with background image */}
        <section className="relative min-h-[320px] md:min-h-[420px] flex items-center justify-center text-white overflow-hidden">
          {heroImageError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-header to-slate-800" aria-hidden />
          ) : (
            <Image
              src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
              onError={() => setHeroImageError(true)}
            />
          )}
          <div className="absolute inset-0 bg-slate-900/50" aria-hidden />
          <div className="relative content-width text-center py-10 md:py-14 px-4">
            <h1 className="text-3xl md:text-6xl font-bold mb-3 tracking-tight">
              find a house. make it a home.
            </h1>
            <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Browse listings from trusted REALTORS® and save your favourites.
            </p>
            <Link
              href="/listings"
              className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-3 rounded-md text-lg transition-colors shadow-hero"
            >
              Find a Home
            </Link>
          </div>
        </section>

        <div className="content-width flex flex-col lg:flex-row gap-8 py-10">
          <div className="flex-1 min-w-0">
            {/* Map */}
            <section aria-labelledby="nearby-title" className="pb-10">
              <h2 id="nearby-title" className="text-2xl font-bold text-slate-900 mb-6">
                {UI.NEARBY_LISTINGS_TITLE}
              </h2>
              <div className="bg-white rounded-lg shadow-card overflow-hidden border border-slate-200">
                <HomeMap position={position} listings={nearbyListings as { id: string; latitude: number; longitude: number; title: string }[]} />
              </div>
            </section>

            {/* Browse Listings - infinite scroll */}
            <section aria-labelledby="listings-title" className="py-10">
              <h2 id="listings-title" className="text-2xl font-bold text-slate-900 mb-6">
                {UI.FEATURED_LISTINGS_TITLE}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing: { id: string; title: string; price: number; location?: string; images?: string[]; bedroomsTotal?: number; bathroomsTotal?: number; sizeSqm?: number }) => (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="block bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden hover:shadow-card-hover transition-shadow group"
                  >
                    <div className="aspect-[4/3] w-full bg-slate-200 overflow-hidden">
                      <SafeListingImage src={listing.images?.[0]} />
                    </div>
                    <div className="p-4">
                      <p className="text-xl font-bold text-accent-600">
                        {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(listing.price ?? 0)}
                      </p>
                      <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-accent-600 transition-colors line-clamp-2">
                        {listing.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {listing.bedroomsTotal ?? '—'} bed · {listing.bathroomsTotal ?? '—'} bath
                        {listing.sizeSqm != null && ` · ${isMetric ? `${listing.sizeSqm} m²` : (listing.sizeSqm * SQFT_CONVERSION_FACTOR).toFixed(0)} sq ft`}
                      </p>
                      {listing.location && <p className="mt-1 text-sm text-slate-500">{listing.location}</p>}
                      <span className="inline-block mt-3 text-accent-600 font-semibold text-sm">{UI.VIEW_LISTING} →</span>
                    </div>
                  </Link>
                ))}
              </div>
              {hasNextPage && (
                <div ref={ref} className="text-center py-8 text-slate-500 text-sm">
                  {isFetchingNextPage ? UI.LOADING_MORE : ''}
                </div>
              )}
              {listings.length === 0 && !isFetchingNextPage && (
                <p className="text-slate-500 py-10 text-center">No listings yet. Check back soon.</p>
              )}
            </section>

            {/* Recently Viewed */}
            <section aria-labelledby="recent-title" className="py-10 pb-14">
              <h2 id="recent-title" className="text-2xl font-bold text-slate-900 mb-6">
                {UI.RECENTLY_VIEWED_TITLE}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {recentListingsQueries.map((query, i) => {
                  const id = recentIds[i];
                  const listing = query.data;
                  return (
                    <Link
                      key={id}
                      href={`/listings/${encodeURIComponent(id)}`}
                      className="block bg-white rounded-lg shadow-card border border-slate-200 p-0 overflow-hidden hover:shadow-card-hover transition-shadow group"
                    >
                      <div className="aspect-[4/3] w-full bg-slate-200 overflow-hidden">
                        <SafeListingImage
                          src={listing?.images?.[0]}
                          placeholder={query.isLoading ? UI.LOADING : `Property #${id.slice(0, 8)}`}
                        />
                      </div>
                      <div className="p-4">
                        {listing?.title && (
                          <p className="font-semibold text-slate-900 group-hover:text-accent-600 transition-colors line-clamp-2">
                            {listing.title}
                          </p>
                        )}
                        <span className="text-accent-600 font-semibold group-hover:text-accent-700">
                          {UI.VIEW_LISTING} →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {recentIds.length === 0 && (
                <p className="text-slate-500 py-10 text-center">
                  No recently viewed listings yet. Browse listings to get started.
                </p>
              )}
            </section>
          </div>

          {/* Right sidebar - Favourites */}
          <aside className="lg:w-80 shrink-0" aria-labelledby="sidebar-favourites-title">
            <div className="lg:sticky lg:top-24 bg-white rounded-lg shadow-card border border-slate-200 p-4">
              <h2 id="sidebar-favourites-title" className="text-xl font-bold text-slate-900 mb-4">
                Favourites
              </h2>
              <Link href="/favorites" className="text-sm text-accent-600 font-semibold hover:underline mb-3 inline-block">
                View all →
              </Link>
              <ul className="space-y-3">
                {(favorites as { id: string; listing?: { id: string; title?: string; price?: number; images?: string[] } }[]).map((f: { id: string; listing?: { id: string; title?: string; price?: number; images?: string[] } }) => (
                  <li key={f.id}>
                    <Link
                      href={`/listings/${f.listing?.id ?? '#'}`}
                      className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <div className="w-16 h-12 shrink-0 rounded overflow-hidden bg-slate-200">
                        <SafeListingImage src={f.listing?.images?.[0]} placeholder="" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 group-hover:text-accent-600 line-clamp-2 text-sm">
                          {f.listing?.title ?? 'Listing'}
                        </p>
                        <p className="text-sm font-semibold text-accent-600">
                          {f.listing?.price != null
                            ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(f.listing.price)
                            : ''}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {(favorites as unknown[]).length === 0 && (
                <p className="text-slate-500 text-sm py-4">No favourites yet. Save listings to see them here.</p>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
