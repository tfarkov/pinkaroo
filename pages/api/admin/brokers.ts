import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { canManageBrokersAndRealtors, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!session || !canManageBrokersAndRealtors(session.user.role)) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const brokers = await prisma.user.findMany({
      where: { role: 'BROKER' },
      include: { teamMembers: true, teams: { orderBy: { name: 'asc' } } },
    });
    res.json(brokers);
  } catch (err) {
    console.error('[api/admin/brokers]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
