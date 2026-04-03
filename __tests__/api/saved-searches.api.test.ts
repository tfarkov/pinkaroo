/**
 * API tests for /api/saved-searches and /api/saved-searches/[id].
 */
import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockSavedFindMany = jest.fn();
const mockSavedFindFirst = jest.fn();
const mockSavedCreate = jest.fn();
const mockSavedUpdate = jest.fn();
const mockSavedDelete = jest.fn();
const mockListingCount = jest.fn();
const mockNotificationCreate = jest.fn();
const mockGetSession = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    savedSearch: {
      findMany: mockSavedFindMany,
      findFirst: mockSavedFindFirst,
      create: mockSavedCreate,
      update: mockSavedUpdate,
      delete: mockSavedDelete,
    },
    listing: { count: mockListingCount },
    notification: { create: mockNotificationCreate },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('/api/saved-searches', () => {
  let indexHandler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    indexHandler = (await import('../../pages/api/saved-searches/index')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockListingCount.mockResolvedValue(0);
  });

  it('returns 401 when not authenticated (GET)', async () => {
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(indexHandler, req, res);
    expect(res._status).toBe(401);
  });

  it('returns 200 and digest rows (GET)', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
    const lastSeen = new Date('2024-06-01T00:00:00Z');
    const created = new Date('2024-01-01T00:00:00Z');
    mockSavedFindMany.mockResolvedValue([
      {
        id: 's1',
        userId: 'u1',
        name: 'Barrie',
        filters: { province: 'ONTARIO', city: 'Barrie' },
        notifyNewMatch: false,
        lastSeenAt: lastSeen,
        lastNotifiedAt: null,
        createdAt: created,
        updatedAt: created,
      },
    ]);
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(indexHandler, req, res);
    expect(res._status).toBe(200);
    const body = res._json as { id: string; newSinceSeenCount: number }[];
    expect(Array.isArray(body)).toBe(true);
    expect(body[0].id).toBe('s1');
    expect(body[0].newSinceSeenCount).toBe(0);
    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('returns 201 on POST with name and filters', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
    mockSavedCreate.mockResolvedValue({
      id: 'new1',
      userId: 'u1',
      name: 'My search',
      filters: { province: 'ONTARIO' },
      notifyNewMatch: false,
      lastSeenAt: new Date(),
    });
    const req = createMockRequest({
      method: 'POST',
      body: { name: 'My search', filters: { province: 'ONTARIO' } },
    });
    const res = createMockResponse();
    await runHandler(indexHandler, req, res);
    expect(res._status).toBe(201);
    expect(mockSavedCreate).toHaveBeenCalled();
  });

  it('returns 400 when POST body missing filters', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
    const req = createMockRequest({ method: 'POST', body: { name: 'X' } });
    const res = createMockResponse();
    await runHandler(indexHandler, req, res);
    expect(res._status).toBe(400);
  });
});

describe('/api/saved-searches/[id]', () => {
  let idHandler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    idHandler = (await import('../../pages/api/saved-searches/[id]')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
    mockSavedFindFirst.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      name: 'Test',
      filters: {},
      notifyNewMatch: false,
      lastSeenAt: new Date(),
      lastNotifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it('returns 404 when saved search not found', async () => {
    mockSavedFindFirst.mockResolvedValue(null);
    const req = createMockRequest({ method: 'DELETE', query: { id: 'missing' } });
    const res = createMockResponse();
    await runHandler(idHandler, req, res);
    expect(res._status).toBe(404);
  });

  it('returns 204 on DELETE', async () => {
    mockSavedDelete.mockResolvedValue(undefined);
    const req = createMockRequest({ method: 'DELETE', query: { id: 's1' } });
    const res = createMockResponse();
    await runHandler(idHandler, req, res);
    expect(res._status).toBe(204);
    expect(mockSavedDelete).toHaveBeenCalledWith({ where: { id: 's1' } });
  });

  it('returns 200 on PATCH markSeen', async () => {
    const updated = {
      id: 's1',
      userId: 'u1',
      name: 'Test',
      filters: {},
      notifyNewMatch: false,
      lastSeenAt: new Date(),
      lastNotifiedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockSavedUpdate.mockResolvedValue(updated);
    const req = createMockRequest({
      method: 'PATCH',
      query: { id: 's1' },
      body: { markSeen: true },
    });
    const res = createMockResponse();
    await runHandler(idHandler, req, res);
    expect(res._status).toBe(200);
    expect(mockSavedUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({ lastSeenAt: expect.any(Date) }),
      })
    );
  });
});
