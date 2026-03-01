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
    const realtors = await prisma.user.findMany({
      where: { brokerId: session.user.id },
      select: { id: true, name: true, email: true, listingsCount: true, teamId: true, isTeamLead: true },
    });
    const ids = realtors.map((m) => m.id);
    const teams = await prisma.team.findMany({
      where: { brokerId: session.user.id },
      select: {
        id: true,
        name: true,
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });
    const teamCount = teams.length;

    const [listingCountByStatus, totalListings, interactionCounts] =
      ids.length > 0
        ? await Promise.all([
            prisma.listing.groupBy({
              by: ['status'],
              where: { userId: { in: ids } },
              _count: { id: true },
            }),
            prisma.listing.count({ where: { userId: { in: ids } } }),
            prisma.interaction.groupBy({
              by: ['userId'],
              where: { userId: { in: ids } },
              _count: { id: true },
            }),
          ])
        : [[], 0, []];

    let pending = 0,
      approved = 0,
      rejected = 0;
    for (const g of listingCountByStatus as { status: string; _count: { id: number } }[]) {
      if (g.status === 'PENDING') pending = g._count.id;
      else if (g.status === 'APPROVED') approved = g._count.id;
      else if (g.status === 'REJECTED') rejected = g._count.id;
    }

    const interactionMap = new Map<string, number>();
    for (const row of interactionCounts as { userId: string; _count: { id: number } }[]) {
      interactionMap.set(row.userId, row._count.id);
    }

    const enrichedRealtors = realtors.map((r) => ({
      ...r,
      interactionsCount: interactionMap.get(r.id) ?? 0,
    }));
    const availableRealtors = enrichedRealtors.filter((r) => !r.teamId);

    const revenue = [100000, 200000];
    const months = ['Jan', 'Feb'];
    res.json({
      teamCount,
      teams,
      listings: totalListings,
      pending,
      approved,
      rejected,
      realtors: enrichedRealtors,
      availableRealtors,
      revenue,
      months,
    });
  } catch (err) {
    console.error('[api/broker/stats]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
