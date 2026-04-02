import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { applyRateLimit, isSafeId, parseString, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

const CLIENT_STATUSES = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  const brokerId = session.user.id;
  try {
    if (req.method === 'GET') {
      const clients = await prisma.client.findMany({
        where: {
          OR: [
            { brokerId },
            { user: { brokerId } },
          ],
        },
        include: {
          user: { select: { id: true, name: true, email: true, teamId: true } },
          interactions: { select: { id: true, date: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 500,
      });

      const statusCounts = Object.fromEntries(CLIENT_STATUSES.map((status) => [status, 0])) as Record<string, number>;
      const now = Date.now();
      const stalled: typeof clients = [];
      const aging: { id: string; name: string; daysOpen: number; status: string; realtorName: string }[] = [];
      for (const client of clients) {
        statusCounts[client.status] = (statusCounts[client.status] ?? 0) + 1;
        const lastActivity = client.interactions.length
          ? Math.max(...client.interactions.map((i) => new Date(i.date).getTime()))
          : new Date(client.updatedAt).getTime();
        const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
        if (daysSinceActivity >= 14 && client.status !== 'CLOSED') stalled.push(client);
        const daysOpen = Math.floor((now - new Date(client.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        aging.push({
          id: client.id,
          name: client.name,
          status: client.status,
          daysOpen,
          realtorName: client.user?.name ?? client.user?.email ?? 'Unknown',
        });
      }

      res.json({
        total: clients.length,
        statusCounts,
        stalled: stalled.slice(0, 50).map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          updatedAt: c.updatedAt,
          owner: c.user ? { id: c.user.id, name: c.user.name, email: c.user.email } : null,
        })),
        aging: aging.sort((a, b) => b.daysOpen - a.daysOpen).slice(0, 100),
        clients: clients.slice(0, 100).map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          status: c.status,
          brokerId: c.brokerId,
          teamId: c.teamId,
          owner: c.user ? { id: c.user.id, name: c.user.name, email: c.user.email, teamId: c.user.teamId } : null,
          interactionsCount: c.interactions.length,
          updatedAt: c.updatedAt,
        })),
      });
      return;
    }

    if (!applyRateLimit(req, res, 'broker-client-assign', { max: 50, windowMs: 60_000 })) return;
    const { clientId, realtorId, notes } = req.body ?? {};
    if (!isSafeId(clientId) || !isSafeId(realtorId)) {
      sendError(res, 400, 'clientId and realtorId are required');
      return;
    }
    const realtor = await prisma.user.findFirst({
      where: { id: realtorId, role: 'REALTOR', brokerId },
      select: { id: true, teamId: true },
    });
    if (!realtor) {
      sendError(res, 404, 'Realtor not found in your brokerage');
      return;
    }
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, OR: [{ brokerId }, { user: { brokerId } }] },
      select: { id: true },
    });
    if (!existingClient) {
      sendError(res, 404, 'Client not found');
      return;
    }
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        userId: realtorId,
        brokerId,
        teamId: realtor.teamId ?? null,
        notes: parseString(notes, { maxLength: 4000, allowEmpty: true }) ?? undefined,
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        brokerId,
        action: 'CLIENT_REASSIGNED',
        entityType: 'Client',
        entityId: clientId,
        details: { realtorId },
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[api/broker/client-oversight]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
