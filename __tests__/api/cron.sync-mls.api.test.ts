import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockSyncMLS = jest.fn();

jest.mock('../../lib/mls', () => ({
  syncMLS: () => mockSyncMLS(),
}));

describe('GET /api/cron/sync-mls', () => {
  let handler: (req: unknown, res: unknown) => Promise<void>;

  beforeAll(async () => {
    handler = (await import('../../pages/api/cron/sync-mls')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
  });

  it('returns 401 when authorization header is missing', async () => {
    const req = createMockRequest({ method: 'GET', headers: {} });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(401);
    expect(mockSyncMLS).not.toHaveBeenCalled();
  });

  it('returns 503 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const req = createMockRequest({ method: 'GET', headers: { authorization: 'Bearer anything' } });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(503);
    expect(mockSyncMLS).not.toHaveBeenCalled();
  });

  it('runs sync and returns 200 when bearer token is valid', async () => {
    const req = createMockRequest({ method: 'GET', headers: { authorization: 'Bearer test-secret' } });
    const res = createMockResponse();
    mockSyncMLS.mockResolvedValue(undefined);
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.success).toBe(true);
  });
});

