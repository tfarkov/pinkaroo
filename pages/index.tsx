import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { useGeolocation } from '../lib/hooks/useGeolocation';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API, RECENTLY_VIEWED_LIMIT, STALE_TIME_5_MIN, UI, DEFAULT_NEARBY_RADIUS_KM } from '../lib/constants';
import Header from '../components/Header';
import NotificationsDropdown from '../components/NotificationsDropdown';
import BottomNav from '../components/ui/BottomNav';

export default function Home() {
  const position = useGeolocation();
  const { isMetric } = useUnitToggle();
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
    <div className="page-container">
      <Header />
      <NotificationsDropdown />
      <main className="content-width">
        <section className="py-8 md:py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-900 mb-2">{UI.WELCOME_TITLE}</h1>
          <p className="text-primary-600 max-w-xl mx-auto">Find your next home. Browse nearby listings and save your favorites.</p>
        </section>

        <section aria-labelledby="nearby-title" className="mb-12">
          <h2 id="nearby-title" className="section-heading">{UI.NEARBY_LISTINGS_TITLE}</h2>
          <div className="card rounded-xl overflow-hidden p-0 mb-6">
            {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
              <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  center={position}
                  zoom={10}
                  mapContainerStyle={{ height: '400px', width: '100%' }}
                  mapContainerClassName="rounded-xl"
                >
                  {listings.map((listing: { id: string; latitude: number; longitude: number; title: string }) => (
                    <Marker key={listing.id} position={{ lat: listing.latitude, lng: listing.longitude }} title={listing.title} />
                  ))}
                </GoogleMap>
              </LoadScript>
            ) : (
              <div className="aspect-[4/3] min-h-[400px] bg-primary-100 flex items-center justify-center text-primary-500 rounded-xl">
                Map (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable)
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="recent-title">
          <h2 id="recent-title" className="section-heading">{UI.RECENTLY_VIEWED_TITLE}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentlyViewed.map((id: string) => (
              <Link
                key={id}
                href={`/listings/${id}`}
                className="card block p-5 hover:shadow-card-hover transition-shadow"
              >
                <div className="property-card-image rounded-lg mb-3 text-sm">Property #{id.slice(0, 8)}</div>
                <span className="text-accent-600 font-medium">{UI.VIEW_LISTING} →</span>
              </Link>
            ))}
          </div>
          {recentlyViewed.length === 0 && (
            <p className="text-primary-500 py-8 text-center">No recently viewed listings yet. Browse listings to get started.</p>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
