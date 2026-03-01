import { useState, useEffect } from 'react';
import { DEFAULT_LOCATION } from '../constants';

/** Requests geolocation on mount; browser shows its default permission prompt. Returns position (user location or Barrie fallback). */
export function useGeolocation() {
  const [position, setPosition] = useState<{ lat: number; lng: number }>(DEFAULT_LOCATION);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPosition(DEFAULT_LOCATION),
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return position;
}
