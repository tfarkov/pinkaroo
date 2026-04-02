import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { canManageBrokersAndRealtors, parseFiniteInt, requireAuth, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 50;

/**
 * Admin Broker Assignment: List users for assigning realtors to brokers. Server-side
 * pagination (skip/take) for large user lists; supports optimistic updates on assignment.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!requireAuth(res, session)) return;
  if (!canManageBrokersAndRealtors(session.user.role)) {
    sendError(res, 403, 'Forbidden');
    return;
  }
  try {
    const page = parseFiniteInt(req.query.page, { min: 0 }) ?? 0;
    const limit = parseFiniteInt(req.query.limit, { min: 1, max: 100 }) ?? DEFAULT_PAGE_SIZE;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: {},
        select: { id: true, name: true, email: true, role: true, brokerId: true },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
        skip: page * limit,
        take: limit,
      }),
      prisma.user.count(),
    ]);
    const nextPage = (page + 1) * limit < total ? page + 1 : null;
    res.json({ users, nextPage, total });
  } catch (err) {
    console.error('[api/admin/users]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
