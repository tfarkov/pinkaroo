import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const teams = await prisma.team.findMany({
      where: { brokerId: session.user.id },
      include: { members: { select: { id: true, name: true, email: true, isTeamLead: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(teams);
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'name is required' });
    const team = await prisma.team.create({
      data: { name: name.trim(), brokerId: session.user.id },
    });
    return res.json(team);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
