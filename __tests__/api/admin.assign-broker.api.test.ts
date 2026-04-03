import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockUserUpdate = jest.fn();
const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  })),
}));

describe('/api/admin/assign-broker', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/admin/assign-broker')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(null);
    mockUserUpdate.mockResolvedValue({ id: 'realtor-1', brokerId: 'broker-1' });
    (globalThis as any).io = { to: mockTo };
  });

  afterEach(() => {
    delete (globalThis as any).io;
  });

  it('returns 401 when unauthenticated', async () => {
    const req = createMockRequest({ method: 'POST', body: { realtorId: 'realtor-1', brokerId: 'broker-1' } });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(res._status).toBe(401);
  });

  it('returns 401 when role cannot manage brokers and realtors', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'BROKER' } });
    const req = createMockRequest({ method: 'POST', body: { realtorId: 'realtor-1', brokerId: 'broker-1' } });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(res._status).toBe(401);
  });

  it('returns 400 when realtorId is missing', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'SYSTEM_ADMIN' } });
    const req = createMockRequest({ method: 'POST', body: { realtorId: '' } });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(res._status).toBe(400);
  });

  it('updates assignment and emits notification', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'OFFICE_ADMIN' } });
    const req = createMockRequest({
      method: 'POST',
      body: { realtorId: '  realtor-1  ', brokerId: ' broker-1 ' },
    });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'realtor-1' },
      data: { brokerId: 'broker-1' },
    });
    expect(mockTo).toHaveBeenCalledWith('  realtor-1  ');
    expect(mockEmit).toHaveBeenCalledWith('notification', expect.any(Object));
    expect(res._status).toBe(200);
  });

  it('unassigns broker when brokerId is blank', async () => {
    mockGetSession.mockResolvedValue({ user: { id: 'u1', role: 'SYSTEM_ADMIN' } });
    const req = createMockRequest({
      method: 'POST',
      body: { realtorId: 'realtor-1', brokerId: '   ' },
    });
    const res = createMockResponse();

    await runHandler(handler, req, res);

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'realtor-1' },
      data: { brokerId: null },
    });
    expect(res._status).toBe(200);
  });
});
