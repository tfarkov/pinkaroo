import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session || session.user.role !== 'ADMIN') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  const realtors = await prisma.user.findMany({ where: { role: 'REALTOR' }, include: { broker: true } });
  res.json(realtors);
}
