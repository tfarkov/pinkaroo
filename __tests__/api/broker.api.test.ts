/**
 * API tests for /api/broker/stats and /api/broker/approve-listing.
 */
import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockUserFindMany = jest.fn();
const mockTeamFindMany = jest.fn();
const mockListingGroupBy = jest.fn();
const mockListingCount = jest.fn();
const mockListingFindMany = jest.fn();
const mockInteractionGroupBy = jest.fn();
const mockListingFindUnique = jest.fn();
const mockListingUpdate = jest.fn();
const mockNotificationCreate = jest.fn();
const mockNotificationCreateMany = jest.fn();
const mockAuditLogCreate = jest.fn();
const mockTxUserFindMany = jest.fn();

const mockTx = {
  listing: { update: mockListingUpdate },
  notification: { create: mockNotificationCreate, createMany: mockNotificationCreateMany },
  auditLog: { create: mockAuditLogCreate },
  user: { findMany: mockTxUserFindMany },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findMany: mockUserFindMany },
    team: { findMany: mockTeamFindMany },
    listing: {
      groupBy: mockListingGroupBy,
      count: mockListingCount,
      findMany: mockListingFindMany,
      findUnique: mockListingFindUnique,
      update: mockListingUpdate,
    },
    interaction: {
      groupBy: mockInteractionGroupBy,
    },
    notification: { create: mockNotificationCreate },
    auditLog: { create: mockAuditLogCreate },
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

  it('returns 403 when authenticated but not BROKER', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(403);
  });

  it('returns 200 with teamCount and listings when BROKER', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockUserFindMany.mockResolvedValue([{ id: 'r1', name: 'R1', email: 'r1@test.com', listingsCount: 2, teamId: null, isTeamLead: false }]);
    mockTeamFindMany.mockResolvedValue([{ id: 't1', name: 'Team A', _count: { members: 1 } }]);
    mockListingGroupBy.mockResolvedValue([{ status: 'PENDING', _count: { id: 1 } }, { status: 'APPROVED', _count: { id: 3 } }]);
    mockListingCount.mockResolvedValue(4);
    mockListingFindMany.mockResolvedValue([{ userId: 'r1', price: 100000, approvedAt: new Date(), updatedAt: new Date() }]);
    mockInteractionGroupBy.mockResolvedValue([{ userId: 'r1', _count: { id: 2 } }]);
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
    mockTxUserFindMany.mockResolvedValue([]);
    mockNotificationCreateMany.mockResolvedValue({ count: 0 });
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

  it('returns 200 with changed false when status unchanged (still pending)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'listing-1', status: 'PENDING', userId: 'u1', title: 'T' });
    const req = createMockRequest({ method: 'POST', body: { id: 'listing-1', status: 'PENDING' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.changed).toBe(false);
  });

  it('returns 400 when listing is not pending (e.g. draft)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockListingFindUnique.mockResolvedValue({ id: 'listing-1', status: 'DRAFT', userId: 'u1' });
    const req = createMockRequest({ method: 'POST', body: { id: 'listing-1', status: 'APPROVED' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
  });
});
