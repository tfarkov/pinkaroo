import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockListingFindMany = jest.fn();
const mockListingCreate = jest.fn();
const mockListingUpdate = jest.fn();
const mockListingDelete = jest.fn();
const mockListingFindUnique = jest.fn();
const mockUserFindUnique = jest.fn();

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
});

