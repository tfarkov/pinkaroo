import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../lib/constants';
import { requireMethod, requireIdParam, sendError } from '../../../../lib/apiHelpers';

const prisma = new PrismaClient();

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
    const team = await prisma.team.findUnique({ where: { id }, include: { members: true } });
    if (!team || team.brokerId !== session.user.id) {
      sendError(res, 404, 'Team not found');
      return;
    }

    if (req.method === 'GET') {
      res.json(team);
      return;
    }

    if (req.method === 'PUT') {
      const { name } = req.body ?? {};
      if (!name || typeof name !== 'string' || !name.trim()) {
        sendError(res, 400, 'name is required');
        return;
      }
      const updated = await prisma.team.update({ where: { id }, data: { name: name.trim() } });
      res.json(updated);
      return;
    }
    if (req.method === 'DELETE') {
      await prisma.team.delete({ where: { id } });
      res.status(204).end();
    }
  } catch (err) {
    console.error('[api/broker/teams/[id]]', err);
    if (!res.headersSent) sendError(res, 500, 'Failed to process request');
  }
}
