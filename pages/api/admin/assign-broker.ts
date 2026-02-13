import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session || session.user.role !== 'ADMIN') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'POST') {
    const { realtorId, brokerId } = req.body;
    const realtor = await prisma.user.update({ where: { id: realtorId }, data: { brokerId } });
    const io = (globalThis as { io?: { to: (id: string) => { emit: (event: string, data: unknown) => void } } }).io;
    if (io) io.to(realtorId).emit('notification', { message: NOTIFICATION_MESSAGES.ASSIGNED_TO_BROKER });
    res.json(realtor);
  }
}
