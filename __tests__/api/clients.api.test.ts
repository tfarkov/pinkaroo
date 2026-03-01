/**
 * API tests for /api/clients/stats and /api/clients/[id]/interactions (paginated).
 */
import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockClientGroupBy = jest.fn();
const mockInteractionFindMany = jest.fn();
const mockInteractionCount = jest.fn();
const mockClientFindUnique = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    client: {
      groupBy: mockClientGroupBy,
      findUnique: mockClientFindUnique,
    },
    interaction: {
      findMany: mockInteractionFindMany,
      count: mockInteractionCount,
    },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('GET /api/clients/stats', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/clients/stats')).default;
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

  it('returns 200 with statusDistribution and interactionsByMonth when REALTOR', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'REALTOR' } });
    mockClientGroupBy.mockResolvedValue([{ status: 'LEAD', _count: { id: 5 } }, { status: 'CLOSED', _count: { id: 2 } }]);
    mockInteractionFindMany.mockResolvedValue([
      { date: new Date('2024-01-15') },
      { date: new Date('2024-01-20') },
    ]);
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.statusDistribution).toBeDefined();
    expect((res._json as any)?.interactionsByMonth).toBeDefined();
  });
});

describe('GET /api/clients/[id]/interactions', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/clients/[id]/interactions')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'client-1' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(401);
  });

  it('returns 400 when id is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'REALTOR' } });
    const req = createMockRequest({ method: 'GET', query: {} });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 403 when client belongs to another user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'REALTOR' } });
    mockClientFindUnique.mockResolvedValue({ id: 'client-1', userId: 'other-user' });
    const req = createMockRequest({ method: 'GET', query: { id: 'client-1' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(403);
  });

  it('returns 200 with interactions and nextPage when authorized', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'REALTOR' } });
    mockClientFindUnique.mockResolvedValue({ id: 'client-1', userId: 'u1' });
    mockInteractionFindMany.mockResolvedValue([
      { id: 'i1', type: 'Call', details: 'Called', date: new Date(), clientId: 'client-1', userId: 'u1' },
    ]);
    mockInteractionCount.mockResolvedValue(1);
    const req = createMockRequest({ method: 'GET', query: { id: 'client-1', page: '0', limit: '10' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.interactions).toBeDefined();
    expect(Array.isArray((res._json as any).interactions)).toBe(true);
    expect((res._json as any)?.nextPage).toBeDefined();
    expect((res._json as any)?.total).toBe(1);
  });
});
