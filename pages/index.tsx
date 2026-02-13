import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '../lib/hooks/useGeolocation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API, RECENTLY_VIEWED_LIMIT, STALE_TIME_5_MIN, UI, DEFAULT_NEARBY_RADIUS_KM } from '../lib/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';

export default function Home() {
  const position = useGeolocation();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const { data: listings = [] } = useQuery({
    queryKey: ['nearby', position],
    queryFn: () => fetch(`${API.LISTINGS_NEARBY}?lat=${position?.lat ?? ''}&lng=${position?.lng ?? ''}&radius=${DEFAULT_NEARBY_RADIUS_KM}`).then(res => res.json()),
    staleTime: STALE_TIME_5_MIN,
  });

  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentlyViewed(viewed.slice(-RECENTLY_VIEWED_LIMIT));
  }, []);

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero - REALTOR.ca style */}
        <section className="bg-header text-white py-10 md:py-14">
          <div className="content-width text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              Search listings from trusted REALTORS®
            </h1>
            <p className="text-white/90 text-lg mb-6 max-w-2xl mx-auto">
              Find your next home. Browse nearby listings and save your favourites.
            </p>
            <Link
              href="/listings"
              className="inline-block bg-accent-500 hover:bg-accent-600 text-white font-bold px-8 py-3 rounded-md text-lg transition-colors shadow-hero"
            >
              Find a Home
            </Link>
          </div>
        </section>

        {/* Map */}
        <section aria-labelledby="nearby-title" className="content-width py-10">
          <h2 id="nearby-title" className="text-2xl font-bold text-slate-900 mb-6">
            {UI.NEARBY_LISTINGS_TITLE}
          </h2>
          <div className="bg-white rounded-lg shadow-card overflow-hidden border border-slate-200">
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  center={position}
                  zoom={10}
                  mapContainerStyle={{ height: '420px', width: '100%' }}
                >
                  {listings.map((listing: { id: string; latitude: number; longitude: number; title: string }) => (
                    <Marker key={listing.id} position={{ lat: listing.latitude, lng: listing.longitude }} title={listing.title} />
                  ))}
                </GoogleMap>
              </LoadScript>
            ) : (
              <div className="h-[420px] bg-slate-200 flex items-center justify-center text-slate-500">
                Map (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable)
              </div>
            )}
          </div>
        </section>

        {/* Recently Viewed */}
        <section aria-labelledby="recent-title" className="content-width py-10 pb-14">
          <h2 id="recent-title" className="text-2xl font-bold text-slate-900 mb-6">
            {UI.RECENTLY_VIEWED_TITLE}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewed.map((id: string) => (
              <Link
                key={id}
                href={`/listings/${id}`}
                className="block bg-white rounded-lg shadow-card border border-slate-200 p-0 overflow-hidden hover:shadow-card-hover transition-shadow group"
              >
                <div className="aspect-[4/3] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
                  Property #{id.slice(0, 8)}
                </div>
                <div className="p-4">
                  <span className="text-accent-600 font-semibold group-hover:text-accent-700">
                    {UI.VIEW_LISTING} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {recentlyViewed.length === 0 && (
            <p className="text-slate-500 py-10 text-center">
              No recently viewed listings yet. Browse listings to get started.
            </p>
          )}
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
