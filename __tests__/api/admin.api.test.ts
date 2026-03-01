/**
 * API tests for /api/admin/users (paginated list).
 */
import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockUserFindMany = jest.fn();
const mockUserCount = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findMany: mockUserFindMany,
      count: mockUserCount,
    },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('GET /api/admin/users', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/admin/users')).default;
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

  it('returns 200 with users, nextPage, total when ADMIN with pagination', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', name: 'User 1', email: 'u1@test.com', role: 'USER', brokerId: null },
    ]);
    mockUserCount.mockResolvedValue(100);
    const req = createMockRequest({ method: 'GET', query: { page: '0', limit: '50' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.users).toBeDefined();
    expect(Array.isArray((res._json as any).users)).toBe(true);
    expect((res._json as any)?.nextPage).toBe(1);
    expect((res._json as any)?.total).toBe(100);
  });

  it('returns nextPage null when no more pages', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockUserFindMany.mockResolvedValue([{ id: 'u1', name: 'U1', email: 'u1@t.com', role: 'USER', brokerId: null }]);
    mockUserCount.mockResolvedValue(1);
    const req = createMockRequest({ method: 'GET', query: { page: '0', limit: '50' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.nextPage).toBeNull();
    expect((res._json as any)?.total).toBe(1);
  });
});
