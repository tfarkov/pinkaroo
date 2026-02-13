import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { DEFAULT_LOCATION } from '../lib/constants';

interface MapListing {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
}

interface Props {
  position: { lat: number; lng: number } | undefined;
  listings: MapListing[];
}

/** Default Google map when the interactive map doesn't load (static image + link) */
function DefaultMap({ center, apiKey }: { center: { lat: number; lng: number }; apiKey: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const staticUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=10&size=640x420&scale=2&maptype=roadmap&key=${apiKey}`;
  const mapsLink = `https://www.google.com/maps?q=${center.lat},${center.lng}&z=10`;

  if (imgFailed) {
    return (
      <div className="h-[420px] bg-slate-200 flex flex-col items-center justify-center gap-3 text-slate-600">
        <p className="text-sm">Map could not be loaded.</p>
        <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="text-accent-600 font-semibold hover:underline">
          Open in Google Maps →
        </a>
      </div>
    );
  }
  return (
    <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="block h-[420px] w-full bg-slate-200">
      <img
        src={staticUrl}
        alt="Map"
        className="w-full h-full object-cover"
        onError={() => setImgFailed(true)}
      />
    </a>
  );
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
  const center = position ?? { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return <DefaultMap center={center} apiKey={apiKey} />;
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} onError={() => setLoadError(true)}>
      <GoogleMap center={center} zoom={10} mapContainerStyle={{ height: '420px', width: '100%' }}>
        {listings.map((listing) => (
          <Marker key={listing.id} position={{ lat: listing.latitude, lng: listing.longitude }} title={listing.title ?? ''} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
