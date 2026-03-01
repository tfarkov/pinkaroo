import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  const role = session.user.role;
  const isAdmin = role === 'ADMIN';
  const isBroker = role === 'BROKER';
  const isTeamLeadRealtor = role === 'REALTOR' && (session.user as { isTeamLead?: boolean }).isTeamLead;
  if (!isAdmin && !isBroker && !isTeamLeadRealtor) {
    sendError(res, 403, API_MESSAGES.FORBIDDEN);
    return;
  }
  try {
    const where: { role: 'REALTOR'; brokerId?: string | null } = { role: 'REALTOR' };
    if (isBroker) where.brokerId = session.user.id;
    else if (isTeamLeadRealtor) where.brokerId = (session.user as { brokerId?: string | null }).brokerId ?? undefined;
    const realtors = await prisma.user.findMany({
      where,
      include: { broker: true, team: true },
    });
    res.json(realtors);
  } catch (err) {
    console.error('[api/admin/realtors]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
