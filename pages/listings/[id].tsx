import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import PropertyGallery from '../../components/PropertyGallery';
import AgentProfileCard from '../../components/AgentProfileCard';
import MortgageCalculator from '../../components/MortgageCalculator';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BottomNav from '../../components/ui/BottomNav';
import { API, RECENTLY_VIEWED_LIMIT, UI, DEFAULT_LOCATION, MAP_NO_KEY_MESSAGE } from '../../lib/constants';
import { formatPrice, formatArea } from '../../lib/format';
import { getEcoRatingDisplay } from '../../lib/ecoRating';
import { useUnitToggle } from '../../lib/hooks/useUnitToggle';
import { useFavorites } from '../../lib/hooks/useFavorites';

/** Parse listing lat/lng; return default if missing or invalid. */
function getMapCenter(listing: { latitude?: number | null; longitude?: number | null }) {
  const lat = listing.latitude != null ? Number(listing.latitude) : NaN;
  const lng = listing.longitude != null ? Number(listing.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
    return { lat, lng };
  }
  return { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
}

/** Static map for listing detail: one marker at listing location, fixed zoom. */
function ListingMap({ listing }: { listing: { latitude?: number | null; longitude?: number | null } }) {
  const [loadError, setLoadError] = useState(false);
  const center = getMapCenter(listing);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="h-[300px] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
        {MAP_NO_KEY_MESSAGE}
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="h-[300px] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">
        Map could not be loaded.
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px]" style={{ height: '300px' }}>
      <LoadScript
        googleMapsApiKey={apiKey}
        onError={() => setLoadError(true)}
        loadingElement={
          <div className="h-[300px] bg-slate-100 animate-pulse flex items-center justify-center text-slate-500">
            Loading map…
          </div>
        }
      >
        <GoogleMap
          mapContainerStyle={{ height: '300px', width: '100%' }}
          mapContainerClassName="w-full"
          center={center}
          zoom={15}
          options={{ mapTypeControl: false, streetViewControl: false, fullscreenControl: true }}
        >
          <Marker position={center} />
        </GoogleMap>
      </LoadScript>
    </div>
  );
}

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isMetric } = useUnitToggle();
  const { isFavorited, toggleFavorite } = useFavorites();
  const { data: listing, isFetched } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await fetch(`${API.LISTINGS}/${id}`);
      if (!res.ok) return undefined;
      return res.json();
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
          {isFetched ? (
            <p className="text-slate-500">Listing not found.</p>
          ) : (
            <p className="text-slate-500">{UI.LOADING}</p>
          )}
        </main>
        <BottomNav />
      </div>
    );
  }

  const images = Array.isArray(listing.images) ? listing.images : [];
<<<<<<< HEAD
  const normalizeAddressPart = (value: string) => value.toLowerCase().replace(/[,\s]+/g, ' ').trim();
  const street = typeof listing.streetAddress === 'string' ? listing.streetAddress.trim() : '';
  const location = typeof listing.location === 'string' ? listing.location.trim() : '';
  const displayAddress = (() => {
    if (street && location) {
      const streetNorm = normalizeAddressPart(street);
      const locationNorm = normalizeAddressPart(location);
      if (locationNorm.includes(streetNorm)) return location;
      if (streetNorm.includes(locationNorm)) return street;
      return `${street}, ${location}`;
    }
    return street || location || '';
=======
  const normalizeAddressPart = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const street = typeof listing.streetAddress === 'string' ? listing.streetAddress.trim() : '';
  const location = typeof listing.location === 'string' ? listing.location.trim() : '';
  const displayAddress = (() => {
    const addressParts = [street, location]
      .flatMap((value) => value.split(','))
      .map((part) => part.trim())
      .filter(Boolean);

    const uniqueParts: string[] = [];
    const uniqueNorms: string[] = [];

    for (const part of addressParts) {
      const partNorm = normalizeAddressPart(part);
      if (!partNorm) continue;
      const isDuplicate = uniqueNorms.some(
        (existing) => existing === partNorm || existing.includes(partNorm) || partNorm.includes(existing)
      );
      if (!isDuplicate) {
        uniqueParts.push(part);
        uniqueNorms.push(partNorm);
      }
    }

    return uniqueParts.join(', ');
>>>>>>> origin/dev
  })();

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width max-w-5xl pb-14">
        <div className="py-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <span>{listing.title}</span>
              {listing.ecoRatingScore != null && listing.ecoRatingScore >= 7 && (
                <svg className="w-7 h-7 md:w-8 md:h-8 flex-shrink-0 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M11 20a7 7 0 0 1-1.2-13.9C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="currentColor" stroke="none" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.5 11 12 17 8" strokeWidth="1.5" />
                </svg>
              )}
            </h1>
            <p className="text-2xl font-bold text-accent-600">{formatPrice(listing.price ?? 0)}</p>
            {displayAddress && <p className="text-slate-600 mt-1">{displayAddress}</p>}
          </div>
          <button
            type="button"
            onClick={handleFavorite}
            className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full border-2 border-slate-200 bg-white text-slate-700 shadow-sm hover:border-accent-400 hover:bg-accent-50 hover:text-accent-600 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-colors"
            aria-pressed={isFavorited(listing.id)}
            aria-label={isFavorited(listing.id) ? 'Remove from favourites' : 'Add to favourites'}
          >
            {isFavorited(listing.id) ? (
              <svg className="w-6 h-6 text-accent-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
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
                <dd className="font-medium text-slate-900">
                  {(listing.bathroomsTotal ?? 0) + (listing.halfBathroomsTotal ?? 0)
                    ? (listing.halfBathroomsTotal ? `${listing.bathroomsTotal ?? 0} + ${listing.halfBathroomsTotal} half` : String(listing.bathroomsTotal ?? 0))
                    : '—'}
                </dd>
                <dt className="text-slate-500">Size</dt>
                <dd className="font-medium text-slate-900">{formatArea(listing.sizeSqm, isMetric)}</dd>
                <dt className="text-slate-500">Lot size</dt>
                <dd className="font-medium text-slate-900">{listing.lotSizeSqm != null ? formatArea(listing.lotSizeSqm, isMetric) : '—'}</dd>
                <dt className="text-slate-500">Type</dt>
                <dd className="font-medium text-slate-900">{listing.propertyType ?? '—'}</dd>
                <dt className="text-slate-500">Year built</dt>
                <dd className="font-medium text-slate-900">{listing.yearBuilt ?? '—'}</dd>
                {listing.ecoRatingScore != null && listing.ecoRatingScore >= 7 && (
                  <>
                    <dt className="text-slate-500">Eco rating</dt>
                    <dd className="font-medium text-green-700">{getEcoRatingDisplay(listing.ecoRatingScore)}</dd>
                    {listing.heatingType && (
                      <>
                        <dt className="text-slate-500">Heating</dt>
                        <dd className="font-medium text-slate-900">{listing.heatingType.replace(/_/g, ' ')}</dd>
                      </>
                    )}
                    {listing.insulationQuality && (
                      <>
                        <dt className="text-slate-500">Insulation</dt>
                        <dd className="font-medium text-slate-900">{listing.insulationQuality}</dd>
                      </>
                    )}
                    {listing.roofAgeYears != null && (
                      <>
                        <dt className="text-slate-500">Roof age</dt>
                        <dd className="font-medium text-slate-900">{listing.roofAgeYears} years</dd>
                      </>
                    )}
                    {listing.appliancesAgeYears != null && (
                      <>
                        <dt className="text-slate-500">Appliances age</dt>
                        <dd className="font-medium text-slate-900">{listing.appliancesAgeYears} years</dd>
                      </>
                    )}
                    {listing.hasRecentRenovations === true && (
                      <>
                        <dt className="text-slate-500">Recent renovations</dt>
                        <dd className="font-medium text-slate-900">Yes</dd>
                      </>
                    )}
                  </>
                )}
                <dt className="text-slate-500">Stories</dt>
                <dd className="font-medium text-slate-900">{listing.buildingLevelTotal ?? '—'}</dd>
                <dt className="text-slate-500">Postal code</dt>
                <dd className="font-medium text-slate-900">{listing.postalCode ?? '—'}</dd>
                {listing.standardStatus && (
                  <>
                    <dt className="text-slate-500">MLS status</dt>
                    <dd className="font-medium text-slate-900">{listing.standardStatus}</dd>
                  </>
                )}
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
            <ListingMap listing={listing} />
          ) : (
            <div className="h-[300px] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">{MAP_NO_KEY_MESSAGE}</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
          <MortgageCalculator price={listing.price ?? 0} />
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
