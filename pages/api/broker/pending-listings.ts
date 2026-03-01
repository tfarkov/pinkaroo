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
  const pending = await prisma.listing.findMany({
    where: { status: 'PENDING', user: { brokerId: session.user.id } },
    include: { user: true },
  });
  res.json(pending);
  } catch (err) {
    console.error('[api/broker/pending-listings]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
