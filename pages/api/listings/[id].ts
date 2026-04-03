import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { requireMethod, sendError } from '../../../lib/apiHelpers';
import { getSession } from '../../../lib/session';
import { listingToPublicJson } from '../../../lib/listings/listingResponse';

const prisma = new PrismaClient();

/**
 * GET /api/listings/[id]
 * Public: ACTIVE/APPROVED with MLS id only. Authenticated owner (or broker/admin for non-draft) may load other rows for CRM / preview.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const id = typeof req.query.id === 'string' ? req.query.id.trim() : undefined;
  if (!id) {
    sendError(res, 400, 'Listing id is required');
    return;
  }
  /** "new" is a reserved path for the add-listing page, not a listing id. */
  if (id === 'new') {
    sendError(res, 400, 'Invalid listing id');
    return;
  }
  try {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const hasMls = listing.mlsId != null && String(listing.mlsId).trim() !== '';
    const isPublic =
      hasMls && (listing.status === 'ACTIVE' || listing.status === 'APPROVED');
    if (isPublic) {
      res.json(listingToPublicJson(listing));
      return;
    }

    const session = await getSession(req, res);
    if (!session?.user) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const uid = session.user.id;
    const role = session.user.role;

    if (listing.userId === uid) {
      res.json(listingToPublicJson(listing));
      return;
    }

    if (role === 'SYSTEM_ADMIN' || role === 'OFFICE_ADMIN') {
      res.json(listingToPublicJson(listing));
      return;
    }

    if (role === 'BROKER' && listing.status !== 'DRAFT') {
      const owner = await prisma.user.findUnique({
        where: { id: listing.userId },
        select: { brokerId: true },
      });
      if (owner?.brokerId === uid) {
        res.json(listingToPublicJson(listing));
        return;
      }
    }

    res.status(404).json({ error: 'Listing not found' });
  } catch (err) {
    console.error('[api/listings/[id]]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
