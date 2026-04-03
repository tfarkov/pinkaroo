import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Prisma } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';
import { buildPublicListingWhere } from '../../../lib/listings/buildPublicListingWhere';

const prisma = new PrismaClient();

const MAX_NAME_LEN = 120;

function asFilterRecord(filters: unknown): Record<string, unknown> {
  return filters != null && typeof filters === 'object' && !Array.isArray(filters) ? (filters as Record<string, unknown>) : {};
}

/**
 * GET /api/saved-searches — list current user's saved searches with match counts;
 * optionally creates in-app notifications when notifyNewMatch is on and there are new updates since lastNotifiedAt.
 * POST /api/saved-searches — body { name, filters, notifyNewMatch? }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  const userId = session.user.id;

  try {
    if (req.method === 'GET') {
      const rows = await prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      const digest = await Promise.all(
        rows.map(async (row) => {
          const filters = asFilterRecord(row.filters);
          const newSinceSeenWhere = buildPublicListingWhere(filters, { updatedAfter: row.lastSeenAt });
          const newSinceSeenCount = await prisma.listing.count({ where: newSinceSeenWhere });

          const notifyBaseline = row.lastNotifiedAt ?? row.createdAt;
          const sinceNotifyWhere = buildPublicListingWhere(filters, { updatedAfter: notifyBaseline });
          const newSinceNotifyCount = await prisma.listing.count({ where: sinceNotifyWhere });

          if (row.notifyNewMatch && newSinceNotifyCount > 0) {
            await prisma.notification.create({
              data: {
                userId,
                type: 'SYSTEM',
                message: `${newSinceNotifyCount} new or updated listing${newSinceNotifyCount === 1 ? '' : 's'} match your saved search "${row.name}".`,
              },
            });
            await prisma.savedSearch.update({
              where: { id: row.id },
              data: { lastNotifiedAt: new Date() },
            });
          }

          return {
            id: row.id,
            name: row.name,
            filters: row.filters,
            notifyNewMatch: row.notifyNewMatch,
            lastSeenAt: row.lastSeenAt.toISOString(),
            newSinceSeenCount,
          };
        })
      );

      res.json(digest);
      return;
    }

    if (req.method === 'POST') {
      const body = (typeof req.body === 'object' && req.body) || {};
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      const filters = body.filters;
      const notifyNewMatch = Boolean(body.notifyNewMatch);

      if (!name || name.length > MAX_NAME_LEN) {
        sendError(res, 400, `name is required (max ${MAX_NAME_LEN} characters)`);
        return;
      }
      const filterObj = asFilterRecord(filters);
      if (Object.keys(filterObj).length === 0) {
        sendError(res, 400, 'filters must be a non-empty object');
        return;
      }

      const created = await prisma.savedSearch.create({
        data: {
          userId,
          name,
          filters: filterObj as Prisma.InputJsonValue,
          notifyNewMatch,
          lastSeenAt: new Date(),
        },
      });

      res.status(201).json({
        id: created.id,
        name: created.name,
        filters: created.filters,
        notifyNewMatch: created.notifyNewMatch,
        lastSeenAt: created.lastSeenAt.toISOString(),
        newSinceSeenCount: 0,
      });
    }
  } catch (err) {
    console.error('[api/saved-searches]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
