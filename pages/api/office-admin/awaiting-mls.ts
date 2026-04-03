import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, requireRole, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * GET /api/office-admin/awaiting-mls
 * Listings broker-approved but not yet on MLS (no mlsId) — office files these outside the app;
 * live listings appear after MLS sync creates/updates rows with ListingKey.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  if (!requireRole(res, session.user.role, ['OFFICE_ADMIN', 'SYSTEM_ADMIN'])) return;

  try {
    const rows = await prisma.listing.findMany({
      where: {
        status: 'APPROVED',
        mlsId: null,
      },
      orderBy: { approvedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      take: 100,
    });
    res.json(rows);
  } catch (err) {
    console.error('[api/office-admin/awaiting-mls]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
