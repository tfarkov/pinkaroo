import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const notifications = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } });
    res.json(notifications);
  } else if (req.method === 'PUT') {
    const { id } = req.body;
    await prisma.notification.update({ where: { id }, data: { read: true } });
    res.status(204).end();
  }
}
