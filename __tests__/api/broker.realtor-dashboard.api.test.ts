import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockUserFindFirst = jest.fn();
const mockListingGroupBy = jest.fn();
const mockListingCount = jest.fn();
const mockListingFindMany = jest.fn();
const mockInteractionCount = jest.fn();
const mockInteractionFindMany = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findFirst: mockUserFindFirst },
    listing: {
      groupBy: mockListingGroupBy,
      count: mockListingCount,
      findMany: mockListingFindMany,
    },
    interaction: {
      count: mockInteractionCount,
      findMany: mockInteractionFindMany,
    },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('GET /api/broker/realtor-dashboard/[id]', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/broker/realtor-dashboard/[id]')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'realtor-1' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(401);
  });

  it('returns 400 when id is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    const req = createMockRequest({ method: 'GET', query: {} });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 404 when realtor is not managed by broker', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockUserFindFirst.mockResolvedValue(null);
    const req = createMockRequest({ method: 'GET', query: { id: 'realtor-2' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(404);
  });

  it('returns 200 with realtor dashboard payload for broker', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockUserFindFirst.mockResolvedValue({
      id: 'realtor-1',
      name: 'Riley Agent',
      email: 'riley@example.com',
      teamId: 'team-1',
      team: { id: 'team-1', name: 'North Team' },
      isTeamLead: true,
    });
    mockListingGroupBy.mockResolvedValue([{ status: 'APPROVED', _count: { id: 3 } }]);
    mockListingCount.mockResolvedValue(5);
    mockListingFindMany
      .mockResolvedValueOnce([
        { id: 'l1', title: 'One', status: 'APPROVED', price: 500000, updatedAt: new Date(), createdAt: new Date() },
        { id: 'l2', title: 'Two', status: 'PENDING', price: 450000, updatedAt: new Date(), createdAt: new Date() },
      ])
      .mockResolvedValueOnce([
        { createdAt: new Date() },
        { createdAt: new Date() },
      ]);
    mockInteractionCount.mockResolvedValue(7);
    mockInteractionFindMany.mockResolvedValue([{ date: new Date() }, { date: new Date() }]);

    const req = createMockRequest({ method: 'GET', query: { id: 'realtor-1' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);

    expect(res._status).toBe(200);
    expect((res._json as any)?.realtor?.id).toBe('realtor-1');
    expect((res._json as any)?.summary?.totalListings).toBe(5);
    expect((res._json as any)?.summary?.interactionsTotal).toBe(7);
    expect(Array.isArray((res._json as any)?.charts?.months)).toBe(true);
    expect(Array.isArray((res._json as any)?.recentListings)).toBe(true);
  });
});
