import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const approved = await prisma.listing.findMany({
      where: { status: 'APPROVED', user: { brokerId: session.user.id } },
      include: { user: true },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
    res.json(approved);
  } catch (err) {
    console.error('[api/broker/approved-listings]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
