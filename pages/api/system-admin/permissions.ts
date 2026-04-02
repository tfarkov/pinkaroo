import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { applyRateLimit, parseString, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;
const PERMISSIONS_CONFIG_KEY = 'role_permissions';

const DEFAULT_PERMISSIONS = {
  SYSTEM_ADMIN: ['*'],
  OFFICE_ADMIN: ['manage:brokers', 'manage:realtors', 'view:operational_dashboards'],
  BROKER: ['manage:teams', 'manage:assignments', 'approve:listings'],
  REALTOR: ['manage:own_clients', 'manage:own_listings'],
  USER: ['browse:listings'],
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'SYSTEM_ADMIN') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }

  try {
    if (req.method === 'GET') {
      const row = await prisma.config.findUnique({ where: { key: PERMISSIONS_CONFIG_KEY } });
      if (!row?.value) {
        res.json({ key: PERMISSIONS_CONFIG_KEY, permissions: DEFAULT_PERMISSIONS });
        return;
      }
      try {
        res.json({ key: PERMISSIONS_CONFIG_KEY, permissions: JSON.parse(row.value) });
      } catch {
        res.json({ key: PERMISSIONS_CONFIG_KEY, permissions: DEFAULT_PERMISSIONS });
      }
      return;
    }

    if (!applyRateLimit(req, res, 'system-admin-permissions-write', { max: 15, windowMs: 60_000 })) return;
    const parsedReason = parseString(req.body?.reason, { maxLength: 300, allowEmpty: true }) ?? 'Permission matrix update';
    const permissions = req.body?.permissions;
    if (!permissions || typeof permissions !== 'object' || Array.isArray(permissions)) {
      sendError(res, 400, 'permissions object is required');
      return;
    }
    const updated = await prisma.config.upsert({
      where: { key: PERMISSIONS_CONFIG_KEY },
      update: { value: JSON.stringify(permissions) },
      create: { key: PERMISSIONS_CONFIG_KEY, value: JSON.stringify(permissions) },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'SYSTEM_PERMISSIONS_UPDATED',
        entityType: 'Config',
        entityId: updated.id,
        details: { reason: parsedReason },
      },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[api/system-admin/permissions]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
