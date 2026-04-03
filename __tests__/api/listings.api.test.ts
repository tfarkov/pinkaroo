/**
 * API tests for /api/listings/nearby, /api/listings/public, /api/listings/[id].
 * Mocks Prisma to avoid DB; tests validation, method checks, and response shape.
 */
import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockListingFindMany = jest.fn();
const mockListingFindFirst = jest.fn();
const mockListingFindUnique = jest.fn();
const mockUserFindUnique = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    listing: {
      findMany: mockListingFindMany,
      findFirst: mockListingFindFirst,
      findUnique: mockListingFindUnique,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  })),
}));

describe('GET /api/listings/nearby', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/listings/nearby')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockListingFindMany.mockResolvedValue([]);
  });

  it('returns 405 for non-GET', async () => {
    const req = createMockRequest({ method: 'POST', query: {} });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(405);
    expect(mockListingFindMany).not.toHaveBeenCalled();
  });

  it('returns 400 when lat is missing', async () => {
    const req = createMockRequest({ method: 'GET', query: { lng: '-79.69' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
    expect((res._json as any)?.error).toMatch(/lat|required/i);
  });

  it('returns 400 when lng is missing', async () => {
    const req = createMockRequest({ method: 'GET', query: { lat: '44.39' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 200 and array when lat/lng provided', async () => {
    const req = createMockRequest({
      method: 'GET',
      query: { lat: '44.3894', lng: '-79.6903' },
    });
    const res = createMockResponse();
    const sampleListing = {
      id: 'mock-1',
      title: 'Test',
      latitude: 44.39,
      longitude: -79.69,
      status: 'ACTIVE',
      price: 500000,
      location: 'Barrie, ON',
      province: 'ONTARIO',
      description: '',
      postalCode: null,
      sizeSqm: null,
      bedroomsTotal: null,
      bathroomsTotal: null,
      propertyType: null,
      images: [],
      mlsId: 'MLS-TEST-1',
      userId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockListingFindMany.mockResolvedValue([sampleListing]);
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._json)).toBe(true);
    expect((res._json as any[]).length).toBeGreaterThanOrEqual(0);
    expect(mockListingFindMany).toHaveBeenCalled();
  });
});

describe('GET /api/listings/public', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/listings/public')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockListingFindMany.mockResolvedValue([]);
  });

  it('returns 405 for non-GET', async () => {
    const req = createMockRequest({ method: 'POST' });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(405);
  });

  it('returns 200 with listings and nextPage', async () => {
    const req = createMockRequest({ method: 'GET', query: { page: '0' } });
    const res = createMockResponse();
    mockListingFindMany.mockResolvedValue([{ id: '1', title: 'Listing', mlsId: 'MLS-1' }]);
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.listings).toBeDefined();
    expect((res._json as any)?.nextPage).toBeDefined();
  });

  it('returns listings with ecoRatingScore as number and eco fields', async () => {
    const req = createMockRequest({ method: 'GET', query: { page: '0' } });
    const res = createMockResponse();
    mockListingFindMany.mockResolvedValue([
      {
        id: 'm1',
        title: 'Green House',
        description: 'Eco',
        price: 500000,
        location: 'Barrie',
        province: 'ONTARIO',
        postalCode: null,
        sizeSqm: 100,
        bedroomsTotal: 2,
        bathroomsTotal: 1,
        propertyType: 'House',
        latitude: 44,
        longitude: -79,
        images: [],
        status: 'ACTIVE',
        mlsId: 'MLS-E1',
        userId: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ecoRatingScore: 7.2,
        heatingType: 'HEAT_PUMP',
        insulationQuality: 'EXCELLENT',
        hasRecentRenovations: true,
        roofAgeYears: 3,
        appliancesAgeYears: 2,
      },
    ]);
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    const listings = (res._json as any)?.listings;
    expect(listings).toHaveLength(1);
    expect(listings[0].ecoRatingScore).toBe(7.2);
    expect(typeof listings[0].ecoRatingScore).toBe('number');
    expect(listings[0].heatingType).toBe('HEAT_PUMP');
  });
});

jest.mock('../../lib/session', () => ({
  getSession: jest.fn().mockResolvedValue(null),
}));

describe('GET /api/listings/[id]', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/listings/[id]')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockListingFindUnique.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue(null);
  });

  it('returns 405 for non-GET', async () => {
    const req = createMockRequest({ method: 'POST', query: { id: 'mock-1' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(405);
  });

  it('returns 400 when id is missing', async () => {
    const req = createMockRequest({ method: 'GET', query: {} });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 400 for id "new"', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'new' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
    expect((res._json as any)?.error).toBeDefined();
  });

  it('returns 404 when listing not found', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'nonexistent' } });
    const res = createMockResponse();
    mockListingFindUnique.mockResolvedValue(null);
    await runHandler(handler, req, res);
    expect(res._status).toBe(404);
  });

  it('returns 200 and listing when found', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'mock-1' } });
    const res = createMockResponse();
    const listing = {
      id: 'mock-1',
      title: 'Test Listing',
      description: 'Desc',
      price: 500000,
      location: 'Barrie, ON',
      province: 'ONTARIO',
      postalCode: 'L4M 1A1',
      sizeSqm: 100,
      bedroomsTotal: 3,
      bathroomsTotal: 2,
      propertyType: 'House',
      latitude: 44.3894,
      longitude: -79.6903,
      images: [],
      mlsId: 'MLS-DETAIL-1',
      status: 'ACTIVE',
      userId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
      streetAddress: null,
      unitNumber: null,
      yearBuilt: null,
      lotSizeSqm: null,
      standardStatus: null,
      halfBathroomsTotal: null,
      buildingLevelTotal: null,
      mlsLastUpdated: null,
      mlsData: null,
      ecoRatingScore: null,
      heatingType: null,
      insulationQuality: null,
      hasRecentRenovations: null,
      roofAgeYears: null,
      appliancesAgeYears: null,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
    };
    mockListingFindUnique.mockResolvedValue(listing);
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.id).toBe('mock-1');
    expect((res._json as any)?.title).toBe('Test Listing');
    expect((res._json as any)?.latitude).toBe(44.3894);
    expect((res._json as any)?.longitude).toBe(-79.6903);
  });

  it('returns 200 with eco fields when present', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'mock-1' } });
    const res = createMockResponse();
    mockListingFindUnique.mockResolvedValue({
      id: 'mock-1',
      title: 'Eco Listing',
      description: 'Green home',
      price: 600000,
      location: 'Barrie, ON',
      province: 'ONTARIO',
      postalCode: 'L4M 1A1',
      sizeSqm: 120,
      bedroomsTotal: 3,
      bathroomsTotal: 2,
      propertyType: 'House',
      latitude: 44.3894,
      longitude: -79.6903,
      images: [],
      mlsId: 'MLS-ECO-1',
      status: 'ACTIVE',
      userId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
      streetAddress: null,
      unitNumber: null,
      yearBuilt: null,
      lotSizeSqm: null,
      standardStatus: null,
      halfBathroomsTotal: null,
      buildingLevelTotal: null,
      mlsLastUpdated: null,
      mlsData: null,
      ecoRatingScore: 8,
      heatingType: 'HEAT_PUMP',
      insulationQuality: 'EXCELLENT',
      hasRecentRenovations: true,
      roofAgeYears: 4,
      appliancesAgeYears: 2,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
    });
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.ecoRatingScore).toBe(8);
    expect((res._json as any)?.heatingType).toBe('HEAT_PUMP');
  });
});
