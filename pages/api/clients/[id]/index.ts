import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  const role = session.user.role as string;
  if (!session || (role !== 'REALTOR' && role !== 'BROKER')) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });
  const { id } = req.query;

  if (req.method === 'GET') {
    const client = await prisma.client.findUnique({ where: { id: id as string }, include: { interactions: true } });
    if (!client || client.userId !== session.user.id) return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });
    let linkedUserId: string | null = null;
    if (client.email?.trim()) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: client.email.trim() },
        select: { id: true },
      });
      if (userByEmail) linkedUserId = userByEmail.id;
    }
    res.json({ ...client, linkedUserId });
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
