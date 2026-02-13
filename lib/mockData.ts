import { DEFAULT_LOCATION } from './constants';

/** Unsplash real-estate sample images (w=800 for cards/detail). All IDs verified working. */
const MOCK_IMAGES = {
  familyHome: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
  ],
  condo: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753190-9814a1bd0f8f?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
  ],
  townhouse: [
    'https://images.unsplash.com/photo-1600042925851-5c8e4c2d7c2f?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
  ],
  bungalow: [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80',
  ],
  waterfront: [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
  ],
  apartment: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
  ],
  modern: [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
  ],
  luxury: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753190-9814a1bd0f8f?w=800&q=80',
  ],
  garden: [
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  ],
  livingRoom: [
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
  ],
  kitchen: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  ],
  exterior: [
    'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    'https://images.unsplash.com/photo-1600042925851-5c8e4c2d7c2f?w=800&q=80',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
  ],
  cottage: [
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80',
  ],
  loft: [
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  ],
  pool: [
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  ],
};

/** Mock listings used when API is unavailable (no auth, network error, etc.) */
export const MOCK_LISTINGS = [
  {
    id: 'mock-1',
    title: 'Cozy 3BR Family Home',
    description: 'Spacious family home with modern finishes.',
    price: 549000,
    location: 'Barrie, ON',
    province: 'ONTARIO',
    postalCode: 'L4M 1A1',
    sizeSqm: 165,
    bedroomsTotal: 3,
    bathroomsTotal: 2,
    propertyType: 'House',
    latitude: 44.3894,
    longitude: -79.6903,
    images: MOCK_IMAGES.familyHome,
    status: 'ACTIVE',
  },
  {
    id: 'mock-2',
    title: 'Downtown Condo with Lake View',
    description: 'Bright condo steps from the waterfront.',
    price: 425000,
    location: 'Barrie, ON',
    province: 'ONTARIO',
    postalCode: 'L4M 2E5',
    sizeSqm: 95,
    bedroomsTotal: 2,
    bathroomsTotal: 1,
    propertyType: 'Condo',
    latitude: 44.392,
    longitude: -79.688,
    images: MOCK_IMAGES.condo,
    status: 'ACTIVE',
  },
  {
    id: 'mock-3',
    title: 'Starter Townhouse',
    description: 'Low-maintenance townhouse in quiet area.',
    price: 485000,
    location: 'Barrie, ON',
    province: 'ONTARIO',
    postalCode: 'L4N 3P2',
    sizeSqm: 120,
    bedroomsTotal: 3,
    bathroomsTotal: 2,
    propertyType: 'Townhouse',
    latitude: 44.378,
    longitude: -79.702,
    images: MOCK_IMAGES.townhouse,
    status: 'ACTIVE',
  },
  {
    id: 'mock-4',
    title: 'Renovated Bungalow',
    description: 'Single-level living on a large lot.',
    price: 625000,
    location: 'Barrie, ON',
    province: 'ONTARIO',
    postalCode: 'L4M 4G1',
    sizeSqm: 140,
    bedroomsTotal: 3,
    bathroomsTotal: 2,
    propertyType: 'House',
    latitude: 44.395,
    longitude: -79.678,
    images: MOCK_IMAGES.bungalow,
    status: 'ACTIVE',
  },
  {
    id: 'mock-5',
    title: 'Waterfront Cottage',
    description: 'Private lot with dock and sunset views.',
    price: 899000,
    location: 'Barrie, ON',
    province: 'ONTARIO',
    postalCode: 'L4M 5K2',
    sizeSqm: 200,
    bedroomsTotal: 4,
    bathroomsTotal: 3,
    propertyType: 'House',
    latitude: 44.385,
    longitude: -79.695,
    images: MOCK_IMAGES.waterfront,
    status: 'ACTIVE',
  },
  {
    id: 'mock-6',
    title: 'Modern Apartment',
    description: 'New build, concierge, gym included.',
    price: 375000,
    location: 'Barrie, ON',
    province: 'ONTARIO',
    postalCode: 'L4M 6N1',
    sizeSqm: 85,
    bedroomsTotal: 2,
    bathroomsTotal: 1,
    propertyType: 'Apartment',
    latitude: 44.382,
    longitude: -79.692,
    images: MOCK_IMAGES.apartment,
    status: 'ACTIVE',
  },
  { id: 'mock-7', title: 'Stunning 4BR Detached', description: 'Open concept, walk-out basement.', price: 729000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 7A1', sizeSqm: 185, bedroomsTotal: 4, bathroomsTotal: 3, propertyType: 'House', latitude: 44.391, longitude: -79.681, images: MOCK_IMAGES.modern, status: 'ACTIVE' },
  { id: 'mock-8', title: 'Lakefront Condo', description: 'Panoramic water views.', price: 545000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 8B2', sizeSqm: 102, bedroomsTotal: 2, bathroomsTotal: 2, propertyType: 'Condo', latitude: 44.388, longitude: -79.689, images: MOCK_IMAGES.luxury, status: 'ACTIVE' },
  { id: 'mock-9', title: 'End-Unit Townhouse', description: 'No neighbours on one side.', price: 512000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4N 9C3', sizeSqm: 128, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'Townhouse', latitude: 44.376, longitude: -79.698, images: MOCK_IMAGES.garden, status: 'ACTIVE' },
  { id: 'mock-10', title: 'Bungalow with Suite', description: 'Legal basement apartment.', price: 689000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 1D4', sizeSqm: 155, bedroomsTotal: 4, bathroomsTotal: 3, propertyType: 'House', latitude: 44.394, longitude: -79.675, images: MOCK_IMAGES.livingRoom, status: 'ACTIVE' },
  { id: 'mock-11', title: 'Executive Waterfront', description: 'Deep water, premium finish.', price: 1199000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 2E5', sizeSqm: 240, bedroomsTotal: 5, bathroomsTotal: 4, propertyType: 'House', latitude: 44.386, longitude: -79.694, images: MOCK_IMAGES.waterfront, status: 'ACTIVE' },
  { id: 'mock-12', title: 'Downtown Loft', description: 'Exposed brick, high ceilings.', price: 398000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 3F6', sizeSqm: 88, bedroomsTotal: 1, bathroomsTotal: 1, propertyType: 'Apartment', latitude: 44.381, longitude: -79.691, images: MOCK_IMAGES.loft, status: 'ACTIVE' },
  { id: 'mock-13', title: 'Family Home on Cul-de-Sac', description: 'Quiet street, large backyard.', price: 589000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 4G7', sizeSqm: 172, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'House', latitude: 44.390, longitude: -79.682, images: MOCK_IMAGES.exterior, status: 'ACTIVE' },
  { id: 'mock-14', title: 'Corner Condo', description: 'Extra windows, bright.', price: 412000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 5H8', sizeSqm: 98, bedroomsTotal: 2, bathroomsTotal: 1, propertyType: 'Condo', latitude: 44.387, longitude: -79.686, images: MOCK_IMAGES.kitchen, status: 'ACTIVE' },
  { id: 'mock-15', title: 'Stacked Townhouse', description: 'Two-storey, garage.', price: 478000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4N 6J9', sizeSqm: 115, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'Townhouse', latitude: 44.377, longitude: -79.705, images: MOCK_IMAGES.cottage, status: 'ACTIVE' },
  { id: 'mock-16', title: 'Raised Bungalow', description: 'Full basement, double lot.', price: 655000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 7K1', sizeSqm: 148, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'House', latitude: 44.393, longitude: -79.677, images: MOCK_IMAGES.pool, status: 'ACTIVE' },
  { id: 'mock-17', title: 'Sandy Beach Access', description: 'Steps to the water.', price: 775000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 8L2', sizeSqm: 175, bedroomsTotal: 4, bathroomsTotal: 2, propertyType: 'House', latitude: 44.384, longitude: -79.696, images: MOCK_IMAGES.waterfront, status: 'ACTIVE' },
  { id: 'mock-18', title: 'Studio in the Core', description: 'Perfect for one.', price: 289000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 9M3', sizeSqm: 42, bedroomsTotal: 1, bathroomsTotal: 1, propertyType: 'Apartment', latitude: 44.383, longitude: -79.690, images: MOCK_IMAGES.apartment, status: 'ACTIVE' },
  { id: 'mock-19', title: 'Updated 3BR with Garage', description: 'New kitchen and baths.', price: 619000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 1N4', sizeSqm: 168, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'House', latitude: 44.389, longitude: -79.684, images: MOCK_IMAGES.livingRoom, status: 'ACTIVE' },
  { id: 'mock-20', title: 'Penthouse Views', description: 'Top floor, wraparound balcony.', price: 695000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 2P5', sizeSqm: 135, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'Condo', latitude: 44.392, longitude: -79.687, images: MOCK_IMAGES.luxury, status: 'ACTIVE' },
  { id: 'mock-21', title: 'Freehold Townhouse', description: 'No condo fees.', price: 535000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4N 3Q6', sizeSqm: 125, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'Townhouse', latitude: 44.375, longitude: -79.700, images: MOCK_IMAGES.garden, status: 'ACTIVE' },
  { id: 'mock-22', title: 'Vintage Bungalow', description: 'Character and charm.', price: 498000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 4R7', sizeSqm: 118, bedroomsTotal: 2, bathroomsTotal: 1, propertyType: 'House', latitude: 44.396, longitude: -79.679, images: MOCK_IMAGES.cottage, status: 'ACTIVE' },
  { id: 'mock-23', title: 'Year-Round Waterfront', description: 'Heated dock, fire pit.', price: 995000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 5S8', sizeSqm: 210, bedroomsTotal: 4, bathroomsTotal: 3, propertyType: 'House', latitude: 44.385, longitude: -79.693, images: MOCK_IMAGES.waterfront, status: 'ACTIVE' },
  { id: 'mock-24', title: 'One-Bedroom Plus Den', description: 'Flex space for office.', price: 345000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 6T9', sizeSqm: 72, bedroomsTotal: 1, bathroomsTotal: 1, propertyType: 'Apartment', latitude: 44.382, longitude: -79.688, images: MOCK_IMAGES.loft, status: 'ACTIVE' },
  { id: 'mock-25', title: 'New Construction 4BR', description: 'Tarion warranty.', price: 849000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 7U1', sizeSqm: 195, bedroomsTotal: 4, bathroomsTotal: 3, propertyType: 'House', latitude: 44.391, longitude: -79.680, images: MOCK_IMAGES.modern, status: 'ACTIVE' },
  { id: 'mock-26', title: 'Condo with Parking', description: 'Two spaces included.', price: 465000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 8V2', sizeSqm: 105, bedroomsTotal: 2, bathroomsTotal: 2, propertyType: 'Condo', latitude: 44.388, longitude: -79.685, images: MOCK_IMAGES.kitchen, status: 'ACTIVE' },
  { id: 'mock-27', title: 'Backsplit Townhouse', description: 'Four levels, lots of space.', price: 558000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4N 9W3', sizeSqm: 132, bedroomsTotal: 4, bathroomsTotal: 2, propertyType: 'Townhouse', latitude: 44.378, longitude: -79.701, images: MOCK_IMAGES.exterior, status: 'ACTIVE' },
  { id: 'mock-28', title: 'Bungalow with Pool', description: 'In-ground, fenced yard.', price: 735000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 1X4', sizeSqm: 160, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'House', latitude: 44.395, longitude: -79.676, images: MOCK_IMAGES.pool, status: 'ACTIVE' },
  { id: 'mock-29', title: 'Cottage-Style Waterfront', description: 'Boathouse included.', price: 849000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 2Y5', sizeSqm: 188, bedroomsTotal: 3, bathroomsTotal: 2, propertyType: 'House', latitude: 44.386, longitude: -79.692, images: MOCK_IMAGES.cottage, status: 'ACTIVE' },
  { id: 'mock-30', title: 'Two-Bedroom Condo', description: 'In-suite laundry.', price: 428000, location: 'Barrie, ON', province: 'ONTARIO', postalCode: 'L4M 3Z6', sizeSqm: 92, bedroomsTotal: 2, bathroomsTotal: 1, propertyType: 'Apartment', latitude: 44.381, longitude: -79.689, images: MOCK_IMAGES.apartment, status: 'ACTIVE' },
].map((l) => ({ ...l, latitude: l.latitude ?? DEFAULT_LOCATION.lat, longitude: l.longitude ?? DEFAULT_LOCATION.lng }));

/** Mock response for public/listings API: one page of mock listings */
export function getMockListingsPage(page: number, pageSize = 20) {
  const start = page * pageSize;
  const slice = MOCK_LISTINGS.slice(start, start + pageSize);
  return { listings: slice, nextPage: slice.length === pageSize ? page + 1 : null };
}

/** Mock response for nearby API: listings with lat/lng */
export function getMockNearbyListings() {
  return MOCK_LISTINGS.filter((l) => l.latitude != null && l.longitude != null);
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
  { id: 'mock-n-2', message: 'Your listing has been approved', type: 'APPROVAL', read: true, createdAt: new Date().toISOString() },
];
export function getMockNotifications() {
  return MOCK_NOTIFICATIONS;
}

/** CRM clients */
export const MOCK_CLIENTS = [
  { id: 'mock-c-1', name: 'Sample Lead', email: 'lead@example.com', phone: '555-0100', notes: 'Interested in 3BR', status: 'LEAD', userId: 'mock-user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-c-2', name: 'Jane Buyer', email: 'jane@example.com', phone: '555-0101', notes: '', status: 'QUALIFIED', userId: 'mock-user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];
export function getMockClients() {
  return MOCK_CLIENTS;
}

/** Client interactions (for dashboard) */
export const MOCK_INTERACTIONS = [
  { id: 'mock-i-1', type: 'Call', details: 'Initial contact', date: new Date().toISOString(), clientId: 'mock-c-1', userId: 'mock-user' },
];
export function getMockInteractions() {
  return MOCK_INTERACTIONS;
}

/** MLS search results (CREA-style objects for display/import) */
export const MOCK_MLS_RESULTS = MOCK_LISTINGS.map((l, i) => ({
  ListingKey: `MOCK-MLS-${i + 1}`,
  ListPrice: l.price,
  City: l.location.split(',')[0],
  StateOrProvince: l.province,
  PostalCode: l.postalCode,
  LivingArea: l.sizeSqm,
  BedroomsTotal: l.bedroomsTotal,
  BathroomsTotalInteger: l.bathroomsTotal,
  PropertyType: l.propertyType,
  PublicRemarks: l.description,
  StandardStatus: 'Active',
  Latitude: l.latitude,
  Longitude: l.longitude,
  Media: (l.images ?? []).map((url: string) => ({ MediaURL: url })),
}));
export function getMockMLSResults() {
  return MOCK_MLS_RESULTS;
}

/** Admin: realtors list */
export const MOCK_REALTORS = [
  { id: 'mock-r-1', email: 'realtor@example.com', name: 'Sample Realtor', role: 'REALTOR', brokerId: null, broker: null },
  { id: 'mock-r-2', email: 'realtor2@example.com', name: 'Another Realtor', role: 'REALTOR', brokerId: 'mock-b-1', broker: { id: 'mock-b-1', name: 'Sample Broker' } },
];
export function getMockRealtors() {
  return MOCK_REALTORS;
}

/** Admin: brokers list */
export const MOCK_BROKERS = [
  { id: 'mock-b-1', email: 'broker@example.com', name: 'Sample Broker', role: 'BROKER', teamMembers: [] },
];
export function getMockBrokers() {
  return MOCK_BROKERS;
}

/** Broker dashboard stats */
export function getMockBrokerStats() {
  return {
    teamCount: 2,
    listings: 5,
    pending: 1,
    approved: 3,
    rejected: 1,
    realtors: MOCK_REALTORS,
    revenue: [100000, 150000, 120000],
    months: ['Jan', 'Feb', 'Mar'],
  };
}

/** Unsplash portrait URLs for Pinkaroo team (w=200 for sidebar avatar) */
const PINKAROO_AVATARS = [
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80',
];

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
  return [MOCK_LISTINGS[0]].map((l) => ({ ...l, status: 'PENDING', user: { id: 'mock-r-1', name: 'Sample Realtor', email: 'realtor@example.com' } }));
}

/** User / realtor profile (for AgentProfileCard and realtors/[id]) */
export function getMockUser(id: string | undefined) {
  return {
    id: id ?? 'mock-r-1',
    email: 'realtor@example.com',
    name: 'Sample Realtor',
    role: 'REALTOR',
    bio: 'Experienced in residential sales.',
    ratings: 4.5,
    listingsCount: 3,
    image: null,
    listings: MOCK_LISTINGS.slice(0, 3),
    teamMembers: [],
    broker: null,
  };
}
