import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();
const mockTeamFindUnique = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
    team: {
      findUnique: mockTeamFindUnique,
    },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('/api/users/[id]', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/users/[id]')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue(null);
    mockUserUpdate.mockResolvedValue({
      id: 'u1',
      email: 'u1@test.com',
      role: 'USER',
      name: 'User One',
      brokerId: null,
      teamId: null,
      isTeamLead: false,
    });
  });

  it('returns 403 when non-privileged user requests another user profile', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    mockUserFindUnique.mockResolvedValue({
      id: 'u2',
      email: 'u2@test.com',
      role: 'USER',
      name: 'User Two',
      brokerId: null,
      teamId: null,
      isTeamLead: false,
    });
    const req = createMockRequest({ method: 'GET', query: { id: 'u2' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const req = createMockRequest({ method: 'GET', query: { id: 'u1' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(401);
  });

  it('returns 400 when id param is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    const req = createMockRequest({ method: 'GET', query: {} });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(400);
  });

  it('returns 200 for self profile and never includes password', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    mockUserFindUnique.mockResolvedValue({
      id: 'u1',
      email: 'u1@test.com',
      role: 'USER',
      name: 'User One',
      brokerId: null,
      teamId: null,
      isTeamLead: false,
    });
    const req = createMockRequest({ method: 'GET', query: { id: 'u1' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.password).toBeUndefined();
  });

  it('returns safe fields only on self update', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    const req = createMockRequest({ method: 'PUT', query: { id: 'u1' }, body: { name: 'Updated' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    const updateArg = mockUserUpdate.mock.calls[0]?.[0] as any;
    expect(updateArg?.select?.password).toBeUndefined();
  });

  it('allows OFFICE_ADMIN to fetch another user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'OFFICE_ADMIN' } });
    mockUserFindUnique.mockResolvedValue({
      id: 'u2',
      email: 'u2@test.com',
      role: 'USER',
      name: 'User Two',
      brokerId: null,
      teamId: null,
      isTeamLead: false,
    });
    const req = createMockRequest({ method: 'GET', query: { id: 'u2' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
  });

  it('returns 404 when GET target user does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'admin-1', role: 'OFFICE_ADMIN' } });
    mockUserFindUnique.mockResolvedValue(null);
    const req = createMockRequest({ method: 'GET', query: { id: 'missing' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(404);
  });

  it('returns 403 when non-self PUT editor cannot edit target', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'USER' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ role: 'USER', brokerId: null, isTeamLead: false })
      .mockResolvedValueOnce({ brokerId: null });
    const req = createMockRequest({
      method: 'PUT',
      query: { id: 'u2' },
      body: { name: 'Updated' },
      headers: { 'x-forwarded-for': '203.0.113.46' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(403);
  });

  it('returns 404 when PUT target user does not exist', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ role: 'BROKER', brokerId: null, isTeamLead: false })
      .mockResolvedValueOnce(null);
    const req = createMockRequest({
      method: 'PUT',
      query: { id: 'u2' },
      body: { name: 'Updated' },
      headers: { 'x-forwarded-for': '203.0.113.47' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(404);
  });

  it('returns 400 when broker sets invalid team for target user', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ role: 'BROKER', brokerId: null, isTeamLead: false })
      .mockResolvedValueOnce({ brokerId: 'broker-1' });
    mockTeamFindUnique.mockResolvedValue({ brokerId: 'broker-other' });
    const req = createMockRequest({
      method: 'PUT',
      query: { id: 'u2' },
      body: { teamId: 'team-1' },
      headers: { 'x-forwarded-for': '203.0.113.48' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(400);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it('allows broker to update teamId when team belongs to broker', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockUserFindUnique
      .mockResolvedValueOnce({ role: 'BROKER', brokerId: null, isTeamLead: false })
      .mockResolvedValueOnce({ brokerId: 'broker-1' });
    mockTeamFindUnique.mockResolvedValue({ brokerId: 'broker-1' });
    mockUserUpdate.mockResolvedValue({ id: 'u2', teamId: 'team-1' });
    const req = createMockRequest({
      method: 'PUT',
      query: { id: 'u2' },
      body: { teamId: 'team-1' },
      headers: { 'x-forwarded-for': '203.0.113.49' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u2' },
        data: expect.objectContaining({ teamId: 'team-1' }),
      })
    );
  });
});
