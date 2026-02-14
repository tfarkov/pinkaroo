import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import PropertyGallery from '../../components/PropertyGallery';
import AgentProfileCard from '../../components/AgentProfileCard';
import MortgageCalculator from '../../components/MortgageCalculator';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BottomNav from '../../components/ui/BottomNav';
import { API, RECENTLY_VIEWED_LIMIT, UI } from '../../lib/constants';
import { formatPrice, formatArea } from '../../lib/format';
import { useUnitToggle } from '../../lib/hooks/useUnitToggle';
import { useFavorites } from '../../lib/hooks/useFavorites';
import { getMockListing } from '../../lib/mockData';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isMetric } = useUnitToggle();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { data: listing } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      try {
        const res = await fetch(`${API.LISTINGS}/${id}`);
        if (res.ok) return res.json();
        return getMockListing(id as string);
      } catch {
        return getMockListing(id as string);
      }
    },
    enabled: !!id,
  });
  useEffect(() => {
    if (typeof window === 'undefined' || typeof id !== 'string' || !id.trim()) return;
    let viewed: string[] = [];
    try {
      const raw = localStorage.getItem('recentlyViewed');
      viewed = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
    } catch {
      viewed = [];
    }
    viewed = viewed.filter((v: unknown) => typeof v === 'string' && v.trim());
    viewed = [...new Set([...viewed.filter((v) => v !== id), id])].slice(-RECENTLY_VIEWED_LIMIT);
    localStorage.setItem('recentlyViewed', JSON.stringify(viewed));
  }, [id]);

  const handleFavorite = () => {
    if (typeof id !== 'string' || !listing) return;
    toggleFavorite(id, { id: listing.id, title: listing.title, price: listing.price, images: listing.images });
  };

  if (!listing) {
    return (
      <div className="page-container">
        <Header />
        <main className="content-width flex items-center justify-center min-h-[50vh]">
          <p className="text-slate-500">{UI.LOADING}</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  const images = Array.isArray(listing.images) ? listing.images : [];

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width max-w-5xl pb-14">
        <div className="py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{listing.title}</h1>
          <p className="text-2xl font-bold text-accent-600">{formatPrice(listing.price ?? 0)}</p>
          {listing.location && <p className="text-slate-600 mt-1">{listing.location}</p>}
        </div>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden mb-6">
          <PropertyGallery images={images} />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Details</h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{listing.description || 'No description.'}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <dt className="text-slate-500">Bedrooms</dt>
                <dd className="font-medium text-slate-900">{listing.bedroomsTotal ?? '—'}</dd>
                <dt className="text-slate-500">Bathrooms</dt>
                <dd className="font-medium text-slate-900">{listing.bathroomsTotal ?? '—'}</dd>
                <dt className="text-slate-500">Size</dt>
                <dd className="font-medium text-slate-900">{formatArea(listing.sizeSqm, isMetric)}</dd>
                <dt className="text-slate-500">Type</dt>
                <dd className="font-medium text-slate-900">{listing.propertyType ?? '—'}</dd>
                <dt className="text-slate-500">Postal code</dt>
                <dd className="font-medium text-slate-900">{listing.postalCode ?? '—'}</dd>
              </dl>
            </div>
          </div>
          <div>
            <AgentProfileCard agentId={listing.userId} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-900">Location</h2>
          </div>
          {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
            <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
              <GoogleMap
                center={{ lat: listing.latitude ?? 0, lng: listing.longitude ?? 0 }}
                zoom={15}
                mapContainerStyle={{ height: '300px', width: '100%' }}
              >
                <Marker position={{ lat: listing.latitude ?? 0, lng: listing.longitude ?? 0 }} />
              </GoogleMap>
            </LoadScript>
          ) : (
            <div className="h-[300px] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">Map (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable)</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
          <MortgageCalculator price={listing.price ?? 0} />
        </div>

        <button onClick={handleFavorite} className="btn-primary">
          {isFavorited(listing.id) ? 'Remove from favourites' : UI.FAVORITE}
        </button>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
