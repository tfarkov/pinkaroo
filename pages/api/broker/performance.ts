import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { parseFiniteInt, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const windowMonths = parseFiniteInt(req.query.windowMonths, { min: 1, max: 24 }) ?? 6;
    const realtors = await prisma.user.findMany({
      where: { brokerId: session.user.id, role: 'REALTOR' },
      select: {
        id: true,
        name: true,
        teamId: true,
        listingsCount: true,
      },
    });
    const realtorIds = realtors.map((r) => r.id);
    const since = new Date();
    since.setMonth(since.getMonth() - windowMonths);

    const [teams, approvedListings, interactions] = realtorIds.length
      ? await Promise.all([
          prisma.team.findMany({
            where: { brokerId: session.user.id },
            select: { id: true, name: true, targetListings: true, targetRevenue: true, targetInteractions: true },
          }),
          prisma.listing.findMany({
            where: { userId: { in: realtorIds }, status: 'APPROVED', updatedAt: { gte: since } },
            select: { userId: true, price: true },
          }),
          prisma.interaction.findMany({
            where: { userId: { in: realtorIds }, date: { gte: since } },
            select: { userId: true },
          }),
        ])
      : [[], [], []];

    const revenueByRealtor = new Map<string, number>();
    for (const row of approvedListings as { userId: string; price: number }[]) {
      revenueByRealtor.set(row.userId, (revenueByRealtor.get(row.userId) ?? 0) + (row.price ?? 0));
    }
    const interactionByRealtor = new Map<string, number>();
    for (const row of interactions as { userId: string }[]) {
      interactionByRealtor.set(row.userId, (interactionByRealtor.get(row.userId) ?? 0) + 1);
    }

    const realtorPerformance = realtors.map((r) => ({
      id: r.id,
      name: r.name ?? 'Unnamed realtor',
      teamId: r.teamId,
      listings: r.listingsCount ?? 0,
      revenue: revenueByRealtor.get(r.id) ?? 0,
      interactions: interactionByRealtor.get(r.id) ?? 0,
    }));
    const teamPerformance = teams.map((team) => {
      const members = realtorPerformance.filter((r) => r.teamId === team.id);
      return {
        id: team.id,
        name: team.name,
        targets: {
          listings: team.targetListings ?? 0,
          revenue: team.targetRevenue ?? 0,
          interactions: team.targetInteractions ?? 0,
        },
        actual: {
          listings: members.reduce((sum, m) => sum + m.listings, 0),
          revenue: members.reduce((sum, m) => sum + m.revenue, 0),
          interactions: members.reduce((sum, m) => sum + m.interactions, 0),
        },
      };
    });

    res.json({
      windowMonths,
      teamPerformance,
      realtorPerformance,
    });
  } catch (err) {
    console.error('[api/broker/performance]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
