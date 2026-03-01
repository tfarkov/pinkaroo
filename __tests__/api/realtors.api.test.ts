/**
 * API tests for /api/realtors/[id] and /api/realtors/pinkaroo.
 */
import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockUserFindUnique = jest.fn();
const mockUserFindFirst = jest.fn();
const mockUserFindMany = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: mockUserFindUnique,
      findFirst: mockUserFindFirst,
      findMany: mockUserFindMany,
    },
  })),
}));

describe('GET /api/realtors/[id]', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/realtors/[id]')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindUnique.mockResolvedValue(null);
  });

  it('returns 405 for non-GET', async () => {
    const req = createMockRequest({ method: 'POST', query: { id: 'r1' } });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(405);
  });

  it('returns 400 when id is missing', async () => {
    const req = createMockRequest({ method: 'GET', query: {} });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 404 when user not found', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'nonexistent' } });
    const res = createMockResponse();
    mockUserFindUnique.mockResolvedValue(null);
    await runHandler(handler, req, res);
    expect(res._status).toBe(404);
  });

  it('returns 404 when user is not REALTOR or BROKER', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'u1' } });
    const res = createMockResponse();
    mockUserFindUnique.mockResolvedValue({
      id: 'u1',
      role: 'USER',
      name: 'John',
      listings: [],
    });
    await runHandler(handler, req, res);
    expect(res._status).toBe(404);
  });

  it('returns 200 and user when REALTOR found', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'r1' } });
    const res = createMockResponse();
    mockUserFindUnique.mockResolvedValue({
      id: 'r1',
      role: 'REALTOR',
      name: 'Jane Realtor',
      broker: { id: 'b1', name: 'Broker' },
      listings: [{ id: 'l1', title: 'Listing' }],
    });
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.id).toBe('r1');
    expect((res._json as any)?.role).toBe('REALTOR');
  });
});

describe('GET /api/realtors/pinkaroo', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/realtors/pinkaroo')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindFirst.mockResolvedValue(null);
  });

  it('returns 405 for non-GET', async () => {
    const req = createMockRequest({ method: 'POST' });
    const res = createMockResponse();
    await runHandler(handler, req, res);
    expect(res._status).toBe(405);
  });

  it('returns 200 with mock team when no broker in DB', async () => {
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    mockUserFindFirst.mockResolvedValue(null);
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._json)).toBe(true);
  });

  it('returns 200 with team from DB when broker found', async () => {
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    mockUserFindFirst.mockResolvedValue({
      id: 'b1',
      name: 'Pinkaroo Broker',
      role: 'BROKER',
      broker: null,
    });
    mockUserFindMany.mockResolvedValue([
      { id: 'r1', name: 'Realtor 1', role: 'REALTOR', broker: { id: 'b1', name: 'Pinkaroo' } },
    ]);
    await runHandler(handler, req, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._json)).toBe(true);
  });
});
