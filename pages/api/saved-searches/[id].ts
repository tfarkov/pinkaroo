import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

const MAX_NAME_LEN = 120;

/**
 * PATCH /api/saved-searches/[id] — { name?, notifyNewMatch?, markSeen?: boolean }
 * DELETE /api/saved-searches/[id]
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['PATCH', 'DELETE'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!id) {
    sendError(res, 400, 'id is required');
    return;
  }

  try {
    const existing = await prisma.savedSearch.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      sendError(res, 404, 'Saved search not found');
      return;
    }

    if (req.method === 'DELETE') {
      await prisma.savedSearch.delete({ where: { id } });
      res.status(204).end();
      return;
    }

    const body = (typeof req.body === 'object' && req.body) || {};
    const data: { name?: string; notifyNewMatch?: boolean; lastSeenAt?: Date } = {};

    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name || name.length > MAX_NAME_LEN) {
        sendError(res, 400, `name must be non-empty (max ${MAX_NAME_LEN} characters)`);
        return;
      }
      data.name = name;
    }
    if (typeof body.notifyNewMatch === 'boolean') {
      data.notifyNewMatch = body.notifyNewMatch;
    }
    if (body.markSeen === true) {
      data.lastSeenAt = new Date();
    }

    if (Object.keys(data).length === 0) {
      sendError(res, 400, 'No valid fields to update');
      return;
    }

    const updated = await prisma.savedSearch.update({
      where: { id },
      data,
    });

    res.json({
      id: updated.id,
      name: updated.name,
      filters: updated.filters,
      notifyNewMatch: updated.notifyNewMatch,
      lastSeenAt: updated.lastSeenAt.toISOString(),
    });
  } catch (err) {
    console.error('[api/saved-searches/[id]]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
