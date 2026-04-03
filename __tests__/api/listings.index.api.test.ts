import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockListingFindMany = jest.fn();
const mockListingCreate = jest.fn();
const mockListingUpdate = jest.fn();
const mockListingDelete = jest.fn();
const mockListingFindUnique = jest.fn();
const mockUserFindUnique = jest.fn();
const mockCloudinaryUpload = jest.fn();
const mockUploadFieldsMiddleware = jest.fn();
const mockGeocodeAddress = jest.fn();
const mockComputeEcoRatingScore = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    listing: {
      findMany: mockListingFindMany,
      create: mockListingCreate,
      update: mockListingUpdate,
      delete: mockListingDelete,
      findUnique: mockListingFindUnique,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

jest.mock('multer', () =>
  jest.fn(() => ({
    fields: jest.fn(() => mockUploadFieldsMiddleware),
  }))
);

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: (...args: unknown[]) => mockCloudinaryUpload(...args),
    },
  },
}));

jest.mock('../../lib/geocode', () => ({
  geocodeAddress: (...args: unknown[]) => mockGeocodeAddress(...args),
}));

jest.mock('../../lib/ecoRating', () => ({
  computeEcoRatingScore: (...args: unknown[]) => mockComputeEcoRatingScore(...args),
}));

describe('/api/listings (index route)', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/listings/index')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockListingFindMany.mockResolvedValue([]);
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    mockUploadFieldsMiddleware.mockImplementation((req: { files?: Record<string, unknown[]> }, _res: unknown, cb: (err?: Error) => void) => {
      req.files = { images: [], documents: [] };
      cb();
    });
    mockCloudinaryUpload.mockResolvedValue({ secure_url: 'https://img.example.com/one.jpg' });
    mockGeocodeAddress.mockResolvedValue({ lat: 43.7, lng: -79.4 });
    mockComputeEcoRatingScore.mockReturnValue(8);
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    (global as { io?: unknown }).io = undefined;
  });

  it('returns 401 when unauthenticated', async () => {
    const req = createMockRequest({ method: 'GET', query: {} });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(401);
  });

  it('returns 403 when USER attempts to create listing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    const req = createMockRequest({ method: 'POST', body: {} });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
  });

  it('POST returns 422 for invalid listing payload', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'realtor-1', role: 'REALTOR' } });
    const req = createMockRequest({
      method: 'POST',
      body: { title: '', description: '', location: '', price: 'nope' },
      headers: { 'x-forwarded-for': '203.0.113.40' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(422);
    expect(mockListingCreate).not.toHaveBeenCalled();
  });

  it('POST creates listing, geocodes missing coordinates, and notifies broker for REALTOR', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'realtor-1', role: 'REALTOR' } });
    mockUserFindUnique.mockResolvedValue({ brokerId: 'broker-1' });
    mockListingCreate.mockResolvedValue({ id: 'listing-1', title: 'New Listing' });
    const emit = jest.fn();
    (global as { io?: { to: (id: string) => { emit: (event: string, payload: unknown) => void } } }).io = {
      to: (_id: string) => ({ emit }),
    };
    const req = createMockRequest({
      method: 'POST',
      body: {
        title: 'New Listing',
        description: 'Great home',
        location: 'Toronto, ON',
        price: 550000,
        images: ['https://example.com/fallback.jpg'],
        yearBuilt: 2010,
      },
      headers: { 'x-forwarded-for': '203.0.113.41' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect(mockGeocodeAddress).toHaveBeenCalledWith('Toronto, ON');
    expect(mockListingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'realtor-1',
          status: 'PENDING',
          latitude: 43.7,
          longitude: -79.4,
          ecoRatingScore: 8,
        }),
      })
    );
    expect(emit).toHaveBeenCalled();
  });

  it('GET applies filters and mine scope', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindMany.mockResolvedValue(new Array(10).fill({ id: 'l' }));
    const req = createMockRequest({
      method: 'GET',
      query: {
        page: '2',
        mine: 'true',
        province: 'ONTARIO',
        city: 'Toronto',
        minPrice: '100000',
        maxPrice: '500000',
        bedrooms: '2',
        bathrooms: '1',
        propertyType: 'Condo',
      },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.nextPage).toBe(3);
    expect(mockListingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
        where: expect.objectContaining({
          userId: 'owner-1',
          province: 'ONTARIO',
          location: { contains: 'Toronto' },
          propertyType: 'Condo',
          bedroomsTotal: { gte: 2 },
          bathroomsTotal: { gte: 1 },
          price: { gte: 100000, lte: 500000 },
        }),
      })
    );
  });

  it('returns 400 when DELETE id is invalid', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    const req = createMockRequest({ method: 'DELETE', body: { id: '../bad' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(400);
    expect(mockListingDelete).not.toHaveBeenCalled();
  });

  it('returns 403 when non-owner USER attempts to delete listing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    const req = createMockRequest({ method: 'DELETE', body: { id: 'l1' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
    expect(mockListingDelete).not.toHaveBeenCalled();
  });

  it('blocks protected fields from being updated', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    const req = createMockRequest({
      method: 'PUT',
      body: { id: 'l1', userId: 'attacker-id' },
      headers: { 'x-forwarded-for': '203.0.113.20' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
    expect(mockListingUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when PUT has no update fields', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    const req = createMockRequest({
      method: 'PUT',
      body: { id: 'l1' },
      headers: { 'x-forwarded-for': '203.0.113.42' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 404 when PUT listing does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue(null);
    const req = createMockRequest({
      method: 'PUT',
      body: { id: 'missing', title: 'Update' },
      headers: { 'x-forwarded-for': '203.0.113.43' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(404);
    expect(mockListingUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 when non-owner USER attempts PUT update', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u2', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    const req = createMockRequest({
      method: 'PUT',
      body: { id: 'l1', title: 'Unauthorized update' },
      headers: { 'x-forwarded-for': '203.0.113.44' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
    expect(mockListingUpdate).not.toHaveBeenCalled();
  });

  it('returns 403 when USER attempts to update supportingDocuments', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    const req = createMockRequest({
      method: 'PUT',
      body: {
        id: 'l1',
        supportingDocuments: [{ url: 'https://evil.com/x', fileName: 'x.pdf', mimeType: 'application/pdf' }],
      },
      headers: { 'x-forwarded-for': '203.0.113.99' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
    expect(mockListingUpdate).not.toHaveBeenCalled();
  });

  it('blocks unknown fields from being updated', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    const req = createMockRequest({
      method: 'PUT',
      body: { id: 'l1', injectedField: 'oops' },
      headers: { 'x-forwarded-for': '203.0.113.21' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(422);
    expect(mockListingUpdate).not.toHaveBeenCalled();
  });

  it('denies USER from updating privileged status field', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    const req = createMockRequest({
      method: 'PUT',
      body: { id: 'l1', status: 'APPROVED' },
      headers: { 'x-forwarded-for': '203.0.113.23' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(422);
    expect(mockListingUpdate).not.toHaveBeenCalled();
  });

  it('allows BROKER to update status and rejectionReason', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    mockListingUpdate.mockResolvedValue({ id: 'l1', status: 'REJECTED', rejectionReason: 'Incomplete details' });
    const req = createMockRequest({
      method: 'PUT',
      body: { id: 'l1', status: 'REJECTED', rejectionReason: 'Incomplete details' },
      headers: { 'x-forwarded-for': '203.0.113.24' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect(mockListingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'l1' },
        data: expect.objectContaining({
          status: 'REJECTED',
          rejectionReason: 'Incomplete details',
        }),
      })
    );
  });

  it('recomputes eco score when eco fields change on PUT', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique
      .mockResolvedValueOnce({ id: 'l1', userId: 'owner-1' })
      .mockResolvedValueOnce({
        yearBuilt: 2000,
        heatingType: 'FORCED_AIR',
        insulationQuality: 'AVERAGE',
        hasRecentRenovations: false,
        roofAgeYears: 10,
        appliancesAgeYears: 6,
      });
    mockComputeEcoRatingScore.mockReturnValue(9);
    mockListingUpdate.mockResolvedValue({ id: 'l1', ecoRatingScore: 9 });
    const req = createMockRequest({
      method: 'PUT',
      body: { id: 'l1', yearBuilt: 2015 },
      headers: { 'x-forwarded-for': '203.0.113.45' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect(mockListingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'l1' },
        data: expect.objectContaining({
          yearBuilt: 2015,
          ecoRatingScore: 9,
        }),
      })
    );
  });

  it('rate limits excessive listing updates', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    mockListingUpdate.mockResolvedValue({ id: 'l1' });

    let lastRes = createMockResponse();
    for (let i = 0; i < 41; i += 1) {
      const req = createMockRequest({
        method: 'PUT',
        body: { id: 'l1', title: `Updated ${i}` },
        headers: { 'x-forwarded-for': '203.0.113.22' },
      });
      lastRes = createMockResponse();
      await runHandler(handler as any, req, lastRes);
    }

    expect(lastRes._status).toBe(429);
    expect(lastRes.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });

  it('returns 204 when owner USER deletes own listing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'owner-1', role: 'USER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    mockListingDelete.mockResolvedValue({});
    const req = createMockRequest({ method: 'DELETE', body: { id: 'l1' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(204);
    expect(mockListingDelete).toHaveBeenCalledWith({ where: { id: 'l1' } });
  });

  it('allows BROKER to delete non-owned listing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'l1', userId: 'owner-1' });
    mockListingDelete.mockResolvedValue({});
    const req = createMockRequest({ method: 'DELETE', body: { id: 'l1' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(204);
    expect(mockListingDelete).toHaveBeenCalledWith({ where: { id: 'l1' } });
  });
});

