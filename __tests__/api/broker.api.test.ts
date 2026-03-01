/**
 * API tests for /api/broker/stats and /api/broker/approve-listing.
 */
import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockUserFindMany = jest.fn();
const mockListingGroupBy = jest.fn();
const mockListingCount = jest.fn();
const mockListingFindUnique = jest.fn();
const mockListingUpdate = jest.fn();
const mockNotificationCreate = jest.fn();

const mockTx = {
  listing: { update: mockListingUpdate },
  notification: { create: mockNotificationCreate },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findMany: mockUserFindMany },
    listing: {
      groupBy: mockListingGroupBy,
      count: mockListingCount,
      findUnique: mockListingFindUnique,
      update: mockListingUpdate,
    },
    notification: { create: mockNotificationCreate },
    $transaction: (fn: (tx: typeof mockTx) => Promise<void>) => fn(mockTx),
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('GET /api/broker/stats', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/broker/stats')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(401);
  });

  it('returns 200 with teamCount and listings when BROKER', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockUserFindMany.mockResolvedValue([{ id: 'r1', name: 'R1', email: 'r1@test.com', listingsCount: 2 }]);
    mockListingGroupBy.mockResolvedValue([{ status: 'PENDING', _count: { id: 1 } }, { status: 'APPROVED', _count: { id: 3 } }]);
    mockListingCount.mockResolvedValue(4);
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.teamCount).toBe(1);
    expect((res._json as any)?.listings).toBe(4);
  });
});

describe('POST /api/broker/approve-listing', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/broker/approve-listing')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    const req = createMockRequest({ method: 'POST', body: { id: 'listing-1', status: 'APPROVED' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(401);
  });

  it('returns 400 when id is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    const req = createMockRequest({ method: 'POST', body: { status: 'APPROVED' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 404 when listing not found', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockListingFindUnique.mockResolvedValue(null);
    const req = createMockRequest({ method: 'POST', body: { id: 'nonexistent', status: 'APPROVED' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(404);
  });

  it('returns 200 with changed false when status unchanged', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'listing-1', status: 'APPROVED', userId: 'u1' });
    const req = createMockRequest({ method: 'POST', body: { id: 'listing-1', status: 'APPROVED' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.changed).toBe(false);
  });
});
