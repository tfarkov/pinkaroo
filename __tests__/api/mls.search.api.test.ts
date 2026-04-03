import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockBuildMLSFilter = jest.fn();
const mockSearchMLS = jest.fn();
const mockImportListingFromMLS = jest.fn();

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

jest.mock('../../lib/mls', () => ({
  buildMLSFilter: (...args: unknown[]) => mockBuildMLSFilter(...args),
  searchMLS: (...args: unknown[]) => mockSearchMLS(...args),
  importListingFromMLS: (...args: unknown[]) => mockImportListingFromMLS(...args),
}));

describe('/api/mls/search', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/mls/search')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockBuildMLSFilter.mockReturnValue('StandardStatus eq \'Active\'');
    mockSearchMLS.mockResolvedValue([]);
    mockImportListingFromMLS.mockResolvedValue({ id: 'listing-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(res._status).toBe(401);
  });

  it('returns 403 for unauthorized role', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(res._status).toBe(403);
  });

  it('returns 200 for GET and passes parsed params to filter/search', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'REALTOR' } });
    mockSearchMLS.mockResolvedValue([{ ListingKey: 'MLS-1' }]);
    const req = createMockRequest({
      method: 'GET',
      query: {
        city: 'Barrie',
        minPrice: '450000',
        bedrooms: '3',
      },
    });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(res._status).toBe(200);
    expect(mockBuildMLSFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        city: 'Barrie',
        minPrice: 450000,
        bedrooms: 3,
      })
    );
    expect(mockSearchMLS).toHaveBeenCalledWith('StandardStatus eq \'Active\'');
    expect(res._json).toEqual([{ ListingKey: 'MLS-1' }]);
  });

  it('returns 400 for POST without mlsData', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'BROKER' } });
    const req = createMockRequest({ method: 'POST', body: {} });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(res._status).toBe(400);
  });

  it('imports MLS listing for POST when authorized', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'SYSTEM_ADMIN' } });
    const mlsData = { ListingKey: 'MLS-2' };
    const req = createMockRequest({ method: 'POST', body: { mlsData } });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(mockImportListingFromMLS).toHaveBeenCalledWith(mlsData, 'u1');
    expect(res._status).toBe(200);
    expect(res._json).toEqual({ id: 'listing-1' });
  });
});
