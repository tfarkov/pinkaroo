import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  const role = session.user.role;
  const isAdmin = role === 'ADMIN';
  const isBroker = role === 'BROKER';
  const isTeamLeadRealtor = role === 'REALTOR' && (session.user as { isTeamLead?: boolean }).isTeamLead;
  if (!isAdmin && !isBroker && !isTeamLeadRealtor) return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });

  const where: { role: 'REALTOR'; brokerId?: string | null } = { role: 'REALTOR' };
  if (isBroker) where.brokerId = session.user.id;
  else if (isTeamLeadRealtor) where.brokerId = (session.user as { brokerId?: string | null }).brokerId ?? undefined;

  const realtors = await prisma.user.findMany({
    where,
    include: { broker: true, team: { select: { id: true, name: true } } },
  });
  res.json(realtors);
}
