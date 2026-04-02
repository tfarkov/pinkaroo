import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { SAFE_USER_SELECT, applyRateLimit, canManageBrokersAndRealtors, requireMethod, requireIdParam, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();
const SAFE_USER_RESPONSE_SELECT = {
  ...SAFE_USER_SELECT,
  broker: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
} as const;

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
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_RESPONSE_SELECT,
    });
    if (!targetUser) {
      sendError(res, 404, API_MESSAGES.USER_NOT_FOUND);
      return;
    }
    const isSelf = session.user.id === id;
    const role = session.user.role;
    const isAdmin = canManageBrokersAndRealtors(role);
    const isBrokerEditor = role === 'BROKER' && targetUser.brokerId === session.user.id;
    const isTeamLeadEditor = role === 'REALTOR' && !!session.user.isTeamLead && !!session.user.brokerId && targetUser.brokerId === session.user.brokerId;
    if (!isSelf && !isAdmin && !isBrokerEditor && !isTeamLeadEditor) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }
    res.json(targetUser);
    return;
  }
  if (req.method === 'PUT') {
    if (!applyRateLimit(req, res, 'users-update', { max: 60, windowMs: 60_000 })) return;
    const targetId = id;
    const isSelf = session.user.id === targetId;

    if (isSelf) {
      const allowedSelf = ['name', 'bio', 'image', 'phone', 'availableHours'] as const;
      const data: Record<string, unknown> = {};
      for (const key of allowedSelf) {
        if (req.body && key in req.body) data[key] = req.body[key];
      }
      const updated = await prisma.user.update({ where: { id: targetId }, data, select: SAFE_USER_RESPONSE_SELECT });
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

    if (canManageBrokersAndRealtors(editor.role as string | undefined)) {
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
    const updated = await prisma.user.update({ where: { id: targetId }, data, select: SAFE_USER_RESPONSE_SELECT });
    res.json(updated);
  }
  } catch (err) {
    console.error('[api/users/[id]]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
