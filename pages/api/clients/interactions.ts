import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'REALTOR') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const interactions = await prisma.interaction.findMany({
      where: { userId: session.user.id },
      include: { client: true },
      orderBy: { date: 'desc' },
    });
    return res.json(interactions);
  }

  if (req.method === 'POST') {
    const { clientId, type, details, date } = req.body;
    if (!clientId || !type || !details || !date) return res.status(400).json({ error: 'clientId, type, details, and date are required' });
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.userId !== session.user.id) return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });
    const interaction = await prisma.interaction.create({
      data: { clientId, type, details, date: new Date(date), userId: session.user.id },
    });
    return res.json(interaction);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
