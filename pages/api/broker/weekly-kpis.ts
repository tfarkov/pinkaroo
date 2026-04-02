import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { requireAuth, requireMethod, requireRole, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getRecentWeeks(count: number): { label: string; start: Date; end: Date }[] {
  const now = new Date();
  const currentWeekStart = startOfWeek(now);
  const weeks: { label: string; start: Date; end: Date }[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    weeks.push({
      label: `Wk ${start.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`,
      start,
      end,
    });
  }
  return weeks;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!requireAuth(res, session)) return;
  if (!requireRole(res, session.user.role, ['BROKER'])) return;

  try {
    const realtors = await prisma.user.findMany({
      where: { brokerId: session.user.id, role: 'REALTOR' },
      select: { id: true },
    });
    const realtorIds = realtors.map((r: { id: string }) => r.id);
    const weeks = getRecentWeeks(8);

    if (realtorIds.length === 0) {
      res.json({
        labels: weeks.map((w) => w.label),
        newListings: weeks.map(() => 0),
        interactions: weeks.map(() => 0),
        approvalsResolved: weeks.map(() => 0),
      });
      return;
    }

    const earliest = weeks[0].start;
    const [listings, interactions] = await Promise.all([
      prisma.listing.findMany({
        where: { userId: { in: realtorIds }, updatedAt: { gte: earliest } },
        select: { createdAt: true, updatedAt: true, status: true },
      }),
      prisma.interaction.findMany({
        where: { userId: { in: realtorIds }, date: { gte: earliest } },
        select: { date: true },
      }),
    ]);

    const newListings = weeks.map((w) =>
      listings.filter((l: { createdAt: Date }) => new Date(l.createdAt) >= w.start && new Date(l.createdAt) < w.end).length
    );
    const approvalsResolved = weeks.map((w) =>
      listings.filter(
        (l: { updatedAt: Date; status?: string }) =>
          new Date(l.updatedAt) >= w.start &&
          new Date(l.updatedAt) < w.end &&
          (l.status === 'APPROVED' || l.status === 'REJECTED')
      ).length
    );
    const interactionsByWeek = weeks.map((w) =>
      interactions.filter((i: { date: Date }) => new Date(i.date) >= w.start && new Date(i.date) < w.end).length
    );

    res.json({
      labels: weeks.map((w) => w.label),
      newListings,
      interactions: interactionsByWeek,
      approvalsResolved,
    });
  } catch (err) {
    console.error('[api/broker/weekly-kpis]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
