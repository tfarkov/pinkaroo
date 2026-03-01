import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * CRM dashboard stats: status distribution and interactions over time.
 * Uses Prisma groupBy/count for scalability. Memoize chart data in the client with useMemo.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  const role = session?.user?.role as string | undefined;
  if (!session || (role !== 'REALTOR' && role !== 'BROKER')) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const userId = session.user.id;
    const [statusGroups, interactionsRaw] = await Promise.all([
      prisma.client.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      }),
      prisma.interaction.findMany({
        where: { userId },
        select: { date: true },
        orderBy: { date: 'asc' },
      }),
    ]);
    const statusDistribution: Record<string, number> = {};
    for (const g of statusGroups) {
      statusDistribution[g.status] = g._count.id;
    }
    const monthCount: Record<string, number> = {};
    for (const i of interactionsRaw) {
      const key = `${i.date.getFullYear()}-${String(i.date.getMonth() + 1).padStart(2, '0')}`;
      monthCount[key] = (monthCount[key] ?? 0) + 1;
    }
    const interactionsByMonth = Object.entries(monthCount)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
    res.json({ statusDistribution, interactionsByMonth });
  } catch (err) {
    console.error('[api/clients/stats]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
