import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  const { id } = req.query;

  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({ where: { id: id as string }, include: { listings: true, teamMembers: true, broker: true } });
    if (!user) return res.status(404).json({ error: API_MESSAGES.USER_NOT_FOUND });
    res.json(user);
  } else if (req.method === 'PUT') {
    const targetId = id as string;
    const isSelf = session.user.id === targetId;

    if (isSelf) {
      const allowedSelf = ['name', 'bio', 'image', 'phone', 'availableHours'] as const;
      const data: Record<string, unknown> = {};
      for (const key of allowedSelf) {
        if (req.body && key in req.body) data[key] = req.body[key];
      }
      const updated = await prisma.user.update({ where: { id: targetId }, data });
      return res.json(updated);
    }

    const editor = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, brokerId: true, isTeamLead: true } });
    if (!editor) return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });

    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { brokerId: true } });
    if (!target) return res.status(404).json({ error: API_MESSAGES.USER_NOT_FOUND });

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

    if (!canEdit) return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });

    const data: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (req.body && key in req.body) data[key] = req.body[key];
    }
    // If broker is setting teamId, ensure the team belongs to this broker
    if (data.teamId !== undefined && editor.role === 'BROKER') {
      const teamId = data.teamId === '' || data.teamId === null ? null : (data.teamId as string);
      if (teamId) {
        const team = await prisma.team.findUnique({ where: { id: teamId }, select: { brokerId: true } });
        if (!team || team.brokerId !== session.user.id) return res.status(400).json({ error: 'Invalid team' });
      }
      data.teamId = teamId;
    }
    const updated = await prisma.user.update({ where: { id: targetId }, data });
    res.json(updated);
  }
}
