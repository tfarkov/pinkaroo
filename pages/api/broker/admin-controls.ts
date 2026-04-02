import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { applyRateLimit, isSafeId, parseBoolean, parseFiniteInt, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  const brokerId = session.user.id;

  try {
    if (req.method === 'GET') {
      const [auditLogs, teams, realtors] = await Promise.all([
        prisma.auditLog.findMany({
          where: { brokerId },
          include: { actor: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
        prisma.team.findMany({
          where: { brokerId },
          select: { id: true, name: true, targetListings: true, targetRevenue: true, targetInteractions: true },
          orderBy: { name: 'asc' },
        }),
        prisma.user.findMany({
          where: { brokerId, role: 'REALTOR' },
          select: { id: true, name: true, email: true, teamId: true, isTeamLead: true },
          orderBy: [{ teamId: 'asc' }, { name: 'asc' }],
        }),
      ]);
      res.json({ auditLogs, teams, realtors });
      return;
    }

    if (!applyRateLimit(req, res, 'broker-admin-controls-write', { max: 30, windowMs: 60_000 })) return;
    const { action } = req.body ?? {};

    if (action === 'update-team-targets') {
      const { teamId, targetListings, targetRevenue, targetInteractions } = req.body ?? {};
      if (!isSafeId(teamId)) {
        sendError(res, 400, 'Invalid teamId');
        return;
      }
      const existing = await prisma.team.findFirst({ where: { id: teamId, brokerId }, select: { id: true } });
      if (!existing) {
        sendError(res, 404, 'Team not found');
        return;
      }
      const updated = await prisma.team.update({
        where: { id: teamId },
        data: {
          targetListings: parseFiniteInt(targetListings, { min: 0, max: 100000 }) ?? 0,
          targetInteractions: parseFiniteInt(targetInteractions, { min: 0, max: 100000 }) ?? 0,
          targetRevenue: Number.isFinite(Number(targetRevenue)) ? Number(targetRevenue) : 0,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId,
          action: 'TEAM_TARGETS_UPDATED',
          entityType: 'Team',
          entityId: teamId,
          details: {
            targetListings: updated.targetListings,
            targetInteractions: updated.targetInteractions,
            targetRevenue: updated.targetRevenue,
          },
        },
      });
      res.json(updated);
      return;
    }

    if (action === 'set-team-lead') {
      const { realtorId, isTeamLead } = req.body ?? {};
      if (!isSafeId(realtorId)) {
        sendError(res, 400, 'Invalid realtorId');
        return;
      }
      const parsedLead = parseBoolean(isTeamLead);
      if (parsedLead == null) {
        sendError(res, 400, 'isTeamLead must be boolean');
        return;
      }
      const realtor = await prisma.user.findFirst({
        where: { id: realtorId, brokerId, role: 'REALTOR' },
        select: { id: true },
      });
      if (!realtor) {
        sendError(res, 404, 'Realtor not found');
        return;
      }
      const updated = await prisma.user.update({
        where: { id: realtorId },
        data: { isTeamLead: parsedLead },
        select: { id: true, name: true, email: true, isTeamLead: true, teamId: true },
      });
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId,
          action: 'TEAM_LEAD_UPDATED',
          entityType: 'User',
          entityId: realtorId,
          details: { isTeamLead: parsedLead },
        },
      });
      res.json(updated);
      return;
    }

    sendError(res, 400, 'Unsupported action');
  } catch (err) {
    console.error('[api/broker/admin-controls]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
