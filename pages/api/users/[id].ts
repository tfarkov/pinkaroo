import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, requireIdParam, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return;
  const id = requireIdParam(req, res);
  if (id === null) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({ where: { id }, include: { listings: true, teamMembers: true, broker: true } });
    if (!user) {
      sendError(res, 404, API_MESSAGES.USER_NOT_FOUND);
      return;
    }
    res.json(user);
    return;
  }
  if (req.method === 'PUT') {
    const targetId = id;
    const isSelf = session.user.id === targetId;

    if (isSelf) {
      const allowedSelf = ['name', 'bio', 'image', 'phone', 'availableHours'] as const;
      const data: Record<string, unknown> = {};
      for (const key of allowedSelf) {
        if (req.body && key in req.body) data[key] = req.body[key];
      }
      const updated = await prisma.user.update({ where: { id: targetId }, data });
      res.json(updated);
      return;
    }

    const editor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, brokerId: true, isTeamLead: true } });
    if (!editor) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { brokerId: true } });
    if (!target) {
      sendError(res, 404, API_MESSAGES.USER_NOT_FOUND);
      return;
    }

    let canEdit = false;
    let allowedKeys: readonly string[] = [];

    if (editor.role === 'ADMIN') {
      canEdit = true;
      allowedKeys = ['name', 'email', 'bio', 'image', 'phone', 'availableHours', 'brokerId', 'isTeamLead'];
    } else if (editor.role === 'BROKER' && target.brokerId === session.user.id) {
      canEdit = true;
      allowedKeys = ['name', 'email', 'bio', 'image', 'phone', 'availableHours', 'brokerId', 'isTeamLead', 'teamId'];
    } else if (editor.role === 'REALTOR' && editor.isTeamLead && target.brokerId === editor.brokerId) {
      canEdit = true;
      allowedKeys = ['name', 'bio', 'image', 'phone', 'availableHours'];
    }

    if (!canEdit) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }

    const data: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (req.body && key in req.body) data[key] = req.body[key];
    }
    // If broker is setting teamId, ensure the team belongs to this broker
    if (data.teamId !== undefined && editor.role === 'BROKER') {
      const teamId = data.teamId === '' || data.teamId === null ? null : (data.teamId as string);
      if (teamId) {
        const team = await prisma.team.findUnique({ where: { id: teamId }, select: { brokerId: true } });
        if (!team || team.brokerId !== session.user.id) {
          sendError(res, 400, 'Invalid team');
          return;
        }
      }
      data.teamId = teamId;
    }
    const updated = await prisma.user.update({ where: { id: targetId }, data });
    res.json(updated);
  }
  } catch (err) {
    console.error('[api/users/[id]]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
