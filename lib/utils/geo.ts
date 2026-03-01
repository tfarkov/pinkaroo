import { DEFAULT_NEARBY_RADIUS_KM } from '../constants';

/** Approximate distance in km between two points (Haversine). */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * (Math.PI / 180)) *
      Math.cos(b.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

/**
 * Radius (km) for map/nearby from zoom level. Zoom in = smaller radius. Clamped 2–500 km.
 */
export function radiusKmFromZoom(zoom: number): number {
  return Math.min(500, Math.max(2, DEFAULT_NEARBY_RADIUS_KM * Math.pow(2, 10 - zoom)));
}
