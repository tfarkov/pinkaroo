import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import Link from 'next/link';
import ListingForm from '../../components/ListingForm';
import { useAuth } from '../../lib/hooks/useAuth';
import { useGeolocation } from '../../lib/hooks/useGeolocation';
import { useUnitToggle } from '../../lib/hooks/useUnitToggle';
import { API, SQFT_CONVERSION_FACTOR, STALE_TIME_5_MIN, UI, DEFAULT_NEARBY_RADIUS_KM } from '../../lib/constants';
import { getMockListingsPage, getMockNearbyListings } from '../../lib/mockData';
import Header from '../../components/Header';
import AdvancedFilters from '../../components/AdvancedFilters';
import Footer from '../../components/Footer';
import { useState } from 'react';
import BottomNav from '../../components/ui/BottomNav';
import SafeListingImage from '../../components/ui/SafeListingImage';

type FilterParams = Record<string, string | number | undefined>;

function buildQueryParams(filters: FilterParams, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams();
  Object.entries({ ...filters, ...extra }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}

export default function Listings() {
  const { isRealtor } = useAuth();
  const { isMetric } = useUnitToggle();
  const position = useGeolocation();
  const { ref, inView } = useInView();
  const [filters, setFilters] = useState<FilterParams>({});

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
    enabled: position != null && (position.lat != null || position.lng != null),
  });

  const listParams = (page: number) => buildQueryParams(filters, { page: String(page) });

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['listings', filters],
    queryFn: async ({ pageParam }) => {
      try {
        const res = await fetch(`${API.LISTINGS}${listParams(pageParam)}`, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockListingsPage(pageParam);
      } catch {
        return getMockListingsPage(pageParam);
      }
    },
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

        {/* Map – nearby listings */}
        <section aria-labelledby="nearby-map-title" className="mb-10">
          <h2 id="nearby-map-title" className="text-xl font-bold text-slate-900 mb-4">
            {UI.NEARBY_LISTINGS_TITLE}
          </h2>
          <div className="bg-white rounded-lg shadow-card overflow-hidden border border-slate-200">
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  center={position}
                  zoom={10}
                  mapContainerStyle={{ height: '360px', width: '100%' }}
                >
                  {nearbyListings
                    .filter((l: { latitude?: number; longitude?: number }) => l.latitude != null && l.longitude != null)
                    .map((listing: { id: string; latitude: number; longitude: number; title: string }) => (
                      <Marker key={listing.id} position={{ lat: listing.latitude, lng: listing.longitude }} title={listing.title} />
                    ))}
                </GoogleMap>
              </LoadScript>
            ) : (
              <div className="h-[360px] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
                Map (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable)
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing: any) => (
            <article key={listing.id} className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden hover:shadow-card-hover transition-shadow group">
              <Link href={`/listings/${listing.id}`} className="block">
                <div className="aspect-[4/3] w-full bg-slate-200 overflow-hidden">
                  <SafeListingImage src={listing.images?.[0]} />
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
