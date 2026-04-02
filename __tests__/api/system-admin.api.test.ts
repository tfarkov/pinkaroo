import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockConfigFindMany = jest.fn();
const mockConfigFindUnique = jest.fn();
const mockConfigUpsert = jest.fn();
const mockAuditLogFindMany = jest.fn();
const mockAuditLogCreate = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    config: {
      findMany: mockConfigFindMany,
      findUnique: mockConfigFindUnique,
      upsert: mockConfigUpsert,
    },
    auditLog: {
      findMany: mockAuditLogFindMany,
      create: mockAuditLogCreate,
    },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('system-admin APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'sa-1', role: 'SYSTEM_ADMIN' } });
  });

  it('GET /api/system-admin/settings denies non-system admin', async () => {
    const handler = (await import('../../pages/api/system-admin/settings')).default;
    mockGetSession.mockResolvedValue({ user: { id: 'oa-1', role: 'OFFICE_ADMIN' } });
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(401);
  });

  it('PUT /api/system-admin/settings upserts config and writes audit', async () => {
    const handler = (await import('../../pages/api/system-admin/settings')).default;
    mockConfigUpsert.mockResolvedValue({ id: 'cfg-1', key: 'app_name', value: 'Pinkaroo' });
    const req = createMockRequest({
      method: 'PUT',
      body: { key: 'app_name', value: 'Pinkaroo' },
      headers: { 'x-forwarded-for': '203.0.113.41' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect(mockAuditLogCreate).toHaveBeenCalled();
  });

  it('PUT /api/system-admin/permissions stores permission matrix', async () => {
    const handler = (await import('../../pages/api/system-admin/permissions')).default;
    mockConfigUpsert.mockResolvedValue({ id: 'cfg-2' });
    const req = createMockRequest({
      method: 'PUT',
      headers: { 'x-forwarded-for': '203.0.113.42' },
      body: { permissions: { SYSTEM_ADMIN: ['*'] }, reason: 'test' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect(mockAuditLogCreate).toHaveBeenCalled();
  });

  it('GET /api/system-admin/audit returns log entries', async () => {
    const handler = (await import('../../pages/api/system-admin/audit')).default;
    mockAuditLogFindMany.mockResolvedValue([{ id: 'l1', action: 'X' }]);
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.logs?.length).toBe(1);
  });
});
