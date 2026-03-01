import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../../lib/session';
import { API_MESSAGES } from '../../../../lib/constants';
import { requireMethod, requireIdParam, sendError } from '../../../../lib/apiHelpers';

const prisma = new PrismaClient();

function getMonthBuckets(monthsBack: number): { key: string; label: string }[] {
  const now = new Date();
  const buckets: { key: string; label: string }[] = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-CA', { month: 'short' });
    buckets.push({ key, label });
  }
  return buckets;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const id = requireIdParam(req, res);
  if (id === null) return;

  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }

  try {
    const realtor = await prisma.user.findFirst({
      where: { id, role: 'REALTOR', brokerId: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        teamId: true,
        team: { select: { id: true, name: true } },
        isTeamLead: true,
      },
    });
    if (!realtor) {
      sendError(res, 404, API_MESSAGES.USER_NOT_FOUND);
      return;
    }

    const [statusGroups, totalListings, recentListings, interactionsTotal, listingsForChart, interactionsForChart] = await Promise.all([
      prisma.listing.groupBy({
        by: ['status'],
        where: { userId: realtor.id },
        _count: { id: true },
      }),
      prisma.listing.count({ where: { userId: realtor.id } }),
      prisma.listing.findMany({
        where: { userId: realtor.id },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          status: true,
          price: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
      prisma.interaction.count({ where: { userId: realtor.id } }),
      prisma.listing.findMany({
        where: { userId: realtor.id },
        select: { createdAt: true },
      }),
      prisma.interaction.findMany({
        where: { userId: realtor.id },
        select: { date: true },
      }),
    ]);

    const statusCounts = statusGroups.reduce<Record<string, number>>((acc, group) => {
      acc[group.status] = group._count.id;
      return acc;
    }, {});

    const buckets = getMonthBuckets(6);
    const listingByMonth = new Map<string, number>(buckets.map((b) => [b.key, 0]));
    const interactionsByMonth = new Map<string, number>(buckets.map((b) => [b.key, 0]));

    for (const row of listingsForChart) {
      const key = monthKey(row.createdAt);
      if (listingByMonth.has(key)) listingByMonth.set(key, (listingByMonth.get(key) ?? 0) + 1);
    }
    for (const row of interactionsForChart) {
      const key = monthKey(row.date);
      if (interactionsByMonth.has(key)) interactionsByMonth.set(key, (interactionsByMonth.get(key) ?? 0) + 1);
    }

    res.json({
      realtor,
      summary: {
        totalListings,
        statusCounts,
        interactionsTotal,
      },
      charts: {
        months: buckets.map((b) => b.label),
        listingActivity: buckets.map((b) => listingByMonth.get(b.key) ?? 0),
        interactionActivity: buckets.map((b) => interactionsByMonth.get(b.key) ?? 0),
      },
      recentListings,
    });
  } catch (err) {
    console.error('[api/broker/realtor-dashboard/[id]]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
