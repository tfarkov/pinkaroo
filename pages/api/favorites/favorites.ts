import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * Reads listingId from request body. Handles both parsed JSON and raw string body
 * so that POST/DELETE work even when Next.js body parsing differs.
 */
function getBodyListingId(req: NextApiRequest): string {
  let body = req.body;
  if (body && typeof body.listingId === 'string') return body.listingId.trim();
  if (typeof (body as unknown) === 'string') {
    try {
      body = JSON.parse(body as string) as { listingId?: string };
      if (body && typeof body.listingId === 'string') return body.listingId.trim();
    } catch {
      // ignore parse errors
    }
  }
  return '';
}

/**
 * Favorites API: GET (list), POST (add), DELETE (remove).
 * All methods require an authenticated session.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST', 'DELETE'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    if (req.method === 'GET') {
      const favorites = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        include: { listing: true },
      });
      res.json(favorites);
      return;
    }
    if (req.method === 'POST') {
      const listingId = getBodyListingId(req);
      if (!listingId) {
        sendError(res, 400, 'listingId is required');
        return;
      }
      const existing = await prisma.favorite.findUnique({
        where: { userId_listingId: { userId: session.user.id, listingId } },
      });
      if (existing) {
        sendError(res, 400, API_MESSAGES.ALREADY_FAVORITED);
        return;
      }
      const favorite = await prisma.favorite.create({
        data: { userId: session.user.id, listingId },
      });
      res.json(favorite);
      return;
    }
    if (req.method === 'DELETE') {
      const listingId = getBodyListingId(req);
      if (!listingId) {
        sendError(res, 400, 'listingId is required');
        return;
      }
      await prisma.favorite
        .delete({ where: { userId_listingId: { userId: session.user.id, listingId } } })
        .catch(() => null);
      res.status(204).end();
    }
  } catch (err) {
    console.error('[api/favorites]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
