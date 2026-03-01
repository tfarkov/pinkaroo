import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { DEFAULT_LOCATION, getListingPageUrl, MAP_NO_KEY_MESSAGE } from '../lib/constants';

/** Listing shape needed for map markers (id + lat/lng + optional title). */
interface MapListing {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
}

/**
 * Map pin position from listing. API/DB use latitude = lat, longitude = lng (WGS84).
 * Google Maps expects { lat, lng }. Only swap when clearly reversed (e.g. lat=-79, lng=44).
 */
function getMarkerPosition(listing: MapListing): { lat: number; lng: number } | null {
  const lat = Number(listing.latitude);
  const lng = Number(listing.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // Correct (lat, lng): lat in [-90,90], lng in [-180,180]
  if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) return { lat, lng };
  // Possibly swapped: e.g. Ontario stored as latitude=-79, longitude=44
  if (lng >= -90 && lng <= 90 && lat >= -180 && lat <= 180) return { lat: lng, lng: lat };
  return null;
}

/** Map center and zoom level; passed to/from parent to avoid resetting map on re-render. */
export type MapView = { center: { lat: number; lng: number }; zoom: number };

interface Props {
  /** Initial center (e.g. user location). Ignored after first pan/zoom if currentView is set. */
  position: { lat: number; lng: number } | undefined;
  listings: MapListing[];
  /** Controlled view from parent so the map doesn't reset when state updates. */
  currentView?: MapView | null;
  /** Called on pan/zoom so parent can filter browse list by new center/radius. */
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

const DEFAULT_ZOOM = 12;

export default function HomeMap({ position, listings, currentView, onMapChange }: Props) {
  const router = useRouter();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="h-[420px] bg-slate-200 flex items-center justify-center text-slate-500">
        {MAP_NO_KEY_MESSAGE}
      </div>
    );
  }
  const center = currentView?.center ?? position ?? { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
  const zoom = currentView?.zoom ?? DEFAULT_ZOOM;
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return <DefaultMap center={center} apiKey={apiKey} />;
  }

  /** On map load: subscribe to idle events so parent gets center/zoom on pan or zoom. */
  const handleLoad = (map: google.maps.Map) => {
    if (onMapChange) {
      map.addListener('idle', () => {
        const c = map.getCenter();
        const z = map.getZoom();
        if (c && z != null) onMapChange({ center: { lat: c.lat(), lng: c.lng() }, zoom: z });
      });
    }
  };

  // Use ControlPosition enum so zoom control shows (string position can hide it in some setups)
  const ControlPosition = typeof google !== 'undefined' && google.maps && google.maps.ControlPosition
    ? google.maps.ControlPosition
    : { RIGHT_CENTER: 4 as number };
  const mapOptions: google.maps.MapOptions = {
    zoomControl: true,
    zoomControlOptions: { position: ControlPosition.RIGHT_CENTER },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    scaleControl: true,
  };

  const markersWithPos = listings
    .map((listing) => ({ listing, pos: getMarkerPosition(listing) }))
    .filter((entry): entry is { listing: MapListing; pos: { lat: number; lng: number } } => entry.pos != null);

  return (
    <div role="region" aria-label="Map of nearby listings" className="w-full h-full min-h-[420px]">
      <LoadScript
        googleMapsApiKey={apiKey}
        onError={() => setLoadError(true)}
        loadingElement={
          <div className="h-[420px] bg-slate-100 animate-pulse flex items-center justify-center text-slate-500">
            Loading map…
          </div>
        }
      >
        <GoogleMap
          center={center}
          zoom={zoom}
          mapContainerStyle={{ height: '420px', width: '100%' }}
          options={mapOptions}
          onLoad={handleLoad}
        >
          {markersWithPos.map(({ listing, pos }) => (
            <Marker
              key={listing.id}
              position={pos}
              title={listing.title ?? undefined}
              cursor="pointer"
              onClick={() => {
                const url = getListingPageUrl(listing.id);
                if (url) router.push(url);
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
