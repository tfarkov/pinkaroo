/**
 * Client-side geocoding with localStorage cache to reduce Google Geocoding API calls.
 * Used by the listing form for automatic lat/lng on location input (with 300ms debounce).
 * Cache TTL 24 hours; key by normalized address.
 */

const GEOCODE_CACHE_KEY_PREFIX = 'pinkaroo_geocode_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

function cacheKey(address: string): string {
  return GEOCODE_CACHE_KEY_PREFIX + address.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getCached(address: string): GeocodeResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(cacheKey(address));
    if (!raw) return null;
    const { lat, lng, ts } = JSON.parse(raw);
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng))
      return null;
    if (Date.now() - (ts || 0) > CACHE_TTL_MS) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function setCached(address: string, result: GeocodeResult): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      cacheKey(address),
      JSON.stringify({ lat: result.lat, lng: result.lng, ts: Date.now() })
    );
  } catch {
    // ignore quota or parse errors
  }
}

/**
 * Geocode an address on the client. Checks localStorage first; on miss calls Google
 * Geocoding API with region=ca. Results are cached for 24h to reduce API cost.
 */
export async function geocodeAddressClient(address: string): Promise<GeocodeResult | null> {
  const trimmed = typeof address === 'string' ? address.trim() : '';
  if (!trimmed) return null;

  const cached = getCached(trimmed);
  if (cached) return cached;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  if (!key) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&region=ca&key=${key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0)
      return null;
    const first = data.results[0];
    const loc = first.geometry?.location;
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;
    const result: GeocodeResult = { lat: loc.lat, lng: loc.lng, formattedAddress: first.formatted_address };
    setCached(trimmed, result);
    return result;
  } catch {
    return null;
  }
}
