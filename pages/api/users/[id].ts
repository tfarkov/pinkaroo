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
    if (session.user.id !== id && session.user.role !== 'ADMIN') return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });
    const updated = await prisma.user.update({ where: { id: id as string }, data: req.body });
    res.json(updated);
  }
}
