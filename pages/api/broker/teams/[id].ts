import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  const id = req.query.id as string;
  const team = await prisma.team.findUnique({ where: { id }, include: { members: true } });
  if (!team || team.brokerId !== session.user.id) return res.status(404).json({ error: 'Team not found' });

  if (req.method === 'GET') {
    return res.json(team);
  }

  if (req.method === 'PUT') {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name is required' });
    const updated = await prisma.team.update({ where: { id }, data: { name: name.trim() } });
    return res.json(updated);
  }

  if (req.method === 'DELETE') {
    await prisma.team.delete({ where: { id } });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
