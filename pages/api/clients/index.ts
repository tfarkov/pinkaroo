import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  const role = session.user.role as string;
  if (!session || (role !== 'REALTOR' && role !== 'BROKER')) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const clients = await prisma.client.findMany({ where: { userId: session.user.id } });
    res.json(clients);
  } else if (req.method === 'POST') {
    const body = req.body as Record<string, unknown> & { linkedUserId?: string; fromUserId?: string; email?: string };
    const linkedId = body.linkedUserId ?? body.fromUserId;
    // Only allow adding users (USER role) as clients, not other brokers or realtors.
    if (linkedId && typeof linkedId === 'string') {
      const linkedUser = await prisma.user.findUnique({ where: { id: linkedId }, select: { role: true } });
      if (!linkedUser || linkedUser.role !== 'USER') {
        return res.status(403).json({ error: 'Only users (consumers) can be added as clients, not other realtors or brokers.' });
      }
    } else if (body.email && typeof body.email === 'string' && body.email.trim()) {
      const byEmail = await prisma.user.findUnique({ where: { email: body.email.trim() }, select: { role: true } });
      if (byEmail && byEmail.role !== 'USER') {
        return res.status(403).json({ error: 'Only users (consumers) can be added as clients, not other realtors or brokers.' });
      }
    }
    const { linkedUserId: _d1, fromUserId: _d2, ...rest } = body;
    const client = await prisma.client.create({ data: { ...rest, userId: session.user.id } });
    const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
    if (io) io.to(session.user.id).emit('notification', { message: NOTIFICATION_MESSAGES.NEW_CLIENT_ADDED });
    res.json(client);
  }
}
