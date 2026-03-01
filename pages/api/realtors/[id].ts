import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * GET /api/realtors/[id]
 * Public: returns a single realtor/broker by id with their ACTIVE/APPROVED listings.
 * Used by the public realtor profile page (/realtors/[id]).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!id) {
    sendError(res, 400, 'Realtor id is required');
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        broker: { select: { id: true, name: true } },
        listings: {
          where: { status: { in: ['ACTIVE', 'APPROVED'] } },
          select: {
            id: true,
            title: true,
            price: true,
            location: true,
            images: true,
            bedroomsTotal: true,
            bathroomsTotal: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Realtor not found' });
      return;
    }

    // Only expose realtors and brokers publicly (not arbitrary users)
    if (user.role !== 'REALTOR' && user.role !== 'BROKER') {
      res.status(404).json({ error: 'Realtor not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error('[api/realtors/[id]]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
