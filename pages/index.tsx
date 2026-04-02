import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useQuery, useInfiniteQuery, useQueries } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { API, STALE_TIME_5_MIN, UI, DEFAULT_NEARBY_RADIUS_KM, DEFAULT_PROVINCE, DEFAULT_LOCATION, NEARBY_POOL_RADIUS_KM, getListingPageUrl } from '../lib/constants';
import { useGeolocation } from '../lib/hooks/useGeolocation';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import { useRecentlyViewed } from '../lib/hooks/useRecentlyViewed';
import { useFavorites } from '../lib/hooks/useFavorites';
import { formatPrice } from '../lib/format';
import type { ListingBasic, ListingWithCoords, FavoriteItem, RealtorTeamMember } from '../lib/types';
import type { ListingSortValue } from '../lib/listings';
import { buildQueryParams } from '../lib/utils/queryParams';
import type { FilterParams } from '../lib/utils/queryParams';
import { distanceKm, radiusKmFromZoom } from '../lib/utils/geo';
import { sortListings, LISTING_SORT_OPTIONS } from '../lib/listings';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import SafeListingImage from '../components/ui/SafeListingImage';
import ListingCard from '../components/ListingCard';
import ContactRealtorCard from '../components/ContactRealtorCard';
import AdvancedFilters from '../components/AdvancedFilters';
import LoadingMore from '../components/ui/LoadingMore';
import EmptyState from '../components/ui/EmptyState';
import { SEO, canonicalUrl, toAbsoluteUrl } from '../lib/seo';

type HomeFilterData = {
  province: string;
  city: string;
  minPrice: string | number;
  maxPrice: string | number;
  bedrooms: string | number;
  bathrooms: string | number;
  propertyType: string;
};

const HomeMap = dynamic(() => import('../components/HomeMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] sm:h-[420px] bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-slate-500">
      Loading map…
    </div>
  ),
});

const HERO_IMAGE_SOURCES = [
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412745/pinkaroo/mock-assets/bb4d1ea69adec350.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412746/pinkaroo/mock-assets/da868d444b391574.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412747/pinkaroo/mock-assets/f2d742c9dc41d29e.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412748/pinkaroo/mock-assets/2c65c0cb8f88046a.jpg',
];
const HERO_IMAGES = HERO_IMAGE_SOURCES;

const HERO_PHRASES = [
  'Find a House. Make It a Home.',
  'Discover Listings That Fit Your Lifestyle.',
  'Your Next Move Starts with Pinkaroo.',
  'Browse Smarter. Buy with Confidence.',
];

/**
 * Home page: hero, map with listing pins, browse list (filtered by map center/radius),
 * recently viewed, and sidebar (favourites + contact realtor).
 * Listings from /api/listings/nearby (haversine, indexed lat/lng, default 50km) and
 * /api/listings/public. User position from geolocation with fallback to Barrie, ON.
 */
export default function Home() {
  const router = useRouter();
  const title = 'Find Homes in Simcoe and Beyond | Pinkaroo';
  const description =
    'Map-first home search with advanced filters, recently viewed homes, and favourites to help buyers find the right property faster.';
  const canonical = canonicalUrl('/');
  const ogImage = toAbsoluteUrl(SEO.ogImagePath);
  const position = useGeolocation(); // Barrie, ON when geolocation unavailable or denied
  const { isMetric } = useUnitToggle();
  const recentIds = useRecentlyViewed();
  const { favorites, isFavorited, toggleFavorite } = useFavorites();
  const [heroImageError, setHeroImageError] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [heroPhraseIndex, setHeroPhraseIndex] = useState(0);
  const [filters, setFilters] = useState<FilterParams>({ province: DEFAULT_PROVINCE });
  const [listingsSort, setListingsSort] = useState<string>('default');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showSignedOutMessage, setShowSignedOutMessage] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({ rootMargin: '200px', threshold: 0 });
  /** IntersectionObserver: prefetch next page when sentinel is ~300px from viewport for smoother infinite scroll. */
  const { ref: loadMoreRef, inView: loadMoreInView } = useInView({ rootMargin: '300px', threshold: 0 });
  const [mapView, setMapView] = useState<{ center: { lat: number; lng: number }; zoom: number } | null>(null);
  const [mapExpandedRadiusKm, setMapExpandedRadiusKm] = useState<number | null>(null);
  const sentinelExpandedRef = useRef(false);

  // Close sort dropdown on outside click or Escape
  useEffect(() => {
    if (!sortDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) setSortDropdownOpen(false);
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setSortDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [sortDropdownOpen]);

  const mapCenter = mapView?.center ?? position ?? DEFAULT_LOCATION;
  const mapZoom = mapView?.zoom ?? 12;
  const nearbyRadiusKm = radiusKmFromZoom(mapZoom);

  /** Single fetch: pool of listings within NEARBY_POOL_RADIUS_KM of initial center. No refetch on pan/zoom. */
  const poolCenter = position ?? DEFAULT_LOCATION;
  const nearbyParams = buildQueryParams(filters, {
    lat: String(poolCenter.lat),
    lng: String(poolCenter.lng),
    radius: String(NEARBY_POOL_RADIUS_KM),
  });

  const { data: nearbyPool = [], isFetching: isNearbyFetching } = useQuery({
    queryKey: ['nearby', poolCenter.lat, poolCenter.lng, NEARBY_POOL_RADIUS_KM, filters],
    queryFn: async () => {
      const res = await fetch(`${API.LISTINGS_NEARBY}${nearbyParams}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: STALE_TIME_5_MIN,
    retry: 1,
  });

  /** Pins: filter pool by current center + effective radius only (no refetch). */
  const mapFilterRadiusKm =
    mapView == null ? nearbyRadiusKm : Math.min(NEARBY_POOL_RADIUS_KM, Math.max(nearbyRadiusKm, mapExpandedRadiusKm ?? nearbyRadiusKm));
  const mapListings = useMemo(() => {
    const list = nearbyPool as (ListingWithCoords & { latitude?: number; longitude?: number })[];
    if (list.length === 0) return list as ListingWithCoords[];
    const lat = mapCenter.lat;
    const lng = mapCenter.lng;
    return list.filter(
      (l) =>
        l.latitude != null &&
        l.longitude != null &&
        distanceKm({ lat: l.latitude, lng: l.longitude }, { lat, lng }) <= mapFilterRadiusKm
    ) as ListingWithCoords[];
  }, [nearbyPool, mapCenter.lat, mapCenter.lng, mapFilterRadiusKm]);

  /** Expand map pin radius on scroll when map is active (still no refetch; only pool filtering changes). */
  const effectiveNearbyRadiusKm =
    mapView == null
      ? DEFAULT_NEARBY_RADIUS_KM
      : Math.min(NEARBY_POOL_RADIUS_KM, Math.max(nearbyRadiusKm, mapExpandedRadiusKm ?? nearbyRadiusKm));

  const canExpandNearby = mapView != null && effectiveNearbyRadiusKm < NEARBY_POOL_RADIUS_KM;

  // Reset "already expanded" when sentinel scrolls out of view so next scroll-to-bottom can expand again
  useEffect(() => {
    if (!inView) sentinelExpandedRef.current = false;
  }, [inView]);

  // Expand radius only once per scroll-to-bottom to avoid flicker from rapid re-renders
  useEffect(() => {
    if (!mapView || !inView || !canExpandNearby || isNearbyFetching || sentinelExpandedRef.current) return;
    sentinelExpandedRef.current = true;
    setMapExpandedRadiusKm((prev) => {
      const current = prev ?? nearbyRadiusKm;
      if (current >= NEARBY_POOL_RADIUS_KM) return prev;
      return Math.min(NEARBY_POOL_RADIUS_KM, Math.round(current * 2));
    });
  }, [inView, mapView, canExpandNearby, isNearbyFetching, nearbyRadiusKm]);

  const handleMapChange = useCallback((view: { center: { lat: number; lng: number }; zoom: number }) => {
    setMapView(view);
    setMapExpandedRadiusKm(null);
  }, []);

  const listParams = (page: number) => buildQueryParams(filters, { page: String(page) });

  const {
    data: listingsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching: isListingsFetching,
    isError: isListingsError,
  } = useInfiniteQuery({
    queryKey: ['listings-public', filters],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`${API.LISTINGS_PUBLIC}${listParams(pageParam)}`);
      if (!res.ok) return { listings: [], nextPage: null };
      const data = await res.json();
      return { listings: data?.listings ?? [], nextPage: data?.nextPage ?? null };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: { nextPage?: number | null }) => lastPage.nextPage ?? undefined,
    staleTime: STALE_TIME_5_MIN,
    retry: 1,
  });

  const listings: ListingBasic[] = useMemo(
    () => listingsData?.pages.flatMap((p: { listings?: ListingBasic[] }) => p.listings ?? []) ?? [],
    [listingsData]
  );

  const sortedListings = useMemo(
    () => sortListings(listings, listingsSort as ListingSortValue),
    [listings, listingsSort]
  );
  const selectedSortLabel = useMemo(
    () => LISTING_SORT_OPTIONS.find((opt) => opt.value === listingsSort)?.label ?? 'Sort',
    [listingsSort]
  );

  const { data: pinkarooTeam = [], isLoading: pinkarooLoading } = useQuery({
    queryKey: ['realtors-pinkaroo'],
    queryFn: async () => {
      const res = await fetch(API.REALTORS_PINKAROO);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: STALE_TIME_5_MIN,
  });

  /** Exclude reserved path segments that are not listing IDs (e.g. "new" for /listings/new). */
  const recentListingIds = useMemo(
    () => recentIds.filter((id: string) => id !== 'new' && id.trim().length > 0),
    [recentIds]
  );
  const recentListingsQueries = useQueries({
    queries: recentListingIds.map((id: string) => ({
      queryKey: ['listing', id],
      queryFn: async () => {
        const res = await fetch(`${API.LISTINGS}/${id}`);
        if (!res.ok) return undefined;
        return res.json();
      },
      staleTime: STALE_TIME_5_MIN,
    })),
  });
  const defaultSortValue: ListingSortValue = LISTING_SORT_OPTIONS[0].value;
  const recentListingsById = useMemo(() => {
    const byId = new Map<string, { listing?: ListingBasic; isLoading: boolean }>();
    recentListingsQueries.forEach((query, index) => {
      const id = recentListingIds[index];
      if (!id) return;
      byId.set(id, { listing: query.data as ListingBasic | undefined, isLoading: query.isLoading });
    });
    return byId;
  }, [recentListingsQueries, recentListingIds]);
  const sortedRecentListingIds = useMemo(() => {
    const withListing: ListingBasic[] = [];
    const withoutListing: string[] = [];
    recentListingIds.forEach((id) => {
      const entry = recentListingsById.get(id);
      if (entry?.listing) withListing.push(entry.listing);
      else withoutListing.push(id);
    });
    const sortedWithListing = sortListings(withListing, defaultSortValue);
    return [...sortedWithListing.map((listing) => listing.id), ...withoutListing];
  }, [recentListingIds, recentListingsById, defaultSortValue]);
  const handleFilterChange = useCallback((data: HomeFilterData) => {
    setFilters({ ...data } as FilterParams);
  }, []);
  const listingById = useMemo(() => {
    const byId = new Map<string, ListingBasic>();
    listings.forEach((listing) => {
      byId.set(listing.id, listing);
    });
    recentListingsById.forEach((entry, id) => {
      if (entry.listing) byId.set(id, entry.listing);
    });
    return byId;
  }, [listings, recentListingsById]);
  const handleFavoriteClick = useCallback(
    (listingId: string) => {
      const listing = listingById.get(listingId);
      toggleFavorite(
        listingId,
        listing ? { id: listing.id, title: listing.title, price: listing.price, images: listing.images } : undefined
      );
    },
    [toggleFavorite, listingById]
  );

  useEffect(() => {
    if (loadMoreInView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [loadMoreInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Select one hero background image on page load only.
  useEffect(() => {
    setHeroImageIndex(Math.floor(Math.random() * HERO_IMAGES.length));
  }, []);

  useEffect(() => {
    setHeroImageError(false);
  }, [heroImageIndex]);

  // Select one hero headline phrase on page load only.
  useEffect(() => {
    setHeroPhraseIndex(Math.floor(Math.random() * HERO_PHRASES.length));
  }, []);

  useEffect(() => {
    if (router.query.signedOut !== '1') return;
    setShowSignedOutMessage(true);
    router.replace('/', undefined, { shallow: true });
  }, [router]);

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
      <main id="main-content" tabIndex={-1} className="flex-1">
        {/* Hero with background image */}
        <section className="relative min-h-[320px] md:min-h-[420px] flex items-center justify-center text-white overflow-hidden">
          {heroImageError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-header to-slate-800" aria-hidden />
          ) : (
            <Image
              key={HERO_IMAGES[heroImageIndex]}
              src={HERO_IMAGES[heroImageIndex]}
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
              {HERO_PHRASES[heroPhraseIndex]}
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

        <div className="content-width flex flex-col lg:flex-row gap-8 py-10">
          <div className="flex-1 min-w-0">
            {showSignedOutMessage && (
              <div
                role="status"
                aria-live="polite"
                className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm flex items-start justify-between gap-3"
              >
                <span>You have been signed out successfully. Thanks for visiting Pinkaroo.</span>
                <button
                  type="button"
                  onClick={() => setShowSignedOutMessage(false)}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold"
                  aria-label="Dismiss signed out message"
                >
                  Dismiss
                </button>
              </div>
            )}
            {/* Map */}
            <section aria-labelledby="nearby-title" className="pb-10">
              <h2 id="nearby-title" className="text-2xl font-bold text-slate-900 mb-6">
                {UI.NEARBY_LISTINGS_TITLE}
              </h2>
              <div className="bg-white rounded-lg shadow-card overflow-hidden border border-slate-200">
                <HomeMap
                  position={position ?? undefined}
                  currentView={mapView}
                  listings={mapListings}
                  onMapChange={handleMapChange}
                />
              </div>
              {mapListings.length === 0 && (
                <p className="mt-3 text-sm text-slate-500">No mappable listings found in the current view.</p>
              )}
            </section>

            {/* Recently Viewed */}
            <section aria-labelledby="recent-title" className="py-10 pb-14">
              <h2 id="recent-title" className="text-2xl font-bold text-slate-900 mb-6">
                {UI.RECENTLY_VIEWED_TITLE}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedRecentListingIds.map((id) => {
                  const entry = recentListingsById.get(id);
                  const listing = entry?.listing;
                  return (
                    <ListingCard
                      key={id}
                      listing={listing ?? { id }}
                      variant="recent"
                      imagePlaceholder={entry?.isLoading ? UI.LOADING : 'Property #' + id.slice(0, 8)}
                      isFavorited={isFavorited(id)}
                      onFavoriteClick={handleFavoriteClick}
                    />
                  );
                })}
              </div>
              {recentListingIds.length === 0 && (
                <EmptyState message="No recently viewed listings yet. Browse listings to get started." />
              )}
            </section>

            {/* Browse Listings - infinite scroll */}
            <section id="listings" aria-labelledby="listings-title" className="py-10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 id="listings-title" className="text-2xl font-bold text-slate-900">
                  {UI.FEATURED_LISTINGS_TITLE}
                </h2>
                <div className="flex items-center shrink-0 w-full sm:w-auto" ref={sortDropdownRef}>
                  <div className="relative inline-flex w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSortDropdownOpen((open) => !open)}
                      className="inline-flex h-10 w-full sm:w-auto sm:min-w-[11rem] items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                      aria-label="Sort listings"
                      aria-expanded={sortDropdownOpen}
                      aria-controls="listings-sort-listbox"
                      id="listings-sort-button"
                      title="Sort listings"
                    >
                      <span className="truncate text-sm font-medium text-slate-700">{selectedSortLabel}</span>
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </button>
                    {sortDropdownOpen && (
                      <ul
                        id="listings-sort-listbox"
                        aria-labelledby="listings-sort-button"
                        aria-label="Sort options"
                        className="absolute left-0 right-0 sm:left-auto sm:right-0 top-full mt-2 w-full sm:min-w-[14rem] rounded-xl border border-slate-200 bg-white shadow-lg py-2 max-h-72 overflow-y-auto z-50"
                      >
                        {LISTING_SORT_OPTIONS.map((opt) => (
                          <li key={opt.value}>
                            <button
                              type="button"
                              onClick={() => {
                                setListingsSort(opt.value);
                                setSortDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-3 text-sm transition-colors ${listingsSort === opt.value ? 'bg-accent-50 text-accent-700 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                            >
                              {opt.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-6" aria-label="Search filters">
                <AdvancedFilters onFilter={handleFilterChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isMetric={isMetric}
                    isFavorited={isFavorited(listing.id)}
                    onFavoriteClick={handleFavoriteClick}
                  />
                ))}
              </div>
              {hasNextPage ? (
                <div
                  ref={loadMoreRef}
                  role={isFetchingNextPage ? 'status' : undefined}
                  aria-live={isFetchingNextPage ? 'polite' : undefined}
                  className="flex flex-col items-center justify-center min-h-[120px] py-8"
                >
                  {isFetchingNextPage ? <LoadingMore label={UI.LOADING_MORE} /> : <span className="h-4" />}
                </div>
              ) : null}
              {mapView && canExpandNearby ? (
                <div
                  ref={ref}
                  role={isNearbyFetching ? 'status' : undefined}
                  aria-live={isNearbyFetching ? 'polite' : undefined}
                  className="flex flex-col items-center justify-center min-h-[120px] py-8"
                >
                  {isNearbyFetching ? <LoadingMore label={UI.LOADING_MORE} /> : <span className="h-4" />}
                </div>
              ) : null}
              {isListingsError && !isListingsFetching ? (
                <EmptyState message="Unable to load listings right now. Please refresh and try again." />
              ) : null}
              {sortedListings.length === 0 && !isListingsFetching && !isListingsError && (
                <EmptyState message="No listings match your filters. Try adjusting your search." />
              )}
            </section>
          </div>

          {/* Right sidebar - Favourites + Contact a Realtor */}
          <aside className="lg:w-80 shrink-0" aria-labelledby="sidebar-favourites-title">
            <div className="lg:sticky lg:top-24 bg-white rounded-lg shadow-card border border-slate-200 p-4">
              <h2 id="sidebar-favourites-title" className="text-xl font-bold text-slate-900 mb-4">
                Favourites
              </h2>
              <Link href="/favorites" className="text-sm text-accent-600 font-semibold hover:underline mb-3 inline-block">
                View all →
              </Link>
              <ul className="space-y-3">
                {favorites.map((f) => {
                  const listingUrl = getListingPageUrl(f.listing?.id);
                  const itemContent = (
                    <>
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
                    </>
                  );
                  return (
                    <li key={f.id}>
                      {listingUrl ? (
                        <Link href={listingUrl} className="flex gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                          {itemContent}
                        </Link>
                      ) : (
                        <div className="flex gap-3 p-2 rounded-lg">{itemContent}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {favorites.length === 0 && (
                <EmptyState message="No favourites yet. Save listings to see them here." className="text-sm py-4" />
              )}
            </div>

            {/* Contact a Realtor */}
            <div className="lg:sticky lg:top-24 bg-white rounded-lg shadow-card border border-slate-200 p-4 mt-6" aria-labelledby="sidebar-realtors-title">
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
