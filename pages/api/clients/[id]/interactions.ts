import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../lib/constants';
import { requireMethod, sendError } from '../../../../lib/apiHelpers';

const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 15;

/**
 * Paginated interactions for a single client. Used by CRM with useInfiniteQuery
 * for scalable interaction logs. Indexed by (clientId, date).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const session = await getSession(req, res);
  const role = session?.user?.role as string | undefined;
  if (!session || (role !== 'REALTOR' && role !== 'BROKER')) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  const clientId = typeof req.query.id === 'string' ? req.query.id.trim() : undefined;
  if (!clientId) {
    sendError(res, 400, 'Client id required');
    return;
  }
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { userId: true } });
    if (!client || client.userId !== session.user.id) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }
    const page = Math.max(0, parseInt(String(req.query.page), 10) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_PAGE_SIZE));
    const [interactions, total] = await Promise.all([
      prisma.interaction.findMany({
        where: { clientId },
        orderBy: { date: 'desc' },
        skip: page * limit,
        take: limit,
      }),
      prisma.interaction.count({ where: { clientId } }),
    ]);
    const nextPage = (page + 1) * limit < total ? page + 1 : null;
    res.json({ interactions, nextPage, total });
  } catch (err) {
    console.error('[api/clients/[id]/interactions]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
