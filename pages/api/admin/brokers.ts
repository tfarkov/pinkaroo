import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'ADMIN') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  const brokers = await prisma.user.findMany({ where: { role: 'BROKER' }, include: { teamMembers: true } });
  res.json(brokers);
}
