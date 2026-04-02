import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireMethod, requireRole, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getRecentMonths(count: number): { key: string; label: string }[] {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleString('en-CA', { month: 'short' }),
    });
  }
  return months;
}

/**
 * Broker Team Management: Dashboard with team count, listings, pending approvals, revenue.
 * Optimized with aggregated Prisma queries (groupBy/count) to reduce joins. Team member
 * details lazy-loaded on team page. Charts: bar listings per realtor, pie approval statuses, line revenue.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!requireAuth(res, session)) return;
  if (!requireRole(res, session.user.role, ['BROKER'])) return;
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
        targetListings: true,
        targetRevenue: true,
        targetInteractions: true,
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });
    const teamCount = teams.length;

    const [listingCountByStatus, totalListings, interactionCounts, approvedListings] =
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
            prisma.listing.findMany({
              where: { userId: { in: ids }, status: 'APPROVED' },
              select: { userId: true, price: true, approvedAt: true, updatedAt: true },
            }),
          ])
        : [[], 0, [], []];

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

    const months = getRecentMonths(6);
    const revenueByMonth = new Map<string, number>(months.map((m) => [m.key, 0]));
    const revenueByRealtor = new Map<string, number>();
    for (const row of approvedListings as { userId: string; price: number; approvedAt?: Date | null; updatedAt: Date }[]) {
      const basis = row.approvedAt ?? row.updatedAt;
      const mKey = monthKey(new Date(basis));
      if (revenueByMonth.has(mKey)) {
        revenueByMonth.set(mKey, (revenueByMonth.get(mKey) ?? 0) + (row.price ?? 0));
      }
      revenueByRealtor.set(row.userId, (revenueByRealtor.get(row.userId) ?? 0) + (row.price ?? 0));
    }
    const teamRevenueMap = new Map<string, number>();
    const teamListingMap = new Map<string, number>();
    const teamInteractionMap = new Map<string, number>();
    for (const realtor of enrichedRealtors as { id: string; teamId?: string | null; listingsCount?: number | null; interactionsCount?: number | null }[]) {
      if (!realtor.teamId) continue;
      teamRevenueMap.set(realtor.teamId, (teamRevenueMap.get(realtor.teamId) ?? 0) + (revenueByRealtor.get(realtor.id) ?? 0));
      teamListingMap.set(realtor.teamId, (teamListingMap.get(realtor.teamId) ?? 0) + (realtor.listingsCount ?? 0));
      teamInteractionMap.set(realtor.teamId, (teamInteractionMap.get(realtor.teamId) ?? 0) + (realtor.interactionsCount ?? 0));
    }
    const teamPerformance = teams.map((team) => ({
      id: team.id,
      name: team.name,
      members: team._count.members,
      targets: {
        listings: team.targetListings ?? 0,
        revenue: team.targetRevenue ?? 0,
        interactions: team.targetInteractions ?? 0,
      },
      actual: {
        listings: teamListingMap.get(team.id) ?? 0,
        revenue: teamRevenueMap.get(team.id) ?? 0,
        interactions: teamInteractionMap.get(team.id) ?? 0,
      },
    }));
    res.json({
      teamCount,
      teams,
      listings: totalListings,
      pending,
      approved,
      rejected,
      realtors: enrichedRealtors,
      availableRealtors,
      revenue: months.map((m) => revenueByMonth.get(m.key) ?? 0),
      months: months.map((m) => m.label),
      teamPerformance,
    });
  } catch (err) {
    console.error('[api/broker/stats]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
