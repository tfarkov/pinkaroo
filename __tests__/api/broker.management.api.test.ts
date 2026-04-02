import { createMockRequest, createMockResponse, runHandler } from './helpers';

const mockGetSession = jest.fn();
const mockUserFindMany = jest.fn();
const mockUserFindFirst = jest.fn();
const mockTeamFindMany = jest.fn();
const mockTeamFindFirst = jest.fn();
const mockTeamUpdate = jest.fn();
const mockClientFindMany = jest.fn();
const mockClientFindFirst = jest.fn();
const mockClientUpdate = jest.fn();
const mockListingFindMany = jest.fn();
const mockListingFindFirst = jest.fn();
const mockInteractionFindMany = jest.fn();
const mockAssignmentFindMany = jest.fn();
const mockAssignmentCreate = jest.fn();
const mockAssignmentUpdate = jest.fn();
const mockTemplateFindMany = jest.fn();
const mockTemplateFindFirst = jest.fn();
const mockTemplateCreate = jest.fn();
const mockBroadcastFindMany = jest.fn();
const mockBroadcastCreate = jest.fn();
const mockNotificationCreateMany = jest.fn();
const mockAuditLogFindMany = jest.fn();
const mockAuditLogCreate = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: { findMany: mockUserFindMany, findFirst: mockUserFindFirst },
    team: { findMany: mockTeamFindMany, findFirst: mockTeamFindFirst, update: mockTeamUpdate },
    client: { findMany: mockClientFindMany, findFirst: mockClientFindFirst, update: mockClientUpdate },
    listing: { findMany: mockListingFindMany, findFirst: mockListingFindFirst },
    interaction: { findMany: mockInteractionFindMany },
    workloadAssignment: { findMany: mockAssignmentFindMany, create: mockAssignmentCreate, update: mockAssignmentUpdate },
    commsTemplate: { findMany: mockTemplateFindMany, findFirst: mockTemplateFindFirst, create: mockTemplateCreate },
    brokerBroadcast: { findMany: mockBroadcastFindMany, create: mockBroadcastCreate },
    notification: { createMany: mockNotificationCreateMany },
    auditLog: { findMany: mockAuditLogFindMany, create: mockAuditLogCreate },
  })),
}));

jest.mock('../../lib/session', () => ({
  getSession: (...args: unknown[]) => mockGetSession(...args),
}));

describe('Broker management APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ user: { id: 'broker-1', role: 'BROKER' } });
    mockUserFindMany.mockResolvedValue([{ id: 'r1', name: 'Realtor One', brokerId: 'broker-1', role: 'REALTOR' }]);
    mockTeamFindMany.mockResolvedValue([{ id: 't1', name: 'Team 1', targetListings: 10, targetRevenue: 20000, targetInteractions: 50 }]);
    mockListingFindMany.mockResolvedValue([{ userId: 'r1', price: 100000, updatedAt: new Date(), status: 'APPROVED' }]);
    mockInteractionFindMany.mockResolvedValue([{ userId: 'r1', date: new Date() }]);
    mockAssignmentFindMany.mockResolvedValue([]);
    mockTemplateFindMany.mockResolvedValue([]);
    mockBroadcastFindMany.mockResolvedValue([]);
    mockAuditLogFindMany.mockResolvedValue([]);
  });

  it('GET /api/broker/performance returns 200 for broker', async () => {
    const handler = (await import('../../pages/api/broker/performance')).default;
    const req = createMockRequest({ method: 'GET', query: {} });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.teamPerformance).toBeDefined();
  });

  it('POST /api/broker/workload creates assignment and writes audit', async () => {
    const handler = (await import('../../pages/api/broker/workload')).default;
    mockClientFindFirst.mockResolvedValue({ id: 'c1' });
    mockListingFindFirst.mockResolvedValue({ id: 'l1' });
    mockAssignmentCreate.mockResolvedValue({ id: 'a1', title: 'Call back lead' });
    const req = createMockRequest({
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.31' },
      body: { title: 'Call back lead', realtorId: 'r1', clientId: 'c1', listingId: 'l1' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(201);
    expect(mockAuditLogCreate).toHaveBeenCalled();
  });

  it('GET /api/broker/client-oversight returns aggregated oversight data', async () => {
    const handler = (await import('../../pages/api/broker/client-oversight')).default;
    mockClientFindMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Client 1',
        status: 'LEAD',
        createdAt: new Date(Date.now() - 20 * 86400000),
        updatedAt: new Date(Date.now() - 20 * 86400000),
        user: { id: 'r1', name: 'Realtor One', email: 'r1@test.com', teamId: 't1' },
        interactions: [],
      },
    ]);
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect((res._json as any)?.stalled?.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/broker/comms creates template and writes audit', async () => {
    const handler = (await import('../../pages/api/broker/comms')).default;
    mockTemplateCreate.mockResolvedValue({ id: 'tpl-1', name: 'Weekly update' });
    const req = createMockRequest({
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.32' },
      body: { mode: 'template', name: 'Weekly update', body: 'Template body' },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(201);
    expect(mockAuditLogCreate).toHaveBeenCalled();
  });

  it('PUT /api/broker/admin-controls updates team targets', async () => {
    const handler = (await import('../../pages/api/broker/admin-controls')).default;
    mockTeamFindFirst.mockResolvedValue({ id: 't1' });
    mockTeamUpdate.mockResolvedValue({ id: 't1', targetListings: 20, targetRevenue: 50000, targetInteractions: 100 });
    const req = createMockRequest({
      method: 'PUT',
      headers: { 'x-forwarded-for': '203.0.113.33' },
      body: { action: 'update-team-targets', teamId: 't1', targetListings: 20, targetRevenue: 50000, targetInteractions: 100 },
    });
    const res = createMockResponse();
    await runHandler(handler as any, req, res);
    expect(res._status).toBe(200);
    expect(mockAuditLogCreate).toHaveBeenCalled();
  });
});
