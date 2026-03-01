/**
 * Server-side geocoding via Google Geocoding API.
 * Use for resolving addresses to lat/lng when creating/updating listings or building mock data.
 */

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

function getApiKey(): string {
  return (
    (typeof process !== 'undefined' && process.env.GOOGLE_MAPS_API_KEY) ||
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) ||
    ''
  );
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

/**
 * Resolve an address string to coordinates using Google Geocoding API.
 * Biases results to Canada (region=ca). Returns null if no result or API key missing.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const key = getApiKey();
  if (!key || !address || typeof address !== 'string' || !address.trim()) return null;

  const query = address.trim();
  const url = `${GEOCODE_URL}?address=${encodeURIComponent(query)}&region=ca&key=${key}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK' || !Array.isArray(data.results) || data.results.length === 0)
      return null;
    const first = data.results[0];
    const loc = first.geometry?.location;
    if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;
    return {
      lat: loc.lat,
      lng: loc.lng,
      formattedAddress: first.formatted_address,
    };
  } catch (err) {
    console.error('[geocode]', err);
    return null;
  }
}

/**
 * Geocode with a short delay to avoid rate limits. Use when batching many addresses.
 */
export function geocodeWithDelay(
  address: string,
  delayMs: number = 150
): Promise<GeocodeResult | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      geocodeAddress(address).then(resolve);
    }, delayMs);
  });
}
