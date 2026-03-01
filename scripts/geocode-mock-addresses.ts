/**
 * Geocode all 111 mock addresses via Google Geocoding API and write
 * lib/addressCoords.json. Run once with GOOGLE_MAPS_API_KEY (or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
 * set so seed and mocks use real coordinates.
 *
 * Usage: npm run geocode-mock
 */
import * as path from 'path';
import * as fs from 'fs';
import { getMockAddressStrings } from '../lib/mockData';
import { geocodeWithDelay } from '../lib/geocode';

async function main() {
  try {
    require('dotenv').config({ path: path.join(process.cwd(), '.env') });
  } catch {
    // dotenv optional; API key may be in env
  }

  const addresses = getMockAddressStrings();
  const outPath = path.join(process.cwd(), 'lib', 'addressCoords.json');
  const coords: { lat: number; lng: number }[] = [];

  console.log(`Geocoding ${addresses.length} addresses (150ms delay between requests)...`);
  for (let i = 0; i < addresses.length; i++) {
    const result = await geocodeWithDelay(addresses[i], 150);
    if (result) {
      coords.push({ lat: result.lat, lng: result.lng });
    } else {
      console.warn(`[${i + 1}/${addresses.length}] No result: ${addresses[i]}`);
      coords.push({ lat: 0, lng: 0 });
    }
  }

  fs.writeFileSync(outPath, JSON.stringify(coords, null, 2), 'utf8');
  console.log(`Wrote ${coords.length} coordinates to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
