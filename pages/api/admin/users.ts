import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

/** Admin only: list all users (id, name, email, role) for message-user dropdown etc. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'ADMIN') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const users = await prisma.user.findMany({
    where: {},
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });
  res.json(users);
}
