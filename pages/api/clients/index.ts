import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'REALTOR') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const clients = await prisma.client.findMany({ where: { userId: session.user.id } });
    res.json(clients);
  } else if (req.method === 'POST') {
    const client = await prisma.client.create({ data: { ...req.body, userId: session.user.id } });
    const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
    if (io) io.to(session.user.id).emit('notification', { message: NOTIFICATION_MESSAGES.NEW_CLIENT_ADDED });
    res.json(client);
  }
}
