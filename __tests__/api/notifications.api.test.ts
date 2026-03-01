import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockNotificationFindMany = jest.fn();
const mockNotificationFindFirst = jest.fn();
const mockNotificationCreate = jest.fn();
const mockNotificationUpdate = jest.fn();
const mockUserFindUnique = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    notification: {
      findMany: mockNotificationFindMany,
      findFirst: mockNotificationFindFirst,
      create: mockNotificationCreate,
      update: mockNotificationUpdate,
    },
    user: {
      findUnique: mockUserFindUnique,
    },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('/api/notifications authorization rules', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/notifications')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockNotificationFindMany.mockResolvedValue([]);
    mockNotificationFindFirst.mockResolvedValue(null);
    mockNotificationCreate.mockResolvedValue({});
    mockNotificationUpdate.mockResolvedValue({});
    mockUserFindUnique.mockResolvedValue(null);
  });

  it('returns 401 when unauthenticated', async () => {
    const req = createMockRequest({ method: 'POST', body: { toUserId: 'x', message: 'Hi' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(401);
  });

  it('allows USER to message staff', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    mockUserFindUnique.mockResolvedValue({ role: 'REALTOR' });
    const req = createMockRequest({ method: 'POST', body: { toUserId: 'r1', message: 'Hello' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(201);
    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'r1', fromUserId: 'u1', type: 'MESSAGE' }),
      })
    );
  });

  it('denies USER to USER messages', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    mockUserFindUnique.mockResolvedValue({ role: 'USER' });
    const req = createMockRequest({ method: 'POST', body: { toUserId: 'u2', message: 'Hello' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
  });

  it('allows unsolicited REALTOR to BROKER messages', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'r1', role: 'REALTOR' } });
    mockUserFindUnique.mockResolvedValue({ role: 'BROKER' });
    const req = createMockRequest({ method: 'POST', body: { toUserId: 'b1', message: 'Quick update' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(201);
    expect(mockNotificationFindFirst).not.toHaveBeenCalled();
  });

  it('denies unsolicited BROKER to USER messages', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'b1', role: 'BROKER' } });
    mockUserFindUnique.mockResolvedValue({ role: 'USER' });
    mockNotificationFindFirst.mockResolvedValue(null);
    const req = createMockRequest({ method: 'POST', body: { toUserId: 'u1', message: 'Checking in' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
  });

  it('allows BROKER to USER replies after user contact', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'b1', role: 'BROKER' } });
    mockUserFindUnique.mockResolvedValue({ role: 'USER' });
    mockNotificationFindFirst.mockResolvedValue({ id: 'msg-1' });
    const req = createMockRequest({ method: 'POST', body: { toUserId: 'u1', message: 'Responding back' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(201);
  });

  it('allows ADMIN to message USER unsolicited', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } });
    mockUserFindUnique.mockResolvedValue({ role: 'USER' });
    const req = createMockRequest({ method: 'POST', body: { toUserId: 'u1', message: 'Admin announcement' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(201);
    expect(mockNotificationFindFirst).not.toHaveBeenCalled();
  });

  it('returns 404 when recipient does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } });
    mockUserFindUnique.mockResolvedValue(null);
    const req = createMockRequest({ method: 'POST', body: { toUserId: 'missing', message: 'Ping' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(404);
  });
});
