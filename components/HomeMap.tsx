import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

interface Listing {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

interface Props {
  position: { lat: number; lng: number } | undefined;
  listings: Listing[];
}

export default function HomeMap({ position, listings }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="h-[420px] bg-slate-200 flex items-center justify-center text-slate-500">
        Map (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable)
      </div>
    );
  }
  const center = position ?? { lat: 44.3894, lng: -79.6903 };
  return (
    <LoadScript googleMapsApiKey={apiKey}>
      <GoogleMap center={center} zoom={10} mapContainerStyle={{ height: '420px', width: '100%' }}>
        {listings.map((listing) => (
          <Marker key={listing.id} position={{ lat: listing.latitude, lng: listing.longitude }} title={listing.title} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
