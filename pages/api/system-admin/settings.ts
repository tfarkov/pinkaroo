import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { applyRateLimit, parseString, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'SYSTEM_ADMIN') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    if (req.method === 'GET') {
      const configs = await prisma.config.findMany({
        orderBy: { key: 'asc' },
        take: 200,
      });
      res.json({
        settings: configs,
      });
      return;
    }

    if (!applyRateLimit(req, res, 'system-admin-settings-write', { max: 20, windowMs: 60_000 })) return;
    const { key, value } = req.body ?? {};
    const parsedKey = parseString(key, { maxLength: 120 });
    if (!parsedKey) {
      sendError(res, 400, 'key is required');
      return;
    }
    const updated = await prisma.config.upsert({
      where: { key: parsedKey },
      update: { value: value == null ? null : String(value) },
      create: { key: parsedKey, value: value == null ? null : String(value) },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'SYSTEM_SETTING_UPDATED',
        entityType: 'Config',
        entityId: updated.id,
        details: { key: parsedKey },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[api/system-admin/settings]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
