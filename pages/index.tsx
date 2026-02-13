import dynamic from 'next/dynamic';
import { useQuery, useInfiniteQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { API, CONTENT_TYPE, STALE_TIME_5_MIN, UI, DEFAULT_NEARBY_RADIUS_KM, DEFAULT_PROVINCE } from '../lib/constants';
import { getMockListingsPage, getMockNearbyListings, getMockListing, getMockFavorites, getMockPinkarooTeam } from '../lib/mockData';
import { useGeolocation } from '../lib/hooks/useGeolocation';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import { useRecentlyViewed } from '../lib/hooks/useRecentlyViewed';
import { useAuth } from '../lib/hooks/useAuth';
import { formatPrice } from '../lib/format';
import type { ListingBasic, ListingWithCoords, FavoriteItem, RealtorTeamMember } from '../lib/types';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import SafeListingImage from '../components/ui/SafeListingImage';
import ListingCard from '../components/ListingCard';
import ContactRealtorCard from '../components/ContactRealtorCard';
import AdvancedFilters from '../components/AdvancedFilters';

type FilterParams = Record<string, string | number | undefined>;

function buildQueryParams(filters: FilterParams, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams();
  Object.entries({ ...filters, ...extra }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

const HomeMap = dynamic(() => import('../components/HomeMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[420px] bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-500">
      Loading map…
    </div>
  ),
});

export default function Home() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const position = useGeolocation();
  const { isMetric } = useUnitToggle();
  const recentIds = useRecentlyViewed();
  const [heroImageError, setHeroImageError] = useState(false);
  const [filters, setFilters] = useState<FilterParams>({ province: DEFAULT_PROVINCE });
  const { ref, inView } = useInView();

  const favoriteMutation = useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) => {
      const res = await fetch(API.FAVORITES, {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        credentials: 'include',
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok && res.status !== 400) throw new Error('Failed to update favourite');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const handleFavoriteClick = (listingId: string, isFavorited: boolean) => {
    favoriteMutation.mutate({ listingId, isFavorited });
  };

  const nearbyParams = buildQueryParams(filters, {
    lat: String(position?.lat ?? ''),
    lng: String(position?.lng ?? ''),
    radius: String(DEFAULT_NEARBY_RADIUS_KM),
  });

  const { data: nearbyListings = [] } = useQuery({
    queryKey: ['nearby', position, filters],
    queryFn: async () => {
      try {
        const res = await fetch(`${API.LISTINGS_NEARBY}${nearbyParams}`);
        if (res.ok) return res.json();
        return getMockNearbyListings();
      } catch {
        return getMockNearbyListings();
      }
    },
    staleTime: STALE_TIME_5_MIN,
  });

  const listParams = (page: number) => buildQueryParams(filters, { page: String(page) });

  const {
    data: listingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['listings-public', filters],
    queryFn: async ({ pageParam }) => {
      try {
        const res = await fetch(`${API.LISTINGS_PUBLIC}${listParams(pageParam)}`);
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

  const listings: ListingBasic[] = listingsData?.pages.flatMap((p: { listings?: ListingBasic[] }) => p.listings ?? []) ?? [];

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch(API.FAVORITES, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: STALE_TIME_5_MIN,
    enabled: isAuthenticated,
  });

  const { data: pinkarooTeam = [], isLoading: pinkarooLoading } = useQuery({
    queryKey: ['realtors-pinkaroo'],
    queryFn: async () => {
      try {
        const res = await fetch(API.REALTORS_PINKAROO);
        if (res.ok) return res.json();
        return getMockPinkarooTeam();
      } catch {
        return getMockPinkarooTeam();
      }
    },
    staleTime: STALE_TIME_5_MIN,
  });

  const recentListingsQueries = useQueries({
    queries: recentIds.map((id: string) => ({
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
              href="/#listings"
              className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-3 rounded-md text-lg transition-colors shadow-hero"
            >
              Find a Home
            </Link>
          </div>
        </section>

        {/* Full-width filters under hero */}
        <section className="w-full border-b border-slate-200 bg-white shadow-sm" aria-label="Search filters">
          <div className="px-4 py-4 md:px-6 md:py-5">
            <AdvancedFilters onFilter={(data) => setFilters({ ...data })} />
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
                <HomeMap position={position} listings={nearbyListings as ListingWithCoords[]} />
              </div>
            </section>

            {/* Browse Listings - infinite scroll */}
            <section id="listings" aria-labelledby="listings-title" className="py-10">
              <h2 id="listings-title" className="text-2xl font-bold text-slate-900 mb-6">
                {UI.FEATURED_LISTINGS_TITLE}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isMetric={isMetric}
                    isFavorited={(favorites as FavoriteItem[]).some((f) => f.listing?.id === listing.id)}
                    onFavoriteClick={isAuthenticated ? (id) => handleFavoriteClick(id, (favorites as FavoriteItem[]).some((f) => f.listing?.id === id)) : undefined}
                  />
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
                  const listing = query.data as ListingBasic | undefined;
                  return (
                    <ListingCard
                      key={id}
                      listing={listing ?? { id }}
                      variant="recent"
                      imagePlaceholder={query.isLoading ? UI.LOADING : 'Property #' + id.slice(0, 8)}
                      isFavorited={(favorites as FavoriteItem[]).some((f) => f.listing?.id === id)}
                      onFavoriteClick={isAuthenticated ? (listingId) => handleFavoriteClick(listingId, (favorites as FavoriteItem[]).some((f) => f.listing?.id === listingId)) : undefined}
                    />
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

          {/* Right sidebar - Favourites (signed in only) + Contact a Realtor */}
          <aside className="lg:w-80 shrink-0" aria-labelledby={isAuthenticated ? 'sidebar-favourites-title' : 'sidebar-realtors-title'}>
            {isAuthenticated && (
            <div className="lg:sticky lg:top-24 bg-white rounded-lg shadow-card border border-slate-200 p-4">
              <h2 id="sidebar-favourites-title" className="text-xl font-bold text-slate-900 mb-4">
                Favourites
              </h2>
              <Link href="/favorites" className="text-sm text-accent-600 font-semibold hover:underline mb-3 inline-block">
                View all →
              </Link>
              <ul className="space-y-3">
                {(favorites as FavoriteItem[]).map((f) => (
                  <li key={f.id}>
                    <Link
                      href={'/listings/' + (f.listing?.id ?? '#')}
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
                          {f.listing?.price != null ? formatPrice(f.listing.price) : ''}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {(favorites as FavoriteItem[]).length === 0 && (
                <p className="text-slate-500 text-sm py-4">No favourites yet. Save listings to see them here.</p>
              )}
            </div>
            )}

            {/* Contact a Realtor */}
            <div className={`lg:sticky lg:top-24 bg-white rounded-lg shadow-card border border-slate-200 p-4 ${isAuthenticated ? 'mt-6' : ''}`} aria-labelledby="sidebar-realtors-title">
              <h2 id="sidebar-realtors-title" className="text-xl font-bold text-slate-900 mb-2">
                Contact a Realtor
              </h2>
              <p className="text-slate-600 text-sm mb-4">Pinkaroo Real Estate</p>
              <ContactRealtorCard
                realtor={(pinkarooTeam as RealtorTeamMember[]).filter((m) => m.role === 'REALTOR')[0] ?? null}
                isLoading={pinkarooLoading}
              />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
