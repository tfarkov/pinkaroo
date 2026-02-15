import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { DEFAULT_LOCATION } from '../lib/constants';

interface MapListing {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
}

export type MapView = { center: { lat: number; lng: number }; zoom: number };

interface Props {
  /** Initial center (e.g. user location). Ignored after user pans if currentView is set. */
  position: { lat: number; lng: number } | undefined;
  listings: MapListing[];
  /** Current map view from parent (updated on pan/zoom). Pass back so the map doesn't reset on re-render. */
  currentView?: MapView | null;
  /** Called when the user pans or zooms so the parent can refetch nearby listings */
  onMapChange?: (view: MapView) => void;
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

const DEFAULT_ZOOM = 10;

export default function HomeMap({ position, listings, currentView, onMapChange }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="h-[420px] bg-slate-200 flex items-center justify-center text-slate-500">
        Map (set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable)
      </div>
    );
  }
  const center = currentView?.center ?? position ?? { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
  const zoom = currentView?.zoom ?? DEFAULT_ZOOM;
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return <DefaultMap center={center} apiKey={apiKey} />;
  }

  const handleLoad = (map: google.maps.Map) => {
    if (onMapChange) {
      map.addListener('idle', () => {
        const c = map.getCenter();
        const z = map.getZoom();
        if (c && z != null) onMapChange({ center: { lat: c.lat(), lng: c.lng() }, zoom: z });
      });
    }
  };

  // RIGHT_CENTER = 4 (ControlPosition); set here so we don't rely on `google` before LoadScript runs
  const mapOptions: google.maps.MapOptions = {
    zoomControl: true,
    zoomControlOptions: { position: 4 },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    scaleControl: true,
  };

  return (
    <LoadScript googleMapsApiKey={apiKey} onError={() => setLoadError(true)}>
      <GoogleMap
        center={center}
        zoom={zoom}
        mapContainerStyle={{ height: '420px', width: '100%' }}
        options={mapOptions}
        onLoad={handleLoad}
      >
        {listings.map((listing) => (
          <Marker key={listing.id} position={{ lat: listing.latitude, lng: listing.longitude }} title={listing.title ?? ''} />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
