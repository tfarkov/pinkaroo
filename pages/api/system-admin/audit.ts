import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { parseFiniteInt, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'SYSTEM_ADMIN') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const limit = parseFiniteInt(req.query.limit, { min: 1, max: 500 }) ?? 200;
    const logs = await prisma.auditLog.findMany({
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } },
        broker: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json({ logs });
  } catch (err) {
    console.error('[api/system-admin/audit]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
