/**
 * API tests for /api/favorites (GET, POST, DELETE).
 * Mocks getSession and Prisma.
 */
import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockFindMany = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();
const mockDelete = jest.fn();
const mockGetSession = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    favorite: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
      delete: mockDelete,
    },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('GET /api/favorites', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/favorites/favorites')).default;
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

  it('returns 405 for PUT', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
    const req = createMockRequest({ method: 'PUT' });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(405);
  });

  it('returns 200 and list when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
    mockFindMany.mockResolvedValue([{ userId: 'u1', listingId: 'mock-1', listing: {} }]);
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._json)).toBe(true);
  });
});

describe('POST /api/favorites', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/favorites/favorites')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
  });

  it('returns 400 when listingId is missing', async () => {
    const req = createMockRequest({ method: 'POST', body: {} });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 200 and creates favorite when body has listingId', async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ userId: 'u1', listingId: 'mock-1' });
    const req = createMockRequest({
      method: 'POST',
      body: { listingId: 'mock-1' },
    });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: 'u1', listingId: 'mock-1' },
    });
  });
});

describe('DELETE /api/favorites', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/favorites/favorites')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'u1' } });
    mockDelete.mockResolvedValue(undefined);
  });

  it('returns 400 when listingId is missing', async () => {
    const req = createMockRequest({ method: 'DELETE', body: {} });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 204 when listingId provided', async () => {
    const req = createMockRequest({
      method: 'DELETE',
      body: { listingId: 'mock-1' },
    });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(204);
    expect(res.end).toHaveBeenCalled();
  });
});
