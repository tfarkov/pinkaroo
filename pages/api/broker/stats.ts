import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * Broker Team Management: Dashboard with team count, listings, pending approvals, revenue.
 * Optimized with aggregated Prisma queries (groupBy/count) to reduce joins. Team member
 * details lazy-loaded on team page. Charts: bar listings per realtor, pie approval statuses, line revenue.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const teamMemberIds = await prisma.user.findMany({
      where: { brokerId: session.user.id },
      select: { id: true, name: true, email: true, listingsCount: true },
    });
    const ids = teamMemberIds.map((m) => m.id);
    const teamCount = ids.length;

    const [listingCountByStatus, totalListings] =
      ids.length > 0
        ? await Promise.all([
            prisma.listing.groupBy({
              by: ['status'],
              where: { userId: { in: ids } },
              _count: { id: true },
            }),
            prisma.listing.count({ where: { userId: { in: ids } } }),
          ])
        : [[], 0];

    let pending = 0,
      approved = 0,
      rejected = 0;
    for (const g of listingCountByStatus as { status: string; _count: { id: number } }[]) {
      if (g.status === 'PENDING') pending = g._count.id;
      else if (g.status === 'APPROVED') approved = g._count.id;
      else if (g.status === 'REJECTED') rejected = g._count.id;
    }

    const revenue = [100000, 200000];
    const months = ['Jan', 'Feb'];
    res.json({
      teamCount,
      listings: totalListings,
      pending,
      approved,
      rejected,
      realtors: teamMemberIds,
      revenue,
      months,
    });
  } catch (err) {
    console.error('[api/broker/stats]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
