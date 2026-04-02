import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../lib/constants';
import { SAFE_TEAM_MEMBER_SELECT, applyRateLimit, requireMethod, requireIdParam, sendError } from '../../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'PUT', 'DELETE'])) return;
  const id = requireIdParam(req, res);
  if (id === null) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const team = await prisma.team.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        brokerId: true,
        createdAt: true,
        updatedAt: true,
        members: { select: SAFE_TEAM_MEMBER_SELECT },
      },
    });
    if (!team || team.brokerId !== session.user.id) {
      sendError(res, 404, 'Team not found');
      return;
    }

    if (req.method === 'GET') {
      res.json(team);
      return;
    }

    if (req.method === 'PUT') {
      if (!applyRateLimit(req, res, 'broker-team-update', { max: 40, windowMs: 60_000 })) return;
      const { name } = req.body ?? {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        sendError(res, 400, 'name is required');
        return;
      }
      const updated = await prisma.team.update({ where: { id }, data: { name: name.trim() } });
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId: session.user.id,
          action: 'TEAM_UPDATED',
          entityType: 'Team',
          entityId: id,
          details: { name: name.trim() },
        },
      });
      res.json(updated);
      return;
    }
    if (req.method === 'DELETE') {
      if (!applyRateLimit(req, res, 'broker-team-delete', { max: 10, windowMs: 60_000 })) return;
      await prisma.team.delete({ where: { id } });
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId: session.user.id,
          action: 'TEAM_DELETED',
          entityType: 'Team',
          entityId: id,
        },
      });
      res.status(204).end();
    }
  } catch (err) {
    console.error('[api/broker/teams/[id]]', err);
    if (!res.headersSent) sendError(res, 500, 'Failed to process request');
  }
}
