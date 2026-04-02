import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { canManageBrokersAndRealtors, requireAuth, requireMethod, sendError } from '../../../lib/apiHelpers';

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
  if (!canManageBrokersAndRealtors(session.user.role)) {
    sendError(res, 403, 'Forbidden');
    return;
  }

  try {
    const weeks = getRecentWeeks(8);
    const earliest = weeks[0].start;

    const [brokers, realtors] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'BROKER', createdAt: { gte: earliest } },
        select: { createdAt: true },
      }),
      prisma.user.findMany({
        where: { role: 'REALTOR', createdAt: { gte: earliest } },
        select: { createdAt: true, updatedAt: true, brokerId: true },
      }),
    ]);

    const newBrokers = weeks.map((w) =>
      brokers.filter((b: { createdAt: Date }) => new Date(b.createdAt) >= w.start && new Date(b.createdAt) < w.end).length
    );
    const newRealtors = weeks.map((w) =>
      realtors.filter((r: { createdAt: Date }) => new Date(r.createdAt) >= w.start && new Date(r.createdAt) < w.end).length
    );
    const assignmentUpdates = weeks.map((w) =>
      realtors.filter(
        (r: { updatedAt: Date; brokerId?: string | null }) =>
          !!r.brokerId && new Date(r.updatedAt) >= w.start && new Date(r.updatedAt) < w.end
      ).length
    );

    res.json({
      labels: weeks.map((w) => w.label),
      newBrokers,
      newRealtors,
      assignmentUpdates,
    });
  } catch (err) {
    console.error('[api/admin/weekly-kpis]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
