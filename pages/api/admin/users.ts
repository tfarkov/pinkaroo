import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 50;

/**
 * Admin Broker Assignment: List users for assigning realtors to brokers. Server-side
 * pagination (skip/take) for large user lists; supports optimistic updates on assignment.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'ADMIN') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const page = Math.max(0, parseInt(String(req.query.page), 10) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_PAGE_SIZE));
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
