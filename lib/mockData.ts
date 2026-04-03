import { DEFAULT_LOCATION } from './constants';
import { computeEcoRatingScore } from './ecoRating';
import addressCoordsJson from './addressCoords.json';

/** Source real-estate sample images hosted in Cloudinary. */
const MOCK_IMAGE_SOURCES = {
  familyHome: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/98b50b00d2492cf8.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412692/pinkaroo/mock-assets/83240ed826dd150e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412693/pinkaroo/mock-assets/4a495b6d917ef3f1.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412693/pinkaroo/mock-assets/af823abad780216b.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412694/pinkaroo/mock-assets/6e5f744062fcb855.jpg',
  ],
  condo: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412694/pinkaroo/mock-assets/f43e9e4810b1f011.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/dcefca39f32ebfa1.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/a26f337d38035ee0.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412737/pinkaroo/mock-assets/7ddf75ae154007db.jpg',
  ],
  townhouse: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412692/pinkaroo/mock-assets/83240ed826dd150e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/8a092fdde8a7f5c4.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/c79227552d547e42.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412739/pinkaroo/mock-assets/e6cd8a418012523e.jpg',
  ],
  bungalow: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/68b5f972cb4177fa.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/d1ed2cb3892de40e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412694/pinkaroo/mock-assets/6e5f744062fcb855.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412741/pinkaroo/mock-assets/cea03478516a9206.jpg',
  ],
  waterfront: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412739/pinkaroo/mock-assets/e6cd8a418012523e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/dcefca39f32ebfa1.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/68b5f972cb4177fa.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412741/pinkaroo/mock-assets/64b0acf7e45729d6.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/c79227552d547e42.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412742/pinkaroo/mock-assets/d31e9ce6b8f6a52c.jpg',
  ],
  apartment: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412693/pinkaroo/mock-assets/4a495b6d917ef3f1.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/c79227552d547e42.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412737/pinkaroo/mock-assets/7ddf75ae154007db.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/a26f337d38035ee0.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412694/pinkaroo/mock-assets/6e5f744062fcb855.jpg',
  ],
  modern: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412693/pinkaroo/mock-assets/4a495b6d917ef3f1.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412693/pinkaroo/mock-assets/af823abad780216b.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412692/pinkaroo/mock-assets/83240ed826dd150e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412741/pinkaroo/mock-assets/64b0acf7e45729d6.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/8a092fdde8a7f5c4.jpg',
  ],
  luxury: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412741/pinkaroo/mock-assets/64b0acf7e45729d6.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/68b5f972cb4177fa.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412739/pinkaroo/mock-assets/e6cd8a418012523e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/dcefca39f32ebfa1.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
  ],
  garden: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412741/pinkaroo/mock-assets/cea03478516a9206.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/d1ed2cb3892de40e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412742/pinkaroo/mock-assets/d31e9ce6b8f6a52c.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/c79227552d547e42.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
  ],
  livingRoom: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412694/pinkaroo/mock-assets/6e5f744062fcb855.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/c79227552d547e42.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/a26f337d38035ee0.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412692/pinkaroo/mock-assets/83240ed826dd150e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/68b5f972cb4177fa.jpg',
  ],
  kitchen: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/a26f337d38035ee0.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412694/pinkaroo/mock-assets/6e5f744062fcb855.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/98b50b00d2492cf8.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412693/pinkaroo/mock-assets/4a495b6d917ef3f1.jpg',
  ],
  exterior: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/8a092fdde8a7f5c4.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412692/pinkaroo/mock-assets/83240ed826dd150e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/d1ed2cb3892de40e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
  ],
  cottage: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412742/pinkaroo/mock-assets/d31e9ce6b8f6a52c.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412739/pinkaroo/mock-assets/e6cd8a418012523e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/68b5f972cb4177fa.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/c79227552d547e42.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412741/pinkaroo/mock-assets/cea03478516a9206.jpg',
  ],
  loft: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412737/pinkaroo/mock-assets/7ddf75ae154007db.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412738/pinkaroo/mock-assets/c79227552d547e42.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/a26f337d38035ee0.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412694/pinkaroo/mock-assets/6e5f744062fcb855.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412694/pinkaroo/mock-assets/f43e9e4810b1f011.jpg',
  ],
  pool: [
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412691/pinkaroo/mock-assets/2e21df726e794a18.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/68b5f972cb4177fa.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412739/pinkaroo/mock-assets/e6cd8a418012523e.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412735/pinkaroo/mock-assets/dcefca39f32ebfa1.jpg',
    'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412740/pinkaroo/mock-assets/d1ed2cb3892de40e.jpg',
  ],
};

const MOCK_IMAGES = MOCK_IMAGE_SOURCES;
const EXPECTED_ADDRESS_COUNT = 111;

/** Exactly 5 images per listing for extended mocks (within 25/50/100 km of DEFAULT_LOCATION) */
const FIVE_IMAGES_SETS = [
  MOCK_IMAGES.familyHome.slice(0, 5),
  MOCK_IMAGES.condo.slice(0, 5),
  MOCK_IMAGES.townhouse.slice(0, 5),
  MOCK_IMAGES.bungalow.slice(0, 5),
  MOCK_IMAGES.waterfront.slice(0, 5),
  MOCK_IMAGES.apartment.slice(0, 5),
  MOCK_IMAGES.modern.slice(0, 5),
  MOCK_IMAGES.luxury.slice(0, 5),
  MOCK_IMAGES.garden.slice(0, 5),
  MOCK_IMAGES.livingRoom.slice(0, 5),
  MOCK_IMAGES.kitchen.slice(0, 5),
  MOCK_IMAGES.exterior.slice(0, 5),
  MOCK_IMAGES.cottage.slice(0, 5),
  MOCK_IMAGES.loft.slice(0, 5),
  MOCK_IMAGES.pool.slice(0, 5),
] as const;

/** Point at distanceKm and bearingDeg (0 = North, 90 = East) from center */
function pointAtDistance(
  center: { lat: number; lng: number },
  distanceKm: number,
  bearingDeg: number
): { lat: number; lng: number } {
  const R = 6371;
  const φ1 = (center.lat * Math.PI) / 180;
  const λ1 = (center.lng * Math.PI) / 180;
  const br = (bearingDeg * Math.PI) / 180;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(distanceKm / R) +
      Math.cos(φ1) * Math.sin(distanceKm / R) * Math.cos(br)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(br) * Math.sin(distanceKm / R) * Math.cos(φ1),
      Math.cos(distanceKm / R) - Math.sin(φ1) * Math.sin(φ2)
    );
  return { lat: (φ2 * 180) / Math.PI, lng: (λ2 * 180) / Math.PI };
}

const PROPERTY_TEMPLATES: Array<{
  propertyType: string;
  title: string;
  description: string;
  price: number;
  sizeSqm: number;
  bedroomsTotal: number;
  bathroomsTotal: number;
  images: readonly string[];
}> = [
  { propertyType: 'House', title: 'Family Home', description: 'Spacious family home with modern finishes. Full kitchen and main bath renovation (2022). Roof replaced 2019 with 50-year shingles. Natural gas heating, excellent attic insulation.', price: 549000, sizeSqm: 165, bedroomsTotal: 3, bathroomsTotal: 2, images: MOCK_IMAGES.familyHome },
  { propertyType: 'Condo', title: 'Condo with Lake View', description: 'Bright condo steps from the waterfront. Recent roof upgrade to the building (2021). Electric heat pump, good insulation. Appliances updated 2020.', price: 425000, sizeSqm: 95, bedroomsTotal: 2, bathroomsTotal: 1, images: MOCK_IMAGES.condo },
  { propertyType: 'Townhouse', title: 'Starter Townhouse', description: 'Low-maintenance townhouse in quiet area. Interior reno in 2023: new flooring, paint, and lighting. Roof 6 years old. Gas heating, average insulation.', price: 485000, sizeSqm: 120, bedroomsTotal: 3, bathroomsTotal: 2, images: MOCK_IMAGES.townhouse },
  { propertyType: 'House', title: 'Renovated Bungalow', description: 'Single-level living on a large lot. Full reno 2020: kitchen, bathrooms, roof, and windows. Geothermal heating, excellent insulation. Appliances 2 years old.', price: 625000, sizeSqm: 140, bedroomsTotal: 3, bathroomsTotal: 2, images: MOCK_IMAGES.bungalow },
  { propertyType: 'House', title: 'Waterfront Cottage', description: 'Private lot with dock and sunset views. Roof upgraded 2018; recent bathroom and deck renovations. Oil heating, good insulation. Ideal for seasonal or year-round.', price: 899000, sizeSqm: 200, bedroomsTotal: 4, bathroomsTotal: 3, images: MOCK_IMAGES.waterfront },
  { propertyType: 'Apartment', title: 'Modern Apartment', description: 'New build, concierge, gym included. Building-wide roof and common-area upgrades (2022). Heat pump, excellent insulation. All appliances under 3 years.', price: 375000, sizeSqm: 85, bedroomsTotal: 2, bathroomsTotal: 1, images: MOCK_IMAGES.apartment },
  { propertyType: 'House', title: '4BR Detached', description: 'Open concept, walk-out basement. Major reno 2021: roof, siding, kitchen, and main-floor flooring. Gas heating, excellent insulation. Roof 4 years old.', price: 729000, sizeSqm: 185, bedroomsTotal: 4, bathroomsTotal: 3, images: MOCK_IMAGES.modern },
  { propertyType: 'Condo', title: 'Lakefront Condo', description: 'Panoramic water views. Building roof replacement 2020; unit interior refreshed 2023. Electric baseboard, good insulation. Appliances 5 years old.', price: 545000, sizeSqm: 102, bedroomsTotal: 2, bathroomsTotal: 2, images: MOCK_IMAGES.luxury },
  { propertyType: 'Townhouse', title: 'End-Unit Townhouse', description: 'No neighbours on one side. Roof replaced 2019; kitchen and bath reno 2022. Gas heating, good insulation. Low condo fees.', price: 512000, sizeSqm: 128, bedroomsTotal: 3, bathroomsTotal: 2, images: MOCK_IMAGES.garden },
  { propertyType: 'House', title: 'Bungalow with Suite', description: 'Legal basement apartment. Full roof upgrade and exterior reno 2021. Heat pump (main) and electric (suite), excellent insulation. Appliances 4 years.', price: 689000, sizeSqm: 155, bedroomsTotal: 4, bathroomsTotal: 3, images: MOCK_IMAGES.livingRoom },
];

/**
 * Fill a city bounding box with a grid of points so pins are distributed across the urban area.
 * (latMin, latMax, lngMin, lngMax) define the box; count points are placed in a grid within it.
 */
function fillCityBox(
  out: { lat: number; lng: number }[],
  latMin: number,
  latMax: number,
  lngMin: number,
  lngMax: number,
  count: number
): void {
  const rows = Math.max(1, Math.ceil(Math.sqrt(count)));
  const cols = Math.max(1, Math.ceil(count / rows));
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const r = rows > 1 ? row / (rows - 1) : 0.5;
    const c = cols > 1 ? col / (cols - 1) : 0.5;
    out.push({
      lat: latMin + (latMax - latMin) * r,
      lng: lngMin + (lngMax - lngMin) * c,
    });
  }
}

/**
 * One (lat, lng) per address so the pin matches the address. Coordinates are distributed
 * across each city's urban area (bounding box) so pins spread within the city.
 * Order matches REAL_ADDRESS_ROWS (Barrie, Innisfil, Orillia, Midland, Wasaga Beach, Collingwood).
 */
function buildAddressCoords(): { lat: number; lng: number }[] {
  const out: { lat: number; lng: number }[] = [];

  // Barrie: urban area ~44.36–44.42 lat, -79.72 to -79.58 lng. 51 addresses.
  fillCityBox(out, 44.36, 44.42, -79.72, -79.58, 51);
  // Innisfil: south of Barrie, 14 addresses.
  fillCityBox(out, 44.27, 44.34, -79.62, -79.52, 14);
  // Orillia: north, 15 addresses.
  fillCityBox(out, 44.58, 44.62, -79.45, -79.38, 15);
  // Midland: 10 addresses.
  fillCityBox(out, 44.72, 44.76, -79.9, -79.86, 10);
  // Wasaga Beach: 10 addresses.
  fillCityBox(out, 44.5, 44.54, -80.02, -79.95, 10);
  // Collingwood: 10 addresses.
  fillCityBox(out, 44.48, 44.52, -80.24, -80.18, 10);
  // Barrie again (101–110): 10 more spread in east Barrie.
  fillCityBox(out, 44.38, 44.42, -79.62, -79.56, 10);

  return out.slice(0, EXPECTED_ADDRESS_COUNT);
}

function parseAddressCoords(input: unknown): { lat: number; lng: number }[] | null {
  if (!Array.isArray(input) || input.length < EXPECTED_ADDRESS_COUNT) return null;
  const coords = input.slice(0, EXPECTED_ADDRESS_COUNT);
  const ok = coords.every(
    (item: unknown) =>
      item != null &&
      typeof item === 'object' &&
      Number.isFinite((item as { lat?: number }).lat) &&
      Number.isFinite((item as { lng?: number }).lng)
  );
  if (!ok) return null;
  return coords as { lat: number; lng: number }[];
}

/** Load committed address coordinates for both browser and Node; fallback to city grid when invalid. */
function loadAddressCoords(): { lat: number; lng: number }[] {
  const parsed = parseAddressCoords(addressCoordsJson as unknown);
  if (parsed) return parsed;
  return buildAddressCoords();
}

const ADDRESS_COORDS = loadAddressCoords();

/** Same 111 address strings used for mock listings (for geocode script). Format: "street, city, ON". */
export function getMockAddressStrings(): string[] {
  return REAL_ADDRESS_ROWS.map(([street, city]) => `${street}, ${city}, ON`);
}

/** Real Ontario address with house number. Each has a dedicated coordinate so the map pin is at that address location. */
type AddressEntry = { street: string; city: string; province: string; postalCode: string; latitude: number; longitude: number };

function realAddress(
  street: string,
  city: string,
  postalCode: string,
  index: number,
  coord: { lat: number; lng: number }
): AddressEntry {
  return { street, city, province: 'ONTARIO', postalCode, latitude: coord.lat, longitude: coord.lng };
}

/** 111 real Ontario addresses [street, city, postalCode]. Order matches ADDRESS_COORDS. */
const REAL_ADDRESS_ROWS: [string, string, string][] = [
    ['42 Dunlop St E', 'Barrie', 'L4M 1A1'],
    ['15 Bayfield St', 'Barrie', 'L4M 2E5'],
    ['88 Collier St', 'Barrie', 'L4N 3P2'],
    ['210 Maple Ave', 'Barrie', 'L4M 4G1'],
    ['550 Essa Rd', 'Barrie', 'L4M 5K2'],
    ['320 Cundles Rd E', 'Barrie', 'L4M 6N1'],
    ['1842 Innisfil Beach Rd', 'Innisfil', 'L9S 1A1'],
    ['2500 Yonge St', 'Innisfil', 'L9S 1B2'],
    ['123 St John\'s Rd', 'Innisfil', 'L9S 1C3'],
    ['456 Killarney Beach Rd', 'Innisfil', 'L9S 1D4'],
    ['789 Lakeshore Dr', 'Innisfil', 'L9S 1E5'],
    ['55 Victoria St', 'Barrie', 'L4M 3F6'],
    ['1012 Sunnidale Rd', 'Barrie', 'L4M 4G7'],
    ['200 Big Bay Point Rd', 'Innisfil', 'L9S 1H8'],
    ['350 20th Sideroad', 'Innisfil', 'L9S 1J9'],
    ['567 Grove St E', 'Barrie', 'L4M 7K1'],
    ['900 Simcoe Rd', 'Innisfil', 'L9S 1L2'],
    ['77 Mulcaster St', 'Barrie', 'L4M 9M3'],
    ['1450 Lefroy Rd', 'Innisfil', 'L9S 1N4'],
    ['110 Bayfield St', 'Barrie', 'L4M 2P5'],
    ['600 25th Sideroad', 'Innisfil', 'L9S 1Q6'],
    ['890 Blake St', 'Barrie', 'L4M 4R7'],
    ['1200 Innisfil Beach Rd', 'Innisfil', 'L9S 1S8'],
    ['199 Johnson St', 'Barrie', 'L4M 6T9'],
    ['2100 10th Line', 'Innisfil', 'L9S 1U1'],
    ['405 Bayfield St', 'Barrie', 'L4M 8V2'],
    ['750 5th Line', 'Innisfil', 'L9S 1W3'],
    ['380 Livingstone St E', 'Barrie', 'L4M 1X4'],
    ['500 Shore Acres Dr', 'Innisfil', 'L9S 1Y5'],
    ['155 Dunlop St W', 'Barrie', 'L4M 3Z6'],
    ['329 Blake St', 'Barrie', 'L4M 1L2'],
    ['509 Bayfield St', 'Barrie', 'L4M 4Z8'],
    ['1 Cook St', 'Barrie', 'L4M 4G5'],
    ['190 Cundles Rd E', 'Barrie', 'L4M 4S5'],
    ['353 Anne St', 'Barrie', 'L4N 7Z9'],
    ['490 Veterans Dr', 'Barrie', 'L4N 9N4'],
    ['1 Ferndale Dr N', 'Barrie', 'L4N 9V3'],
    ['55 Cloughley Dr', 'Barrie', 'L4N 9T7'],
    ['15 Edwards Dr', 'Barrie', 'L4N 9K6'],
    ['125 Bell Farm Rd', 'Barrie', 'L4M 5E2'],
    ['280 Bradford St', 'Barrie', 'L4N 3S5'],
    ['44 Cedar Pointe Dr', 'Barrie', 'L4N 5R7'],
    ['720 Bayview Dr', 'Barrie', 'L4N 9A1'],
    ['100 Duckworth St', 'Barrie', 'L4M 4R2'],
    ['234 Huronia Rd', 'Barrie', 'L4N 8Y5'],
    ['567 Little Ave', 'Barrie', 'L4M 6B3'],
    ['890 McLeod St', 'Barrie', 'L4M 2N8'],
    ['112 Nugget Ct', 'Barrie', 'L4N 7C4'],
    ['345 Owen St', 'Barrie', 'L4M 3P9'],
    ['678 Penetang St', 'Barrie', 'L4M 1T6'],
    ['901 Queen St', 'Barrie', 'L4M 2W1'],
    ['222 Rodney St', 'Barrie', 'L4M 4H7'],
    ['456 Saunders Rd', 'Barrie', 'L4N 6J2'],
    ['789 Tiffin St', 'Barrie', 'L4M 5K8'],
    ['111 Wellington St W', 'Barrie', 'L4N 8M3'],
    ['222 Yonge St', 'Barrie', 'L4N 9P6'],
    ['333 Algonquin Blvd', 'Orillia', 'L3V 1T2'],
    ['444 Borchardt Rd', 'Orillia', 'L3V 6H4'],
    ['555 Coldwater Rd', 'Orillia', 'L3V 3K7'],
    ['666 Dunedin St', 'Orillia', 'L3V 2N9'],
    ['777 Front St N', 'Orillia', 'L3V 4R1'],
    ['888 Gill St', 'Orillia', 'L3V 5T3'],
    ['999 Laclie St', 'Orillia', 'L3V 6W5'],
    ['100 Mississaga St E', 'Orillia', 'L3V 1V8'],
    ['200 Neywash St', 'Orillia', 'L3V 7Y2'],
    ['300 Peter St S', 'Orillia', 'L3V 4Z6'],
    ['400 West St N', 'Orillia', 'L3V 5A9'],
    ['501 Atherley Rd', 'Orillia', 'L3V 6B3'],
    ['602 Memorial Ave', 'Orillia', 'L3V 7C7'],
    ['703 Matchedash St N', 'Orillia', 'L3V 8D1'],
    ['804 Progress Dr', 'Orillia', 'L3V 9E5'],
    ['905 Bay St', 'Midland', 'L4R 4K2'],
    ['101 King St', 'Midland', 'L4R 3M6'],
    ['202 Hugel Ave', 'Midland', 'L4R 5N9'],
    ['303 Dominion Ave', 'Midland', 'L4R 6P3'],
    ['404 First St', 'Midland', 'L4R 7Q7'],
    ['505 Bayshore Dr', 'Midland', 'L4R 8R1'],
    ['606 Yonge St', 'Midland', 'L4R 9S5'],
    ['707 Elizabeth St', 'Midland', 'L4R 1T9'],
    ['808 William St', 'Midland', 'L4R 2U3'],
    ['909 Third St', 'Midland', 'L4R 3V7'],
    ['10 Mosley St', 'Wasaga Beach', 'L9Z 2W1'],
    ['120 Main St', 'Wasaga Beach', 'L9Z 3X5'],
    ['230 River Rd W', 'Wasaga Beach', 'L9Z 4Y9'],
    ['340 Golf Dr', 'Wasaga Beach', 'L9Z 5Z3'],
    ['450 Sunnidale Rd', 'Wasaga Beach', 'L9Z 6A7'],
    ['560 Oak St', 'Wasaga Beach', 'L9Z 7B1'],
    ['670 Bayview Dr', 'Wasaga Beach', 'L9Z 8C5'],
    ['780 Sunset Blvd', 'Wasaga Beach', 'L9Z 9D9'],
    ['890 Beach Dr', 'Wasaga Beach', 'L9Z 1E3'],
    ['1000 Pine St', 'Wasaga Beach', 'L9Z 2F7'],
    ['55 Hurontario St', 'Collingwood', 'L9Y 2L1'],
    ['100 First St', 'Collingwood', 'L9Y 3M5'],
    ['200 Ontario St', 'Collingwood', 'L9Y 4N9'],
    ['300 Pine St', 'Collingwood', 'L9Y 5P3'],
    ['400 Simcoe St', 'Collingwood', 'L9Y 6Q7'],
    ['500 Third St', 'Collingwood', 'L9Y 7R1'],
    ['600 Sixth St', 'Collingwood', 'L9Y 8S5'],
    ['700 Hume St', 'Collingwood', 'L9Y 9T9'],
    ['800 St Marie St', 'Collingwood', 'L9Y 1U3'],
    ['900 Birch St', 'Collingwood', 'L9Y 2V7'],
    ['111 Bradford St', 'Barrie', 'L4N 1W1'],
    ['222 Cundles Rd W', 'Barrie', 'L4N 3X5'],
    ['333 Livingstone St W', 'Barrie', 'L4N 5Y9'],
    ['444 Grove St W', 'Barrie', 'L4M 7Z3'],
    ['555 Burton Ave', 'Barrie', 'L4N 9A7'],
    ['666 Essa Rd', 'Barrie', 'L4M 2B1'],
    ['777 Tiffin St N', 'Barrie', 'L4M 4C5'],
    ['888 Wellington St E', 'Barrie', 'L4M 6D9'],
    ['999 Duckworth St', 'Barrie', 'L4M 8E3'],
    ['1000 Bayview Dr', 'Barrie', 'L4N 1F7'],
  ];

/** Build REAL_ADDRESSES: each entry gets the coordinate at the same index from ADDRESS_COORDS. */
function buildRealAddresses(): AddressEntry[] {
  return REAL_ADDRESS_ROWS.map(([street, city, postalCode], i) =>
    realAddress(street, city, postalCode, i, ADDRESS_COORDS[i] ?? ADDRESS_COORDS[0])
  );
}

const REAL_ADDRESSES = buildRealAddresses();

/** CREA DDF–style MLS payload (all properties used by mlsDataToListingFields). */
export type MockMLSPayload = {
  ListingKey: string;
  ListPrice: number;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  LivingArea: number;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  PropertyType: string;
  PublicRemarks: string;
  StandardStatus: string;
  Latitude: number;
  Longitude: number;
  Media: Array<{ MediaURL: string }>;
  UnparsedAddress: string;
  StreetAddress: string;
  StreetNumber?: string;
  StreetName?: string;
  StreetDirPrefix?: string;
  StreetDirSuffix?: string;
  StreetSuffix?: string;
  UnitNumber?: string;
  YearBuilt: number;
  LandSize: number;
  LotSize?: number;
  LotSizeSqFt?: number;
  HalfBathTotal?: number;
  BathroomsHalfTotal?: number;
  BuildingLevelTotal?: number;
  StoriesTotal?: number;
  LastUpdated: string;
  ModificationTimestamp?: string;
  Title?: string;
  Remarks?: string;
};

const HEATING_VALUES = ['HEAT_PUMP', 'GEOTHERMAL', 'GAS', 'ELECTRIC', 'OIL'] as const;
const INSULATION_VALUES = ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'] as const;
const ROOF_AGES = [2, 5, 8, 12, 18];
const APPLIANCE_AGES = [1, 3, 5, 8, 12];

/** Eco profile per template index (0–9) so ~half of mock listings score 7+ (green leaf). */
const ECO_PROFILES: Array<{
  heatingType: string;
  insulationQuality: string;
  hasRecentRenovations: boolean;
  roofAgeYears: number;
  appliancesAgeYears: number;
  yearBuiltOffset?: number; // years ago from current (smaller = newer)
}> = [
  { heatingType: 'HEAT_PUMP', insulationQuality: 'EXCELLENT', hasRecentRenovations: true, roofAgeYears: 2, appliancesAgeYears: 1, yearBuiltOffset: 5 },
  { heatingType: 'GEOTHERMAL', insulationQuality: 'EXCELLENT', hasRecentRenovations: true, roofAgeYears: 3, appliancesAgeYears: 2, yearBuiltOffset: 8 },
  { heatingType: 'GAS', insulationQuality: 'GOOD', hasRecentRenovations: true, roofAgeYears: 5, appliancesAgeYears: 3, yearBuiltOffset: 12 },
  { heatingType: 'HEAT_PUMP', insulationQuality: 'GOOD', hasRecentRenovations: true, roofAgeYears: 4, appliancesAgeYears: 2, yearBuiltOffset: 6 },
  { heatingType: 'OIL', insulationQuality: 'AVERAGE', hasRecentRenovations: false, roofAgeYears: 12, appliancesAgeYears: 8, yearBuiltOffset: 25 },
  { heatingType: 'ELECTRIC', insulationQuality: 'EXCELLENT', hasRecentRenovations: true, roofAgeYears: 2, appliancesAgeYears: 1, yearBuiltOffset: 4 },
  { heatingType: 'GEOTHERMAL', insulationQuality: 'EXCELLENT', hasRecentRenovations: true, roofAgeYears: 2, appliancesAgeYears: 2, yearBuiltOffset: 7 },
  { heatingType: 'GAS', insulationQuality: 'AVERAGE', hasRecentRenovations: false, roofAgeYears: 15, appliancesAgeYears: 10, yearBuiltOffset: 30 },
  { heatingType: 'HEAT_PUMP', insulationQuality: 'EXCELLENT', hasRecentRenovations: true, roofAgeYears: 5, appliancesAgeYears: 4, yearBuiltOffset: 10 },
  { heatingType: 'GAS', insulationQuality: 'GOOD', hasRecentRenovations: true, roofAgeYears: 6, appliancesAgeYears: 3, yearBuiltOffset: 14 },
];

export type MockListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  province: string;
  postalCode: string;
  sizeSqm: number;
  bedroomsTotal: number;
  bathroomsTotal: number;
  propertyType: string;
  latitude: number;
  longitude: number;
  images: readonly string[];
  status: string;
  streetAddress: string;
  unitNumber: string | null;
  yearBuilt: number;
  lotSizeSqm: number;
  standardStatus: string;
  halfBathroomsTotal: number;
  buildingLevelTotal: number;
  mlsLastUpdated: string;
  mlsId: string;
  mlsData: MockMLSPayload;
  ecoRatingScore: number | null;
  heatingType: string | null;
  insulationQuality: string | null;
  hasRecentRenovations: boolean | null;
  roofAgeYears: number | null;
  appliancesAgeYears: number | null;
};

/** 100 mock listings with real addresses, coordinates, full MLS attributes, and eco-rating data. */
function buildMockListings(): MockListing[] {
  const list: MockListing[] = [];
  const currentYear = new Date().getFullYear();
  for (let idx = 0; idx < 100; idx++) {
    const t = PROPERTY_TEMPLATES[idx % PROPERTY_TEMPLATES.length];
    const addr = REAL_ADDRESSES[idx % REAL_ADDRESSES.length];
    const n = idx + 1;
    const streetAddress = addr.street;
    const city = addr.city;
    const profile = ECO_PROFILES[idx % ECO_PROFILES.length];
    const yearBuilt = profile.yearBuiltOffset != null ? currentYear - profile.yearBuiltOffset : 1985 + (idx % 35);
    const lotSizeSqm = 350 + (idx % 650);
    const halfBathroomsTotal = idx % 2;
    const buildingLevelTotal = idx % 3 === 0 ? 2 : 1;
    const unitNumber = idx % 5 === 0 ? `Unit ${(idx % 3) + 1}` : null;
    const heatingType = profile.heatingType;
    const insulationQuality = profile.insulationQuality;
    const hasRecentRenovations = profile.hasRecentRenovations;
    const roofAgeYears = profile.roofAgeYears;
    const appliancesAgeYears = profile.appliancesAgeYears;
    const ecoScore = computeEcoRatingScore({
      yearBuilt,
      heatingType,
      insulationQuality,
      hasRecentRenovations,
      roofAgeYears,
      appliancesAgeYears,
    });
    const mlsId = `MOCK-MLS-${n}`;
    const mlsLastUpdated = new Date(Date.now() - idx * 3600000).toISOString();
    const mlsPayload: MockMLSPayload = {
      ListingKey: mlsId,
      ListPrice: t.price + (idx % 10) * 5000,
      City: city,
      StateOrProvince: addr.province,
      PostalCode: addr.postalCode,
      LivingArea: t.sizeSqm,
      BedroomsTotal: t.bedroomsTotal,
      BathroomsTotalInteger: t.bathroomsTotal,
      PropertyType: t.propertyType,
      PublicRemarks: t.description,
      StandardStatus: 'Active',
      Latitude: addr.latitude,
      Longitude: addr.longitude,
      Media: (t.images as readonly string[]).map((url) => ({ MediaURL: url })),
      UnparsedAddress: unitNumber ? `${streetAddress}, ${unitNumber}` : streetAddress,
      StreetAddress: streetAddress,
      StreetNumber: streetAddress.split(' ')[0] ?? undefined,
      StreetName: streetAddress.split(' ').slice(1).join(' ') || undefined,
      UnitNumber: unitNumber ?? undefined,
      YearBuilt: yearBuilt,
      LandSize: lotSizeSqm,
      LotSize: lotSizeSqm,
      HalfBathTotal: halfBathroomsTotal,
      BathroomsHalfTotal: halfBathroomsTotal,
      BuildingLevelTotal: buildingLevelTotal,
      StoriesTotal: buildingLevelTotal,
      LastUpdated: mlsLastUpdated,
      ModificationTimestamp: mlsLastUpdated,
      Title: t.title,
      Remarks: t.description,
    };
    list.push({
      id: `mock-${n}`,
      title: t.title,
      description: t.description,
      price: t.price + (idx % 10) * 5000,
      location: `${addr.street}, ${addr.city}, ON`,
      province: addr.province,
      postalCode: addr.postalCode,
      sizeSqm: t.sizeSqm,
      bedroomsTotal: t.bedroomsTotal,
      bathroomsTotal: t.bathroomsTotal,
      propertyType: t.propertyType,
      latitude: addr.latitude,
      longitude: addr.longitude,
      images: t.images,
      status: 'ACTIVE',
      streetAddress,
      unitNumber,
      yearBuilt,
      lotSizeSqm,
      standardStatus: 'Active',
      halfBathroomsTotal,
      buildingLevelTotal,
      mlsLastUpdated,
      mlsId,
      mlsData: mlsPayload,
      ecoRatingScore: ecoScore ?? null,
      heatingType,
      insulationQuality,
      hasRecentRenovations,
      roofAgeYears,
      appliancesAgeYears,
    });
  }
  return list;
}

/** Mock listings: 100 total, mapped onto curated Ontario address rows and coordinates. */
export const MOCK_LISTINGS = buildMockListings();

function isHttpsUrl(value: string): boolean {
  return /^https:\/\//i.test(value);
}

export function getMockDataValidationIssues(): string[] {
  const issues: string[] = [];
  if (MOCK_LISTINGS.length === 0) {
    issues.push('MOCK_LISTINGS is empty.');
  }
  for (const listing of MOCK_LISTINGS) {
    if (!listing.id) issues.push('Listing is missing id.');
    if (!listing.title?.trim()) issues.push(`Listing ${listing.id} is missing title.`);
    if (!listing.description?.trim()) issues.push(`Listing ${listing.id} is missing description.`);
    if (!listing.location?.trim()) issues.push(`Listing ${listing.id} is missing location.`);
    if (!Number.isFinite(listing.price) || listing.price <= 0) issues.push(`Listing ${listing.id} has invalid price.`);
    if (!Number.isFinite(listing.latitude) || !Number.isFinite(listing.longitude)) {
      issues.push(`Listing ${listing.id} has invalid coordinates.`);
    }
    if (!Array.isArray(listing.images) || listing.images.length === 0) {
      issues.push(`Listing ${listing.id} has no images.`);
      continue;
    }
    const badImage = listing.images.find((image) => typeof image !== 'string' || !isHttpsUrl(image));
    if (badImage) issues.push(`Listing ${listing.id} has invalid image URL.`);
  }
  return issues;
}

export function assertMockDataIntegrity(): void {
  const issues = getMockDataValidationIssues();
  if (issues.length === 0) return;
  const preview = issues.slice(0, 12).map((issue) => `- ${issue}`).join('\n');
  const remaining = issues.length > 12 ? `\n...and ${issues.length - 12} more issue(s)` : '';
  throw new Error(`Mock data validation failed:\n${preview}${remaining}`);
}

/** Filter params from AdvancedFilters (province, city, minPrice, maxPrice, bedrooms, bathrooms, propertyType) */
export type MockListingsFilters = Record<string, string | number | undefined>;

function toNum(v: string | number | undefined): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = typeof v === 'number' ? v : parseInt(String(v), 10);
  return Number.isNaN(n) ? undefined : n;
}

/** Apply AdvancedFilters-style params to a list of mock listings */
function applyMockFilters<T extends typeof MOCK_LISTINGS[number]>(
  listings: T[],
  filters: MockListingsFilters | undefined
): T[] {
  if (!filters || Object.keys(filters).length === 0) return listings;
  return listings.filter((l) => {
    const province = filters.province != null && String(filters.province).trim() !== '';
    if (province && String(l.province) !== String(filters.province)) return false;
    const city = filters.city != null && String(filters.city).trim() !== '';
    if (city && !String(l.location).toLowerCase().includes(String(filters.city).toLowerCase())) return false;
    const minPrice = toNum(filters.minPrice);
    if (minPrice != null && (l.price ?? 0) < minPrice) return false;
    const maxPrice = toNum(filters.maxPrice);
    if (maxPrice != null && (l.price ?? 0) > maxPrice) return false;
    const bedrooms = toNum(filters.bedrooms);
    if (bedrooms != null && (l.bedroomsTotal ?? 0) < bedrooms) return false;
    const bathrooms = toNum(filters.bathrooms);
    if (bathrooms != null && (l.bathroomsTotal ?? 0) < bathrooms) return false;
    const propertyType = filters.propertyType != null && String(filters.propertyType).trim() !== '';
    if (propertyType && String(l.propertyType) !== String(filters.propertyType)) return false;
    return true;
  });
}

/** Mock response for public/listings API: one page of mock listings, optionally filtered */
export function getMockListingsPage(page: number, pageSize = 10, filters?: MockListingsFilters) {
  const filtered = applyMockFilters(MOCK_LISTINGS, filters);
  const start = page * pageSize;
  const slice = filtered.slice(start, start + pageSize);
  return { listings: slice, nextPage: slice.length === pageSize ? page + 1 : null };
}

/** Mock response for nearby API: listings with lat/lng, optionally filtered */
export function getMockNearbyListings(filters?: MockListingsFilters) {
  const withCoords = MOCK_LISTINGS.filter((l) => l.latitude != null && l.longitude != null);
  return applyMockFilters(withCoords, filters);
}

/** Single listing for detail page (by id or first mock) */
export function getMockListing(id: string | undefined) {
  if (!id) return MOCK_LISTINGS[0];
  return MOCK_LISTINGS.find((l) => l.id === id) ?? MOCK_LISTINGS[0];
}

/** Favorites: array of { id, listingId, userId, listing } */
export function getMockFavorites() {
  return MOCK_LISTINGS.slice(0, 2).map((listing, i) => ({
    id: `mock-fav-${i + 1}`,
    listingId: listing.id,
    userId: 'mock-user',
    listing,
  }));
}

/** Notifications */
export const MOCK_NOTIFICATIONS = [
  { id: 'mock-n-1', message: 'Welcome to Pinkaroo', type: 'SYSTEM', read: false, createdAt: new Date().toISOString() },
  { id: 'mock-n-2', message: 'Your listing has been approved', type: 'APPROVAL', read: true, createdAt: new Date(Date.now() - 4 * 3600000).toISOString() },
  { id: 'mock-n-4', message: '[Broadcast] Weekly pipeline review due Friday 2pm', type: 'SYSTEM', read: false, createdAt: new Date(Date.now() - 9 * 3600000).toISOString() },
  {
    id: 'mock-n-3',
    message: 'Hi, I have a client interested in the 3BR listing. Can we schedule a viewing?',
    type: 'MESSAGE',
    read: false,
    flagged: false,
    createdAt: new Date().toISOString(),
    fromUserId: 'mock-sender-id',
    fromUser: { id: 'mock-sender-id', name: 'Jane Broker', email: 'jane@broker.example.com' },
  },
];
export function getMockNotifications() {
  return MOCK_NOTIFICATIONS;
}

const MOCK_SYSTEM_ADMIN = { id: 'mock-sa-1', email: 'admin@example.com', name: 'Morgan Blake', role: 'SYSTEM_ADMIN' };
const MOCK_OFFICE_ADMIN = { id: 'mock-oa-1', email: 'officeadmin@example.com', name: 'Avery Cole', role: 'OFFICE_ADMIN' };

/** Admin: brokers list */
export const MOCK_BROKERS = [
  { id: 'mock-b-1', email: 'broker@example.com', name: 'Jordan Lee', role: 'BROKER' },
  { id: 'mock-b-2', email: 'broker2@example.com', name: 'Riley Scott', role: 'BROKER' },
];

/** Admin: realtors list */
export const MOCK_REALTORS = [
  { id: 'mock-r-1', email: 'sam.chen@pinkaroo.ca', name: 'Sam Chen', role: 'REALTOR', brokerId: 'mock-b-1', broker: { id: 'mock-b-1', name: 'Jordan Lee' }, teamId: 'mock-team-1', team: { id: 'mock-team-1', name: 'Barrie Sales' }, isTeamLead: true, phone: '(705) 555-0101', availableHours: 'Mon-Fri 9am-6pm', listingsCount: 11, interactionsCount: 26 },
  { id: 'mock-r-2', email: 'alex.rivera@pinkaroo.ca', name: 'Alex Rivera', role: 'REALTOR', brokerId: 'mock-b-1', broker: { id: 'mock-b-1', name: 'Jordan Lee' }, teamId: 'mock-team-1', team: { id: 'mock-team-1', name: 'Barrie Sales' }, isTeamLead: false, phone: '(705) 555-0102', availableHours: 'Mon-Fri 8am-7pm', listingsCount: 9, interactionsCount: 31 },
  { id: 'mock-r-3', email: 'morgan.taylor@pinkaroo.ca', name: 'Morgan Taylor', role: 'REALTOR', brokerId: 'mock-b-2', broker: { id: 'mock-b-2', name: 'Riley Scott' }, teamId: 'mock-team-3', team: { id: 'mock-team-3', name: 'Orillia Growth' }, isTeamLead: true, phone: '(705) 555-0103', availableHours: 'Tue-Sat 9am-5pm', listingsCount: 7, interactionsCount: 18 },
  { id: 'mock-r-4', email: 'casey.wong@pinkaroo.ca', name: 'Casey Wong', role: 'REALTOR', brokerId: 'mock-b-1', broker: { id: 'mock-b-1', name: 'Jordan Lee' }, teamId: 'mock-team-2', team: { id: 'mock-team-2', name: 'Innisfil Partners' }, isTeamLead: false, phone: '(705) 555-0104', availableHours: 'Mon-Fri 10am-6pm', listingsCount: 6, interactionsCount: 22 },
  { id: 'mock-r-5', email: 'jamie.patel@pinkaroo.ca', name: 'Jamie Patel', role: 'REALTOR', brokerId: 'mock-b-2', broker: { id: 'mock-b-2', name: 'Riley Scott' }, teamId: null, team: null, isTeamLead: false, phone: '(705) 555-0105', availableHours: 'Mon-Thu 9am-5pm', listingsCount: 4, interactionsCount: 12 },
];

/** Broker teams (mock) */
export const MOCK_TEAMS = [
  { id: 'mock-team-1', name: 'Barrie Sales', brokerId: 'mock-b-1', targetListings: 24, targetRevenue: 3200000, targetInteractions: 90, members: [] },
  { id: 'mock-team-2', name: 'Innisfil Partners', brokerId: 'mock-b-1', targetListings: 16, targetRevenue: 2100000, targetInteractions: 60, members: [] },
  { id: 'mock-team-3', name: 'Orillia Growth', brokerId: 'mock-b-2', targetListings: 14, targetRevenue: 1800000, targetInteractions: 55, members: [] },
];

/** CRM clients */
export const MOCK_CLIENTS = [
  { id: 'mock-c-1', name: 'Olivia Carter', email: 'olivia.carter@example.com', phone: '555-0100', notes: 'Interested in waterfront options', status: 'LEAD', userId: 'mock-r-1', brokerId: 'mock-b-1', teamId: 'mock-team-1', createdAt: new Date(Date.now() - 23 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'mock-c-2', name: 'Ethan Brooks', email: 'ethan.brooks@example.com', phone: '555-0101', notes: 'Pre-approved, wants 4BR detached', status: 'QUALIFIED', userId: 'mock-r-2', brokerId: 'mock-b-1', teamId: 'mock-team-1', createdAt: new Date(Date.now() - 40 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 8 * 86400000).toISOString() },
  { id: 'mock-c-3', name: 'Mia Thompson', email: 'mia.thompson@example.com', phone: '555-0102', notes: 'Reviewing offer terms', status: 'NEGOTIATION', userId: 'mock-r-4', brokerId: 'mock-b-1', teamId: 'mock-team-2', createdAt: new Date(Date.now() - 31 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'mock-c-4', name: 'Lucas Green', email: 'lucas.green@example.com', phone: '555-0103', notes: 'Condo buyer, downtown focus', status: 'PROPOSAL', userId: 'mock-r-3', brokerId: 'mock-b-2', teamId: 'mock-team-3', createdAt: new Date(Date.now() - 18 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'mock-c-5', name: 'Charlotte Nguyen', email: 'charlotte.nguyen@example.com', phone: '555-0104', notes: 'Recently closed purchase', status: 'CLOSED', userId: 'mock-r-1', brokerId: 'mock-b-1', teamId: 'mock-team-1', createdAt: new Date(Date.now() - 65 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'mock-c-6', name: 'Noah Singh', email: 'noah.singh@example.com', phone: '555-0105', notes: 'Needs follow-up, no response for 2 weeks', status: 'LEAD', userId: 'mock-r-5', brokerId: 'mock-b-2', teamId: null, createdAt: new Date(Date.now() - 29 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 16 * 86400000).toISOString() },
];

/** Client interactions (for dashboard + CRM trend views) */
export const MOCK_INTERACTIONS = [
  { id: 'mock-i-1', type: 'Call', details: 'Initial discovery call', date: new Date(Date.now() - 20 * 86400000).toISOString(), clientId: 'mock-c-1', userId: 'mock-r-1' },
  { id: 'mock-i-2', type: 'Email', details: 'Sent listing package', date: new Date(Date.now() - 14 * 86400000).toISOString(), clientId: 'mock-c-1', userId: 'mock-r-1' },
  { id: 'mock-i-3', type: 'Meeting', details: 'Mortgage pre-approval review', date: new Date(Date.now() - 7 * 86400000).toISOString(), clientId: 'mock-c-2', userId: 'mock-r-2' },
  { id: 'mock-i-4', type: 'Showing', details: 'Showed 2 detached homes', date: new Date(Date.now() - 6 * 86400000).toISOString(), clientId: 'mock-c-2', userId: 'mock-r-2' },
  { id: 'mock-i-5', type: 'Document', details: 'Offer paperwork prepared', date: new Date(Date.now() - 5 * 86400000).toISOString(), clientId: 'mock-c-3', userId: 'mock-r-4' },
  { id: 'mock-i-6', type: 'Call', details: 'Counter-offer discussion', date: new Date(Date.now() - 4 * 86400000).toISOString(), clientId: 'mock-c-3', userId: 'mock-r-4' },
  { id: 'mock-i-7', type: 'Email', details: 'Sent proposal details', date: new Date(Date.now() - 10 * 86400000).toISOString(), clientId: 'mock-c-4', userId: 'mock-r-3' },
  { id: 'mock-i-8', type: 'Meeting', details: 'Final walk-through', date: new Date(Date.now() - 2 * 86400000).toISOString(), clientId: 'mock-c-5', userId: 'mock-r-1' },
];

/** MLS search results (full CREA DDF-style payload per listing for display/import) */
export const MOCK_MLS_RESULTS: MockMLSPayload[] = MOCK_LISTINGS.map((l) => l.mlsData);

export function getMockMLSResults() {
  return MOCK_MLS_RESULTS;
}

export function getMockClients() {
  return MOCK_CLIENTS;
}

export function getMockInteractions() {
  return MOCK_INTERACTIONS;
}

export function getMockRealtors() {
  return MOCK_REALTORS;
}

export function getMockTeams() {
  return MOCK_TEAMS.map((team) => ({
    ...team,
    members: MOCK_REALTORS.filter((realtor) => realtor.teamId === team.id),
  }));
}

export function getMockBrokers() {
  const teams = getMockTeams();
  return MOCK_BROKERS.map((broker) => ({
    ...broker,
    teamMembers: MOCK_REALTORS.filter((realtor) => realtor.brokerId === broker.id),
    teams: teams.filter((team) => team.brokerId === broker.id),
  }));
}

/** Broker dashboard stats */
export function getMockBrokerStats() {
  const teams = getMockTeams();
  return {
    teamCount: teams.length,
    teams,
    listings: 42,
    pending: 8,
    approved: 23,
    rejected: 4,
    realtors: MOCK_REALTORS,
    availableRealtors: MOCK_REALTORS.filter((r) => !r.teamId),
    revenue: [380000, 420000, 390000, 460000, 480000, 510000],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    teamPerformance: teams.map((team) => {
      const members = MOCK_REALTORS.filter((r) => r.teamId === team.id);
      const actualListings = members.reduce((sum, r) => sum + (r.listingsCount ?? 0), 0);
      const actualInteractions = members.reduce((sum, r) => sum + (r.interactionsCount ?? 0), 0);
      const actualRevenue = actualListings * 95000;
      return {
        id: team.id,
        name: team.name,
        members: members.length,
        targets: {
          listings: team.targetListings ?? 0,
          revenue: team.targetRevenue ?? 0,
          interactions: team.targetInteractions ?? 0,
        },
        actual: {
          listings: actualListings,
          revenue: actualRevenue,
          interactions: actualInteractions,
        },
      };
    }),
  };
}

export const MOCK_WORKLOAD_ASSIGNMENTS = [
  { id: 'mock-a-1', title: 'Follow up with Olivia', details: 'Confirm weekend showing availability', priority: 4, status: 'OPEN', dueAt: new Date(Date.now() + 2 * 86400000).toISOString(), realtorId: 'mock-r-1', clientId: 'mock-c-1', listingId: 'mock-2', realtor: { id: 'mock-r-1', name: 'Sam Chen', email: 'sam.chen@pinkaroo.ca' }, client: { id: 'mock-c-1', name: 'Olivia Carter', status: 'LEAD' }, listing: { id: 'mock-2', title: 'Condo with Lake View', status: 'ACTIVE' } },
  { id: 'mock-a-2', title: 'Prepare offer package', details: 'Review clauses with buyer', priority: 5, status: 'IN_PROGRESS', dueAt: new Date(Date.now() + 1 * 86400000).toISOString(), realtorId: 'mock-r-4', clientId: 'mock-c-3', listingId: 'mock-7', realtor: { id: 'mock-r-4', name: 'Casey Wong', email: 'casey.wong@pinkaroo.ca' }, client: { id: 'mock-c-3', name: 'Mia Thompson', status: 'NEGOTIATION' }, listing: { id: 'mock-7', title: '4BR Detached', status: 'PENDING' } },
  { id: 'mock-a-3', title: 'Revive stale lead', details: 'Call and send shortlist', priority: 3, status: 'BLOCKED', dueAt: new Date(Date.now() + 3 * 86400000).toISOString(), realtorId: 'mock-r-5', clientId: 'mock-c-6', listingId: null, realtor: { id: 'mock-r-5', name: 'Jamie Patel', email: 'jamie.patel@pinkaroo.ca' }, client: { id: 'mock-c-6', name: 'Noah Singh', status: 'LEAD' }, listing: null },
  { id: 'mock-a-4', title: 'Schedule closing prep', details: 'Coordinate legal and inspection docs', priority: 2, status: 'DONE', dueAt: new Date(Date.now() - 1 * 86400000).toISOString(), realtorId: 'mock-r-2', clientId: 'mock-c-2', listingId: 'mock-14', realtor: { id: 'mock-r-2', name: 'Alex Rivera', email: 'alex.rivera@pinkaroo.ca' }, client: { id: 'mock-c-2', name: 'Ethan Brooks', status: 'QUALIFIED' }, listing: { id: 'mock-14', title: 'Loft Downtown', status: 'APPROVED' } },
];

export const MOCK_COMMS_TEMPLATES = [
  { id: 'mock-tpl-1', brokerId: 'mock-b-1', name: 'Weekly KPI Review', body: 'Please update your weekly KPI notes before Friday 2pm.', createdAt: new Date(Date.now() - 12 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'mock-tpl-2', brokerId: 'mock-b-1', name: 'Approval Queue Reminder', body: 'Pending approval queue is high. Prioritize status updates today.', createdAt: new Date(Date.now() - 20 * 86400000).toISOString(), updatedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
];

export const MOCK_BROADCASTS = [
  { id: 'mock-bc-1', brokerId: 'mock-b-1', teamId: 'mock-team-1', templateId: 'mock-tpl-1', subject: 'Friday KPI checkpoint', message: 'Please publish your weekly KPI snapshot by 2pm Friday.', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), team: { id: 'mock-team-1', name: 'Barrie Sales' }, sentBy: { id: 'mock-b-1', name: 'Jordan Lee', email: 'broker@example.com' }, template: { id: 'mock-tpl-1', name: 'Weekly KPI Review' } },
  { id: 'mock-bc-2', brokerId: 'mock-b-1', teamId: null, templateId: null, subject: 'Open house weekend push', message: 'All teams: prioritize follow-up with leads from Saturday open houses.', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), team: null, sentBy: { id: 'mock-b-1', name: 'Jordan Lee', email: 'broker@example.com' }, template: null },
];

export const MOCK_AUDIT_LOGS = [
  { id: 'mock-log-1', actor: MOCK_SYSTEM_ADMIN, action: 'SYSTEM_SETTING_UPDATED', entityType: 'Config', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'mock-log-2', actor: MOCK_OFFICE_ADMIN, action: 'BROKER_ASSIGNMENT_UPDATED', entityType: 'User', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'mock-log-3', actor: { id: 'mock-b-1', name: 'Jordan Lee', email: 'broker@example.com', role: 'BROKER' }, action: 'ASSIGNMENT_REBALANCED', entityType: 'WorkloadAssignment', createdAt: new Date(Date.now() - 4 * 86400000).toISOString() },
  { id: 'mock-log-4', actor: { id: 'mock-b-1', name: 'Jordan Lee', email: 'broker@example.com', role: 'BROKER' }, action: 'BROADCAST_SENT', entityType: 'BrokerBroadcast', createdAt: new Date(Date.now() - 6 * 86400000).toISOString() },
];

export function getMockBrokerPerformance(windowMonths = 6) {
  const stats = getMockBrokerStats();
  return {
    windowMonths,
    teamPerformance: stats.teamPerformance,
    realtorPerformance: MOCK_REALTORS.map((realtor) => ({
      id: realtor.id,
      name: realtor.name,
      teamId: realtor.teamId,
      listings: realtor.listingsCount ?? 0,
      revenue: (realtor.listingsCount ?? 0) * 95000,
      interactions: realtor.interactionsCount ?? 0,
    })),
  };
}

export function getMockBrokerWorkload() {
  const openByRealtor = new Map<string, number>();
  for (const realtor of MOCK_REALTORS) openByRealtor.set(realtor.id, 0);
  for (const assignment of MOCK_WORKLOAD_ASSIGNMENTS) {
    if (assignment.status === 'DONE') continue;
    openByRealtor.set(assignment.realtorId, (openByRealtor.get(assignment.realtorId) ?? 0) + 1);
  }
  return {
    assignments: MOCK_WORKLOAD_ASSIGNMENTS,
    capacity: MOCK_REALTORS.map((realtor) => ({
      id: realtor.id,
      name: realtor.name,
      email: realtor.email,
      availableHours: realtor.availableHours ?? null,
      teamId: realtor.teamId ?? null,
      openAssignments: openByRealtor.get(realtor.id) ?? 0,
    })),
  };
}

export function getMockBrokerClientOversight() {
  const statusCounts = MOCK_CLIENTS.reduce<Record<string, number>>((acc, client) => {
    acc[client.status] = (acc[client.status] ?? 0) + 1;
    return acc;
  }, {});
  const stalled = MOCK_CLIENTS.filter((client) => {
    const updated = new Date(client.updatedAt).getTime();
    return Date.now() - updated > 14 * 86400000 && client.status !== 'CLOSED';
  });
  return {
    total: MOCK_CLIENTS.length,
    statusCounts,
    stalled: stalled.map((client) => ({
      id: client.id,
      name: client.name,
      status: client.status,
      updatedAt: client.updatedAt,
    })),
    aging: MOCK_CLIENTS.map((client) => ({
      id: client.id,
      name: client.name,
      status: client.status,
      daysOpen: Math.floor((Date.now() - new Date(client.createdAt).getTime()) / 86400000),
      realtorName: MOCK_REALTORS.find((r) => r.id === client.userId)?.name ?? 'Unknown',
    })).sort((a, b) => b.daysOpen - a.daysOpen),
    clients: MOCK_CLIENTS,
  };
}

export function getMockBrokerComms() {
  return {
    templates: MOCK_COMMS_TEMPLATES,
    broadcasts: MOCK_BROADCASTS,
    teams: getMockTeams().map((team) => ({ id: team.id, name: team.name })),
  };
}

export function getMockBrokerAdminControls() {
  return {
    auditLogs: MOCK_AUDIT_LOGS,
    teams: getMockTeams().map((team) => ({
      id: team.id,
      name: team.name,
      targetListings: team.targetListings ?? 0,
      targetRevenue: team.targetRevenue ?? 0,
      targetInteractions: team.targetInteractions ?? 0,
    })),
    realtors: MOCK_REALTORS.map((realtor) => ({
      id: realtor.id,
      name: realtor.name,
      email: realtor.email,
      teamId: realtor.teamId ?? null,
      isTeamLead: realtor.isTeamLead ?? false,
    })),
  };
}

export function getMockSystemAdminSettings() {
  return {
    settings: [
      { id: 'mock-cfg-1', key: 'app_name', value: 'Pinkaroo' },
      { id: 'mock-cfg-2', key: 'feature_broker_workload', value: 'true' },
      { id: 'mock-cfg-3', key: 'notifications_rate_limit_per_min', value: '25' },
    ],
  };
}

export function getMockSystemAdminPermissions() {
  return {
    key: 'role_permissions',
    permissions: {
      SYSTEM_ADMIN: ['*'],
      OFFICE_ADMIN: ['manage:brokers', 'manage:realtors', 'view:operational_dashboards'],
      BROKER: ['manage:teams', 'manage:assignments', 'approve:listings'],
      REALTOR: ['manage:own_clients', 'manage:own_listings'],
      USER: ['browse:listings'],
    },
  };
}

export function getMockSystemAdminAudit() {
  return {
    logs: MOCK_AUDIT_LOGS,
  };
}

/** Team portrait URLs delivered via Cloudinary (w=200 for sidebar avatar). */
const PINKAROO_AVATAR_SOURCES = [
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412742/pinkaroo/mock-assets/4a95ef0bd7842519.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412743/pinkaroo/mock-assets/07bfd9a3f6bea7d9.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412743/pinkaroo/mock-assets/0801b96097c096a3.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412744/pinkaroo/mock-assets/ba872df27366b6d7.jpg',
  'https://res.cloudinary.com/dnl7m5zyz/image/upload/v1772412745/pinkaroo/mock-assets/fdccfd155567b605.jpg',
];
const PINKAROO_AVATARS = PINKAROO_AVATAR_SOURCES;

/** Pinkaroo Real Estate brokerage: broker + realtors (for Contact a Realtor card) */
const PINKAROO_BROKER_ID = 'mock-pinkaroo-broker';
export const MOCK_PINKAROO_TEAM = [
  { id: PINKAROO_BROKER_ID, name: 'Jordan Lee', email: 'jordan.lee@pinkaroo.ca', phone: null, availableHours: null, role: 'BROKER', brokerId: null, broker: null, image: null, bio: null },
  { id: 'mock-pinkaroo-r1', name: 'Sam Chen', email: 'sam.chen@pinkaroo.ca', phone: '(705) 555-0101', availableHours: 'Mon–Fri 9am–6pm, Sat 10am–4pm', role: 'REALTOR', brokerId: PINKAROO_BROKER_ID, broker: { id: PINKAROO_BROKER_ID, name: 'Pinkaroo Real Estate' }, image: PINKAROO_AVATARS[0], bio: 'Residential specialist. 10+ years helping families find the right home.' },
  { id: 'mock-pinkaroo-r2', name: 'Alex Rivera', email: 'alex.rivera@pinkaroo.ca', phone: '(705) 555-0102', availableHours: 'Mon–Fri 8am–7pm, Sun by appointment', role: 'REALTOR', brokerId: PINKAROO_BROKER_ID, broker: { id: PINKAROO_BROKER_ID, name: 'Pinkaroo Real Estate' }, image: PINKAROO_AVATARS[1], bio: 'First-time buyers and condos. Bilingual (EN/ES).' },
  { id: 'mock-pinkaroo-r3', name: 'Morgan Taylor', email: 'morgan.taylor@pinkaroo.ca', phone: '(705) 555-0103', availableHours: 'Tue–Sat 9am–5pm', role: 'REALTOR', brokerId: PINKAROO_BROKER_ID, broker: { id: PINKAROO_BROKER_ID, name: 'Pinkaroo Real Estate' }, image: PINKAROO_AVATARS[2], bio: 'Lakeshore and waterfront. Top producer 2023.' },
  { id: 'mock-pinkaroo-r4', name: 'Casey Wong', email: 'casey.wong@pinkaroo.ca', phone: '(705) 555-0104', availableHours: 'Mon–Fri 10am–6pm', role: 'REALTOR', brokerId: PINKAROO_BROKER_ID, broker: { id: PINKAROO_BROKER_ID, name: 'Pinkaroo Real Estate' }, image: PINKAROO_AVATARS[3], bio: 'New builds and investment properties. Your local expert.' },
];

/** Shuffle and return Pinkaroo team (brokers + realtors) for random display. */
export function getMockPinkarooTeam(): typeof MOCK_PINKAROO_TEAM {
  const copy = [...MOCK_PINKAROO_TEAM];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Broker pending listings */
export function getMockBrokerPendingListings() {
  return [MOCK_LISTINGS[0], MOCK_LISTINGS[1], MOCK_LISTINGS[2], MOCK_LISTINGS[3]].map((listing, index) => {
    const realtor = MOCK_REALTORS[index % MOCK_REALTORS.length];
    return {
      ...listing,
      status: 'PENDING',
      user: { id: realtor.id, name: realtor.name, email: realtor.email },
    };
  });
}

/** Broker-approved listings (awaiting or on MLS). */
export function getMockBrokerApprovedListings() {
  return MOCK_LISTINGS.slice(0, 2).map((listing, index) => {
    const realtor = MOCK_REALTORS[index % MOCK_REALTORS.length];
    return {
      ...listing,
      status: 'APPROVED',
      mlsId: index === 0 ? 'MLS-MOCK-1' : null,
      user: { id: realtor.id, name: realtor.name, email: realtor.email },
    };
  });
}

/** User / realtor profile (for AgentProfileCard and realtors/[id]) */
export function getMockUser(id: string | undefined) {
  const realtor = MOCK_REALTORS.find((r) => r.id === id) ?? MOCK_REALTORS[0];
  const broker = MOCK_BROKERS.find((b) => b.id === realtor.brokerId);
  return {
    id: realtor.id,
    email: realtor.email,
    name: realtor.name,
    role: 'REALTOR',
    bio: 'Experienced in residential sales with strong local market coverage.',
    phone: realtor.phone,
    availableHours: realtor.availableHours,
    ratings: 4.5,
    listingsCount: realtor.listingsCount ?? 0,
    image: null,
    listings: MOCK_LISTINGS.slice(0, 6),
    teamMembers: [],
    broker: broker ? { id: broker.id, name: broker.name } : null,
  };
}
