import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockUserFindMany = jest.fn();

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
  })),
}));

describe('/api/admin/weekly-kpis', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/admin/weekly-kpis')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockUserFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
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

  it('returns weekly KPI arrays for office/system admin', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'OFFICE_ADMIN' } });
    const now = new Date();
    mockUserFindMany
      .mockResolvedValueOnce([{ createdAt: now }])
      .mockResolvedValueOnce([{ createdAt: now, updatedAt: now, brokerId: 'b1' }]);

    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(res._status).toBe(200);
    expect((res._json as any)?.labels).toHaveLength(8);
    expect((res._json as any)?.newBrokers).toHaveLength(8);
    expect((res._json as any)?.newRealtors).toHaveLength(8);
    expect((res._json as any)?.assignmentUpdates).toHaveLength(8);
    expect(mockUserFindMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ role: 'BROKER' }) })
    );
    expect(mockUserFindMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ role: 'REALTOR' }) })
    );
  });
});
