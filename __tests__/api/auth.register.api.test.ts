import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockHash = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: mockUserFindUnique,
      create: mockUserCreate,
    },
  })),
}));

jest.mock('bcryptjs', () => ({
  hash: (...args: unknown[]) => mockHash(...args),
}));

jest.mock('../../pages/api/auth/[...nextauth]', () => ({
  BCRYPT_ROUNDS: 10,
}));

describe('POST /api/auth/register', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/auth/register')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindUnique.mockResolvedValue(null);
    mockHash.mockResolvedValue('hashed-password');
    mockUserCreate.mockResolvedValue({
      id: 'u1',
      email: 'new@test.com',
      role: 'USER',
      name: 'New User',
    });
  });

  it('forces USER role even if elevated role is requested', async () => {
    const req = createMockRequest({
      method: 'POST',
      body: { email: 'new@test.com', password: 'supersecure123', role: 'ADMIN' },
      headers: { 'x-forwarded-for': '203.0.113.10' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(201);
    const createArg = mockUserCreate.mock.calls[0]?.[0] as any;
    expect(createArg?.data?.role).toBe('USER');
  });

  it('rate limits excessive registration attempts', async () => {
    let lastRes = createMockResponse();
    for (let i = 0; i < 11; i += 1) {
      const req = createMockRequest({
        method: 'POST',
        body: { email: `user${i}@test.com`, password: 'supersecure123' },
        headers: { 'x-forwarded-for': '203.0.113.11' },
      });
      lastRes = createMockResponse();
      await runHandler(handler as any, req, lastRes);
    }
    expect(lastRes._status).toBe(429);
    expect(lastRes.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });
});
