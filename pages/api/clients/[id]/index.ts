import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'REALTOR') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });
  const { id } = req.query;

  if (req.method === 'GET') {
    const client = await prisma.client.findUnique({ where: { id: id as string }, include: { interactions: true } });
    if (client.userId !== session.user.id) return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });
    res.json(client);
  } else if (req.method === 'PUT') {
    const existing = await prisma.client.findUnique({ where: { id: id as string } });
    if (!existing || existing.userId !== session.user.id) return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });
    const client = await prisma.client.update({ where: { id: id as string }, data: req.body });
    res.json(client);
  } else if (req.method === 'DELETE') {
    const existing = await prisma.client.findUnique({ where: { id: id as string } });
    if (!existing || existing.userId !== session.user.id) return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });
    await prisma.client.delete({ where: { id: id as string } });
    res.status(204).end();
  }
}
